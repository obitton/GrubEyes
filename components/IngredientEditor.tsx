import { Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { EaterProfile } from '../utils/storage';
import { ClayPressable } from './ClayPressable';

// Curated common food items for autocomplete suggestions
const COMMON_FOODS = [
    'Apples', 'Avocado', 'Bacon', 'Bananas', 'Beans', 'Beef', 'Bell Pepper',
    'Blueberries', 'Bread', 'Broccoli', 'Butter', 'Cabbage', 'Carrots',
    'Cauliflower', 'Celery', 'Cheddar Cheese', 'Chicken', 'Chickpeas',
    'Cilantro', 'Coconut Milk', 'Corn', 'Cottage Cheese', 'Cream Cheese',
    'Cucumber', 'Eggs', 'Flour', 'Garlic', 'Ginger', 'Grapes',
    'Greek Yogurt', 'Green Beans', 'Ground Beef', 'Ground Turkey', 'Ham',
    'Heavy Cream', 'Honey', 'Hot Sauce', 'Hummus', 'Jalapeño', 'Kale',
    'Ketchup', 'Lemon', 'Lettuce', 'Lime', 'Maple Syrup', 'Mayonnaise',
    'Milk', 'Mozzarella', 'Mushrooms', 'Mustard', 'Oats', 'Olive Oil',
    'Olives', 'Onion', 'Orange', 'Oregano', 'Parmesan', 'Parsley',
    'Pasta', 'Peanut Butter', 'Peas', 'Pepper', 'Pickles', 'Pineapple',
    'Pork', 'Potatoes', 'Ranch Dressing', 'Red Onion', 'Rice',
    'Salami', 'Salmon', 'Salsa', 'Salt', 'Sausage', 'Shrimp',
    'Sour Cream', 'Soy Sauce', 'Spinach', 'Sriracha', 'Strawberries',
    'Sugar', 'Sweet Potato', 'Tofu', 'Tomato', 'Tortillas', 'Tuna',
    'Turkey', 'Vanilla Extract', 'Vinegar', 'Walnuts', 'Watermelon',
    'Yogurt', 'Zucchini',
];

export { COMMON_FOODS };

interface IngredientEditorProps {
    ingredients: string[];
    meProfile: EaterProfile;
    onUpdate: (updated: string[]) => void;
    onDislike: (ingredient: string) => void;
    onLike: (ingredient: string) => void;
}

export function IngredientEditor({
    ingredients,
    meProfile,
    onUpdate,
    onDislike,
    onLike,
}: IngredientEditorProps) {
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = useMemo(() => {
        if (searchText.length < 2) return [];
        const query = searchText.toLowerCase();
        return COMMON_FOODS
            .filter(f =>
                f.toLowerCase().includes(query) &&
                !ingredients.some(i => i.toLowerCase() === f.toLowerCase())
            )
            .slice(0, 5);
    }, [searchText, ingredients]);

    const handleRemove = (ingredient: string) => {
        onUpdate(ingredients.filter(i => i !== ingredient));
    };

    const handleAdd = (food: string) => {
        if (!ingredients.some(i => i.toLowerCase() === food.toLowerCase())) {
            onUpdate([...ingredients, food]);
        }
        setSearchText('');
        setShowSuggestions(false);
    };

    const isDisliked = (i: string) => meProfile.dislikes.includes(i.toLowerCase());
    const isLiked = (i: string) => meProfile.likes.includes(i.toLowerCase());

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Your Ingredients</Text>
            <Text style={styles.subtitle}>
                Oops! Did my eyes deceive me? 👀 Tap ✕ to remove mistakes
            </Text>

            <View style={styles.pillContainer}>
                {ingredients.map((ingredient, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.pill,
                            isDisliked(ingredient) && styles.pillDisliked,
                            isLiked(ingredient) && styles.pillPreferred,
                        ]}
                    >
                        {/* Show a small indicator for persisted preferences */}
                        {isLiked(ingredient) && (
                            <Text style={styles.prefBadge}>💚</Text>
                        )}
                        {isDisliked(ingredient) && (
                            <Text style={styles.prefBadge}>👎</Text>
                        )}

                        <Text
                            style={[
                                styles.pillText,
                                isDisliked(ingredient) && styles.pillTextDisliked,
                            ]}
                        >
                            {ingredient}
                        </Text>

                        <View style={styles.pillActions}>
                            <ClayPressable
                                style={[styles.pillBtn, isLiked(ingredient) && styles.pillBtnActive]}
                                onPress={() => onLike(ingredient)}
                            >
                                <ThumbsUp
                                    size={14}
                                    color={isLiked(ingredient) ? '#CA8A04' : '#9CA3AF'}
                                    fill={isLiked(ingredient) ? '#CA8A04' : 'none'}
                                />
                            </ClayPressable>
                            <ClayPressable
                                style={[styles.pillBtn, isDisliked(ingredient) && styles.pillBtnActive]}
                                onPress={() => onDislike(ingredient)}
                            >
                                <ThumbsDown
                                    size={14}
                                    color={isDisliked(ingredient) ? '#DC2626' : '#9CA3AF'}
                                    fill={isDisliked(ingredient) ? '#DC2626' : 'none'}
                                />
                            </ClayPressable>
                            <ClayPressable
                                style={styles.pillBtn}
                                onPress={() => handleRemove(ingredient)}
                            >
                                <X size={14} color="#DC2626" />
                            </ClayPressable>
                        </View>
                    </View>
                ))}
            </View>

            {/* Legend hint */}
            {ingredients.some(i => isLiked(i) || isDisliked(i)) && (
                <Text style={styles.legendHint}>
                    💚 = you love it · 👎 = not a fan (remembered from your profile)
                </Text>
            )}

            {/* Autocomplete Add */}
            <View style={styles.addSection}>
                <Text style={styles.addLabel}>Missing something? Add it:</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type to search..."
                        placeholderTextColor="#9CA3AF"
                        defaultValue=""
                        onChangeText={(text) => {
                            setSearchText(text);
                            setShowSuggestions(text.length >= 2);
                        }}
                        onSubmitEditing={() => {
                            if (searchText.trim()) handleAdd(searchText.trim());
                        }}
                    />
                    <ClayPressable
                        style={styles.addBtn}
                        onPress={() => {
                            if (searchText.trim()) handleAdd(searchText.trim());
                        }}
                    >
                        <Plus size={20} color="#FFFFFF" />
                    </ClayPressable>
                </View>

                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        {suggestions.map((suggestion, idx) => (
                            <ClayPressable
                                key={idx}
                                style={styles.suggestionItem}
                                onPress={() => handleAdd(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </ClayPressable>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    header: { fontSize: 20, fontWeight: '800', color: '#450A0A', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#78716C', marginBottom: 12, fontStyle: 'italic' },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    pill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
        borderRadius: 16, paddingVertical: 6, paddingLeft: 14, paddingRight: 4,
        borderWidth: 3, borderColor: '#FECACA',
        shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 3,
    },
    pillDisliked: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', opacity: 0.7 },
    pillPreferred: { borderColor: '#CA8A04', backgroundColor: '#FEF9C3' },
    pillText: { fontSize: 14, fontWeight: '600', color: '#450A0A', marginRight: 4 },
    pillTextDisliked: { textDecorationLine: 'line-through', color: '#9CA3AF' },
    pillActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    pillBtn: { padding: 4 },
    pillBtnActive: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 },
    prefBadge: { fontSize: 12, marginRight: 2 },
    legendHint: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 },
    addSection: { marginTop: 4 },
    addLabel: { fontSize: 14, fontWeight: '600', color: '#78716C', marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 3, borderColor: '#FED7AA',
        paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#450A0A',
        shadowColor: '#C2410C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3,
    },
    addBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#CA8A04',
        alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#A16207',
        shadowColor: '#92400E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 0, elevation: 4,
    },
    suggestionsBox: {
        backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 3, borderColor: '#FED7AA',
        marginTop: 8, overflow: 'hidden',
        shadowColor: '#C2410C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3,
    },
    suggestionItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#FEF2F2' },
    suggestionText: { fontSize: 15, color: '#450A0A', fontWeight: '500' },
});
