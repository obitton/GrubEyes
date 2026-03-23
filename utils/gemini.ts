import { GoogleGenAI } from "@google/genai";
import * as Sentry from '@sentry/react-native';
import { z } from "zod";
import { EaterProfile } from './storage';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// ---------------------------------------------------------------------------
// 1. Zod Schemas (runtime validation) + JSON Schemas (Gemini API enforcement)
//    NOTE: zod-to-json-schema is INCOMPATIBLE with Zod v4.
//    We write JSON schemas by hand for the Gemini API and keep Zod for parsing.
// ---------------------------------------------------------------------------

export const RecipeSchema = z.object({
    id: z.string(),
    title: z.string(),
    prepTime: z.string(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    shortDescription: z.string(),
    dietaryReasoning: z.string(),
});

export type RecipePreview = z.infer<typeof RecipeSchema>;

const RecipeListResponseSchema = z.object({
    recipes: z.array(RecipeSchema),
});

const IngredientsResponseSchema = z.object({
    ingredients: z.array(z.string()),
});

const RecipeIngredientSchema = z.object({
    name: z.string(),
    assumed: z.boolean(),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

const RecipeInstructionsSchema = z.object({
    ingredientsList: z.array(RecipeIngredientSchema),
    steps: z.array(z.string()),
});

export type RecipeInstructions = z.infer<typeof RecipeInstructionsSchema>;

// JSON Schemas for Gemini API structured output enforcement
const INGREDIENTS_JSON_SCHEMA = {
    type: "object",
    properties: {
        ingredients: {
            type: "array",
            items: { type: "string" },
            description: "A list of ingredient names extracted from the photo.",
        },
    },
    required: ["ingredients"],
};

const RECIPE_LIST_JSON_SCHEMA = {
    type: "object",
    properties: {
        recipes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", description: "A unique 8-character alphanumeric identifier." },
                    title: { type: "string", description: "The name of the recipe." },
                    prepTime: { type: "string", description: "Estimated preparation time (e.g. '15 mins')." },
                    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"], description: "Difficulty level." },
                    shortDescription: { type: "string", description: "A mouth-watering 1 sentence description." },
                    dietaryReasoning: { type: "string", description: "A 1-2 sentence explanation of why this dish was chosen. If the users provided specific likes, dislikes, or allergies, explain how it accommodates them. If no preferences were provided, just explain what the recipe is and why it's good." },
                },
                required: ["id", "title", "prepTime", "difficulty", "shortDescription", "dietaryReasoning"],
            },
            description: "Exactly 5 structured recipes.",
        },
    },
    required: ["recipes"],
};

const RECIPE_INSTRUCTIONS_JSON_SCHEMA = {
    type: "object",
    properties: {
        ingredientsList: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Ingredient name with approximate measurement (e.g. '2 cups flour')." },
                    assumed: { type: "boolean", description: "true if this ingredient was NOT in the user's scanned/available list and was added by the chef (pantry staple or creative liberty). false if it was in the available list." },
                },
                required: ["name", "assumed"],
            },
            description: "List of needed ingredients, each flagged as available or assumed.",
        },
        steps: {
            type: "array",
            items: { type: "string" },
            description: "Step-by-step cooking instructions.",
        },
    },
    required: ["ingredientsList", "steps"],
};

// ---------------------------------------------------------------------------
// 2. Core VLM & Text Pipeline Functions
// ---------------------------------------------------------------------------

export async function extractIngredientsFromImage(base64Image: string): Promise<string[]> {
    try {
        const prompt = "Analyze this image and extract all visible cooking ingredients. Return a JSON object with an 'ingredients' array containing ONLY the identified items.";

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Image.replace(/^data:image\/\w+;base64,/, ""),
                        mimeType: "image/jpeg"
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: INGREDIENTS_JSON_SCHEMA,
            }
        });

        if (!response.text) return [];

        let data = JSON.parse(response.text);

        // Handle Gemini hallucination if it ignores schema wrapping and returns a raw array
        if (Array.isArray(data)) {
            data = { ingredients: data };
        }

        const parsed = IngredientsResponseSchema.parse(data);
        return parsed.ingredients;
    } catch (error) {
        Sentry.captureException(error);
        console.error("[Sentry] Gemini VLM Error:", error);
        throw error;
    }
}

export interface RecipeGenerationOptions {
    ingredients: string[];
    avoidTitles?: string[];
    eaters?: EaterProfile[];
}

