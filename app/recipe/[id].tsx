import * as Sentry from '@sentry/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClayPressable } from '../../components/ClayPressable';
import { generateRecipeInstructions, RecipeIngredient, RecipeInstructions, regenerateWithoutIngredient } from '../../utils/gemini';

// In-memory cache so tapping the same recipe twice is instant
const recipeCache = new Map<string, RecipeInstructions>();

export default function RecipeDetailScreen() {
    const { id, title, reasoning, ingredients } = useLocalSearchParams<{ id: string, title: string, reasoning: string, ingredients: string }>();
    const router = useRouter();
    const [instructions, setInstructions] = useState<RecipeInstructions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [confirmingIngredient, setConfirmingIngredient] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchRecipe() {
            try {
                let availableIngredients: string[] = [];
                if (ingredients) {
                    availableIngredients = JSON.parse(decodeURIComponent(ingredients));
                }

                // Check in-memory cache first
                const cached = recipeCache.get(id);
                if (cached) {
                    setInstructions(cached);
                    setIsLoading(false);
                    return;
                }

                const details = await generateRecipeInstructions(title, availableIngredients);
                recipeCache.set(id, details); // Cache for future taps
                setInstructions(details);
            } catch (err) {
                Sentry.captureException(err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }

        if (title) {
            fetchRecipe();
        }
    }, [id, title, ingredients]);

    const handleDontHaveThis = (ingredient: RecipeIngredient) => {
        setConfirmingIngredient(ingredient.name);
    };

    const handleRegenerate = async (ingredientName: string) => {
        setConfirmingIngredient(null);
        setIsRegenerating(true);
        try {
            let availableIngredients: string[] = [];
            if (ingredients) {
                availableIngredients = JSON.parse(decodeURIComponent(ingredients));
            }
            const updated = await regenerateWithoutIngredient(
                title,
                instructions!.ingredientsList,
                ingredientName,
                availableIngredients,
            );
            recipeCache.set(id, updated);
            setInstructions(updated);
        } catch (err) {
            Sentry.captureException(err);
            if (Platform.OS === 'web') {
                window.alert('Failed to regenerate recipe. Please try again.');
            }
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <ClayPressable style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft color="#DC2626" size={28} />
                </ClayPressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                {/* Spacer to align title evenly */}
                <View style={{ width: 48 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#CA8A04" />
                        <Text style={styles.loadingText}>Writing your recipe...</Text>
                    </View>
                ) : error || !instructions ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>Oops! The chef burned this recipe. Please try another.</Text>
                    </View>
                ) : (
                    <View>
                        {/* Reasoning Card */}
                        {!!reasoning && reasoning !== 'undefined' && (
                            <View style={[styles.card, { backgroundColor: '#FEF9C3', borderColor: '#FDE047' }]}>
                                <Text style={styles.sectionTitle}>Why this recipe?</Text>
                                <Text style={[styles.listText, { fontStyle: 'italic', color: '#854D0E', marginTop: 8 }]}>
                                    {decodeURIComponent(reasoning)}
                                </Text>
                            </View>
                        )}

                        {/* Ingredients Card */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Ingredients</Text>
                            {isRegenerating && (
                                <View style={styles.regeneratingBanner}>
                                    <ActivityIndicator size="small" color="#CA8A04" />
                                    <Text style={styles.regeneratingText}>Reworking recipe...</Text>
                                </View>
                            )}
                            {instructions.ingredientsList.map((item, idx) => (
                                <View key={idx}>
                                    <View style={styles.listItem}>
                                        <View style={[styles.bullet, item.assumed && styles.assumedBullet]} />
                                        <View style={styles.ingredientRow}>
                                            <Text style={styles.listText}>{item.name}</Text>
                                            {item.assumed && (
                                                <View style={styles.assumedBadgeRow}>
                                                    <View style={styles.assumedBadge}>
                                                        <Text style={styles.assumedBadgeText}>🏠 Assumed</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.dontHaveButton}
                                                        onPress={() => handleDontHaveThis(item)}
                                                        disabled={isRegenerating}
                                                    >
                                                        <Text style={styles.dontHaveText}>I don't have this</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    {/* Inline confirmation panel */}
                                    {confirmingIngredient === item.name ? (
                                        <View style={styles.confirmPanel}>
                                            <Text style={styles.confirmText}>Regenerate this recipe without "{item.name}"?</Text>
                                            <View style={styles.confirmButtons}>
                                                <TouchableOpacity style={styles.confirmYes} onPress={() => handleRegenerate(item.name)}>
                                                    <Text style={styles.confirmYesText}>Yes, regenerate</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmingIngredient(null)}>
                                                    <Text style={styles.confirmCancelText}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        {/* Steps Card */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Instructions</Text>
                            {instructions.steps.map((step, idx) => (
                                <View key={idx} style={styles.stepItem}>
                                    <View style={styles.stepNumberContainer}>
                                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                                    </View>
                                    <Text style={styles.listText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7ED' },
    header: {
        paddingTop: 64,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 4,
        borderColor: '#FECACA',
        borderTopWidth: 0,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 6,
        zIndex: 10,
    },
    headerTitle: {
        fontFamily: 'Playfair Display SC',
        fontSize: 22,
        fontWeight: '700',
        color: '#450A0A',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#FECACA',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 0,
        elevation: 3,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 16,
        fontFamily: 'Karla',
        fontSize: 18,
        color: '#CA8A04',
        fontWeight: '600',
    },
    errorText: {
        fontFamily: 'Karla',
        fontSize: 18,
        color: '#DC2626',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 4,
        borderColor: '#FED7AA',
        shadowColor: '#C2410C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 0,
        elevation: 6,
    },
    sectionTitle: {
        fontFamily: 'Playfair Display SC',
        fontSize: 24,
        fontWeight: '700',
        color: '#CA8A04',
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bullet: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#F87171',
        marginTop: 7,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FECACA',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    stepNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 3,
        borderColor: '#FECACA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        marginTop: -2,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 2,
    },
    stepNumber: {
        fontFamily: 'Karla',
        fontWeight: '700',
        color: '#DC2626',
        fontSize: 14,
    },
    listText: {
        fontFamily: 'Karla',
        fontSize: 16,
        color: '#450A0A',
        flex: 1,
        lineHeight: 24,
    },
    assumedBullet: {
        backgroundColor: '#F59E0B',
        borderColor: '#FDE68A',
    },
    ingredientRow: {
        flex: 1,
    },
    assumedBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    assumedBadge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    assumedBadgeText: {
        fontFamily: 'Karla',
        fontSize: 12,
        color: '#92400E',
        fontWeight: '600',
    },
    dontHaveButton: {
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    dontHaveText: {
        fontFamily: 'Karla',
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    regeneratingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF9C3',
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FDE047',
        gap: 8,
    },
    regeneratingText: {
        fontFamily: 'Karla',
        fontSize: 14,
        color: '#854D0E',
        fontWeight: '600',
    },
    confirmPanel: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        marginLeft: 22,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    confirmText: {
        fontFamily: 'Karla',
        fontSize: 14,
        color: '#450A0A',
        marginBottom: 10,
        lineHeight: 20,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    confirmYes: {
        flex: 1,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
    },
    confirmYesText: {
        fontFamily: 'Karla',
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    confirmCancel: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    confirmCancelText: {
        fontFamily: 'Karla',
        fontSize: 13,
        color: '#450A0A',
        fontWeight: '600',
    },
});
