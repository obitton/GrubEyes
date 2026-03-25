# GrubEyes 🍳�

GrubEyes is an intelligent, camera-first Expo React Native application that helps you figure out what to cook based on the ingredients you have on hand. Simply take a picture of your pantry or fridge, and GrubEyes will use the Google Gemini API to identify your ingredients and generate creative, customized recipe ideas tailored to your dietary preferences (likes, dislikes, and allergies).

## Features

- **Ingredient Scanning:** Use your device's camera to seamlessly extract ingredient lists from photos.
- **AI Recipe Generation:** Powered by Gemini 3 Flash, providing 5 unique and creative recipe suggestions based on your available ingredients.
- **Dietary Personalization:** Create profiles for yourself or your family members with specific likes, dislikes, and allergies to ensure every recipe is a hit.
- **Step-by-Step Instructions:** Get comprehensive cooking instructions, prep times, difficulty levels, and a breakdown of which ingredients were assumed versus available.
- **Recipe Reworking:** Easily regenerate a recipe if you're missing an ingredient or want a different option.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn
- Expo CLI

## Getting Started

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up Environment Variables:**

   Create a `.env.local` file in the root directory of the project. 

   **Required:**
   - \`EXPO_PUBLIC_GEMINI_API_KEY\`: Your Google Gemini API Key. This is required for the core AI features (ingredient scanning and recipe generation) to work.

   **Optional:**
   - \`SENTRY_AUTH_TOKEN\`: Your Sentry API key/auth token. This is only needed if you want to upload source maps to Sentry for error tracking during production builds. If you don't use Sentry, you can safely skip this.

   Your \`.env.local\` should look like this:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
   
   # Optional
   SENTRY_AUTH_TOKEN="your_sentry_auth_token_here"
   ```

3. **Start the Application:**

   ```bash
   npx expo start
   ```

   You can then open the app on your physical device using the Expo Go app, or run it on an iOS Simulator (`i`) or Android Emulator (`a`). 

## Project Structure

- `app/`: Contains the Expo Router file-based routing (screens and layouts).
- `components/`: Reusable React components (e.g., `IngredientScanner`).
- `utils/`: Utility functions, including the Gemini API integration (`gemini.ts`) and local storage management (`storage.ts`).
- `design-system/`: Foundational UI components and styling.

## Technologies Used

- [Expo](https://expo.dev/) & [React Native](https://reactnative.dev/)
- [Google Gemini API](https://ai.google.dev/) (@google/genai)
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [Zod](https://zod.dev/) for schema validation
- [Sentry](https://sentry.io/) for error tracking (optional)