export async function generateRecipes(options: RecipeGenerationOptions): Promise<RecipePreview[]> {
    const {
        ingredients,
        avoidTitles = [],
        eaters = [],
    } = options;

    try {
        let prompt = `You are a world-class chef. Given these ingredients: ${ingredients.join(", ")}, generate a JSON object with a 'recipes' array containing exactly 5 creative recipes. EXACT FORMAT REQUIRED: Each item in the 'recipes' array MUST be an object containing the keys: 'id' (string), 'title' (string), 'prepTime' (string), 'difficulty' ('Easy' | 'Medium' | 'Hard'), 'shortDescription' (string), and 'dietaryReasoning' (string).`;

        if (avoidTitles.length > 0) {
            prompt += `\nIMPORTANT: Do NOT generate any recipes matching or very similar to these titles: ${avoidTitles.map(t => `"${t}"`).join(", ")}. I want 5 completely new recipes.`;
        }

        let hasAnyPreferences = false;
        if (eaters.length > 0) {
            prompt += `\n\nWHO'S EATING (generate recipes ALL these people can enjoy):`;
            for (const eater of eaters) {
                // Use "You (the user)" for the owner profile so the AI
                // writes natural second-person language instead of "Me's".
                const displayName = eater.isMe ? 'You (the user)' : eater.name;
                const possessive = eater.isMe ? 'your' : `${eater.name}'s`;

                let eaterLine = `\n- ${displayName}`;
                let hasPersonalPref = false;

                if (eater.allergies.length > 0) {
                    eaterLine += ` (ALLERGY — MUST NOT include: ${eater.allergies.join(", ")})`;
                    hasPersonalPref = true;
                }
                if (eater.likes && eater.likes.length > 0) {
                    eaterLine += ` (${possessive} personal likes: ${eater.likes.join(", ")})`;
                    hasPersonalPref = true;
                }
                if (eater.dislikes && eater.dislikes.length > 0) {
                    eaterLine += ` (${possessive} personal dislikes — avoid in the recipe: ${eater.dislikes.join(", ")})`;
                    hasPersonalPref = true;
                }
                if (eater.notes && eater.notes.length > 0) {
                    eaterLine += ` (notes: ${eater.notes.join("; ")})`;
                    hasPersonalPref = true;
                }

                if (hasPersonalPref) {
                    hasAnyPreferences = true;
                }
                prompt += eaterLine;
            }

            if (hasAnyPreferences) {
                prompt += `\nIMPORTANT: Since everyone eats the SAME dish, if ANY person dislikes an ingredient, avoid it from the recipe entirely. Allergies are HARD constraints (never include allergens). Dislikes are strong suggestions (avoid from the recipe when any eater dislikes them). Likes are soft suggestions (nice to include but not required). In the dietaryReasoning field, attribute preferences to the correct person by name (e.g. "avoids strawberries because you dislike them" not "both dislike strawberries"). When referring to "You (the user)", write in second-person ("your", "for you") — never say "Me's" or "Me dislikes".`;
            } else {
                prompt += `\nIMPORTANT: In the dietaryReasoning field, explain what the recipe is and why it's a great choice for the provided ingredients. Do NOT invent or hallucinate any personal likes, dislikes, or allergies, because none were provided. When referring to "You (the user)", write in second-person ("your", "for you").`;
            }
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: RECIPE_LIST_JSON_SCHEMA,
            }
        });

        if (!response.text) return [];

        let data = JSON.parse(response.text);
        if (Array.isArray(data)) {
            data = { recipes: data };
        }

        const parsed = RecipeListResponseSchema.parse(data);
        return parsed.recipes;
    } catch (error) {
        Sentry.captureException(error);
        console.error("[Sentry] Gemini Generation Error:", error);
        throw error;
    }
}

/**
 * Generates the full step-by-step instructions for a specific recipe when clicked.
 */
export async function generateRecipeInstructions(title: string, availableIngredients: string[]): Promise<RecipeInstructions> {
    try {
        const prompt = `Generate the full recipe instructions for a dish called "${title}", prioritizing the use of these available ingredients: ${availableIngredients.join(", ")}. You may add common pantry staples if needed, but you MUST flag them.

For each ingredient, return an object with:
- "name": the ingredient with measurement (e.g. "2 cups flour")
- "assumed": false if the ingredient (or a close variant) was in the available list above, true if YOU added it (pantry staple, creative liberty, or any ingredient not provided by the user).

Return a JSON object with 'ingredientsList' (array of {name, assumed} objects) and 'steps' (array of strings).`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: RECIPE_INSTRUCTIONS_JSON_SCHEMA,
            }
        });

        if (!response.text) throw new Error("Failed to generate instructions.");

        const data = JSON.parse(response.text);
        const parsed = RecipeInstructionsSchema.parse(data);
        return parsed;
    } catch (error) {
        Sentry.captureException(error);
        console.error("[Sentry] Gemini Instructions Generation Error:", error);
        throw error;
    }
}

/**
 * Regenerates a recipe excluding a specific ingredient, with an optional replacement suggestion.
 */
export async function regenerateWithoutIngredient(
    title: string,
    currentIngredients: RecipeIngredient[],
    excludeIngredient: string,
    availableIngredients: string[],
): Promise<RecipeInstructions> {
    try {
        const remaining = currentIngredients
            .filter(i => i.name.toLowerCase() !== excludeIngredient.toLowerCase())
            .map(i => i.name);

        const prompt = `The user is making "${title}" but does NOT have: "${excludeIngredient}". Regenerate the recipe WITHOUT that ingredient. Available ingredients the user has: ${availableIngredients.join(", ")}. Current recipe uses: ${remaining.join(", ")}.

Either substitute "${excludeIngredient}" with something from the available list, or rework the recipe to not need it. Flag any new additions as assumed.

Return a JSON object with 'ingredientsList' (array of {name: string, assumed: boolean} objects) and 'steps' (array of strings).`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: RECIPE_INSTRUCTIONS_JSON_SCHEMA,
            }
        });

        if (!response.text) throw new Error("Failed to regenerate recipe.");

        const data = JSON.parse(response.text);
        const parsed = RecipeInstructionsSchema.parse(data);
        return parsed;
    } catch (error) {
        Sentry.captureException(error);
        console.error("[Sentry] Gemini Regenerate Error:", error);
        throw error;
    }
}
