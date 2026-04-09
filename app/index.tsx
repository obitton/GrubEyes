import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClayPressable } from '../components/ClayPressable';
import { IngredientEditor } from '../components/IngredientEditor';
import { IngredientScanner } from '../components/IngredientScanner';
import { WhosEating } from '../components/WhosEating';
import { extractIngredientsFromImage, generateRecipes, RecipePreview } from '../utils/gemini';
import {
  addDislikeToProfile, addLikeToProfile, addRecipeHistory, AppData,
  EaterProfile, getMeProfile, loadAppData, removeEater, saveEater
} from '../utils/storage';

type FlowState = 'idle' | 'scanning' | 'extracting' | 'editing' | 'cooking' | 'results';

export default function Index() {
  const router = useRouter();
  const [flow, setFlow] = useState<FlowState>('idle');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [appData, setAppData] = useState<AppData>({ recipeHistory: [], eaters: [] });
  const [selectedEaterIds, setSelectedEaterIds] = useState<string[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    loadAppData().then((data) => {
      setAppData(data);
      // Auto-select all eaters by default
      setSelectedEaterIds(data.eaters.map(e => e.id));
    });
  }, []);

  const meProfile = getMeProfile(appData);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      handleCapture(result.assets[0].uri);
    }
  };

  const handleCapture = async (uri: string) => {
    setFlow('extracting');
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipResult.base64) throw new Error("Image compression failed.");
      const extracted = await extractIngredientsFromImage(manipResult.base64);
      if (extracted.length === 0) {
        Alert.alert("Uh oh", "Couldn't see any ingredients clearly. Try again!");
        setFlow('idle');
        return;
      }
      setIngredients(extracted);
      setFlow('editing');
    } catch {
      Alert.alert("Cooking Error", "Our AI chef dropped a pan. Please try again.");
      setFlow('idle');
    }
  };

  const handleCookThese = async () => {
    if (ingredients.length === 0) return;
    setFlow('cooking');
    try {
      const selectedEaters = appData.eaters.filter(e => selectedEaterIds.includes(e.id));
      const newRecipes = await generateRecipes({
        ingredients,
        avoidTitles: appData.recipeHistory,
        eaters: selectedEaters,
      });
      setRecipes(newRecipes);
      const updated = await addRecipeHistory(newRecipes.map(r => r.title));
      setAppData(updated);
      setFlow('results');
    } catch {
      Alert.alert("Cooking Error", "Couldn't cook up ideas right now.");
      setFlow('editing');
    }
  };

  const handleRefresh = async () => {
    if (ingredients.length === 0) return;
    setFlow('cooking');
    try {
      const selectedEaters = appData.eaters.filter(e => selectedEaterIds.includes(e.id));
      const newRecipes = await generateRecipes({
        ingredients,
        avoidTitles: appData.recipeHistory,
        eaters: selectedEaters,
      });
      setRecipes(newRecipes);
      const updated = await addRecipeHistory(newRecipes.map(r => r.title));
      setAppData(updated);
      setFlow('results');
    } catch {
      Alert.alert("Refresh Error", "Couldn't cook up new ideas right now.");
      setFlow('results');
    }
  };

  // 👎/👍 on scanned ingredients → updates "Me" profile
  const handleDislike = async (ingredient: string) => {
    const updated = await addDislikeToProfile(meProfile.id, ingredient);
    setAppData(updated);
  };

  const handleLike = async (ingredient: string) => {
    const updated = await addLikeToProfile(meProfile.id, ingredient);
    setAppData(updated);
  };

  const handleSaveEater = async (eater: EaterProfile) => {
    const updated = await saveEater(eater);
    setAppData(updated);
    if (!selectedEaterIds.includes(eater.id)) {
      setSelectedEaterIds(prev => [...prev, eater.id]);
    }
  };

  const handleDeleteEater = async (id: string) => {
    const updated = await removeEater(id);
    setAppData(updated);
    setSelectedEaterIds(prev => prev.filter(eid => eid !== id));
  };

  const handleToggleEater = (id: string) => {
    setSelectedEaterIds(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  if (flow === 'scanning') {
    return <IngredientScanner onCapture={handleCapture} />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <Image source={require('../assets/images/app-logo.png')} style={styles.headerIcon} />
          </View>
          <Text style={styles.headerTitle}>GrubEyes</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {(flow === 'extracting' || flow === 'cooking') ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#CA8A04" />
              <Text style={styles.loadingText}>
                {flow === 'extracting' ? 'Scanning your ingredients...' : 'The Chef is thinking...'}
              </Text>
            </View>

          ) : flow === 'editing' ? (
            <View>
              <IngredientEditor
                ingredients={ingredients}
                meProfile={meProfile}
                onUpdate={setIngredients}
                onDislike={handleDislike}
                onLike={handleLike}
              />

              <WhosEating
                eaters={appData.eaters}
                selectedIds={selectedEaterIds}
                onToggle={handleToggleEater}
                onSaveEater={handleSaveEater}
                onDeleteEater={handleDeleteEater}
              />

              <ClayPressable style={styles.cookButton} onPress={handleCookThese}>
                <Text style={styles.cookButtonText}>🍳 Cook These!</Text>
              </ClayPressable>
            </View>

          ) : flow === 'results' ? (
            <View>
              <View style={styles.ingredientsPill}>
                <Text style={styles.ingredientsText}>Cooking with: {ingredients.join(', ')}</Text>
                {selectedEaterIds.length > 0 && (
                  <Text style={styles.eatersText}>
                    For: {appData.eaters.filter(e => selectedEaterIds.includes(e.id)).map(e => e.name).join(', ')}
                  </Text>
                )}
              </View>

              {recipes.map((recipe, index) => (
                <ClayPressable
                  key={index}
                  style={styles.card}
                  onPress={() => {
                    const ingredientsQuery = encodeURIComponent(JSON.stringify(ingredients));
                    const reasoningQuery = recipe.dietaryReasoning ? `&reasoning=${encodeURIComponent(recipe.dietaryReasoning)}` : '';
                    router.push(`/recipe/${recipe.id}?title=${encodeURIComponent(recipe.title)}${reasoningQuery}&ingredients=${ingredientsQuery}` as any)
                  }}
                >
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDescription}>{recipe.shortDescription}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaBadge, styles.timeBadge]}>{recipe.prepTime}</Text>
                    <Text style={[styles.metaBadge, styles.difficultyBadge]}>{recipe.difficulty}</Text>
                  </View>
                </ClayPressable>
              ))}

              <View style={styles.resultActions}>
                <ClayPressable style={styles.refreshButton} onPress={handleRefresh}>
                  <Image source={require('../assets/images/btn-refresh.png')} style={styles.refreshIcon} />
                  <Text style={styles.refreshText}>New Recipes</Text>
                </ClayPressable>
                <ClayPressable style={styles.editButton} onPress={() => setFlow('editing')}>
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </ClayPressable>
              </View>
            </View>

          ) : (
            <View style={styles.centerContainer}>
              <Image source={require('../assets/images/empty-state.png')} style={styles.emptyStateImage} />
              <Text style={styles.emptyText}>Let's see what we're working with! 👀 Snap a photo of your ingredients to get started.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {(flow === 'idle' || flow === 'editing' || flow === 'results') && (
        <View style={styles.fabContainer}>
          <ClayPressable style={[styles.fab, { backgroundColor: '#FEF2F2', marginRight: 16 }]} onPress={handlePickImage}>
            <Image source={require('../assets/images/btn-gallery.png')} style={styles.fabImage} />
          </ClayPressable>
          <ClayPressable style={[styles.fab, { backgroundColor: '#FEF9C3' }]} onPress={() => setFlow('scanning')}>
            <Image source={require('../assets/images/btn-camera.png')} style={styles.fabImage} />
          </ClayPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  header: {
    paddingTop: 64, paddingBottom: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#FECACA', borderTopWidth: 0,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 0, elevation: 6, zIndex: 10,
  },
  headerTitle: { fontFamily: 'Playfair Display SC', fontSize: 28, fontWeight: '700', color: '#450A0A', marginLeft: 12 },
  headerIconWrapper: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: '#FECACA', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  headerIcon: { width: 44, height: 44, transform: [{ scale: 1.5 }] },
  scrollContent: { padding: 20, paddingBottom: 120 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loadingText: { marginTop: 16, fontFamily: 'Karla', fontSize: 18, color: '#CA8A04', fontWeight: '600' },
  emptyStateImage: { width: 240, height: 240, borderRadius: 32, borderWidth: 6, borderColor: '#FED7AA', marginBottom: 32 },
  emptyText: { fontFamily: 'Karla', fontSize: 20, color: '#450A0A', textAlign: 'center', opacity: 0.7 },
  ingredientsPill: {
    backgroundColor: '#FEF2F2', padding: 16, borderRadius: 20, borderWidth: 3, borderColor: '#FECACA', marginBottom: 24,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 3,
  },
  ingredientsText: { fontFamily: 'Karla', fontSize: 16, color: '#450A0A', fontWeight: '600' },
  eatersText: { fontFamily: 'Karla', fontSize: 14, color: '#78716C', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, marginBottom: 18,
    borderWidth: 4, borderColor: '#FED7AA',
    shadowColor: '#C2410C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 0, elevation: 6,
  },
  recipeTitle: { fontFamily: 'Playfair Display SC', fontSize: 22, fontWeight: '700', color: '#DC2626', marginBottom: 8 },
  recipeDescription: { fontFamily: 'Karla', fontSize: 16, color: '#450A0A', marginBottom: 16, lineHeight: 24 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaBadge: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, fontFamily: 'Karla',
    fontWeight: '700', fontSize: 14, borderWidth: 3, overflow: 'hidden',
  },
  timeBadge: { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
  difficultyBadge: { backgroundColor: '#FEF9C3', color: '#A16207', borderColor: '#FDE68A' },
  cookButton: {
    backgroundColor: '#CA8A04', borderRadius: 22, padding: 18, alignItems: 'center',
    borderWidth: 4, borderColor: '#A16207',
    shadowColor: '#92400E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 6, marginTop: 8,
  },
  cookButtonText: { fontFamily: 'Karla', fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  refreshButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderWidth: 4, borderColor: '#FECACA', padding: 14, borderRadius: 22,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 0, elevation: 4,
  },
  refreshIcon: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  refreshText: { color: '#DC2626', fontFamily: 'Karla', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  editButton: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF9C3',
    borderWidth: 4, borderColor: '#FDE68A', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 22,
    shadowColor: '#92400E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 0, elevation: 4,
  },
  editButtonText: { fontFamily: 'Karla', fontWeight: '700', fontSize: 16, color: '#A16207' },
  fabContainer: { position: 'absolute', bottom: 36, alignSelf: 'center', flexDirection: 'row' },
  fab: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: '#CA8A04',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FEF9C3',
    shadowColor: '#92400E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 8, overflow: 'hidden',
  },
  fabImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});
