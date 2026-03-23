import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarId, AVATARS, DEFAULT_AVATAR } from './avatars';

const STORAGE_KEY = 'grubeyes_app_data';
const ME_PROFILE_ID = 'me';

export interface EaterProfile {
    id: string;
    name: string;
    avatar: AvatarId;
    likes: string[];      // quick-add autocomplete
    dislikes: string[];    // quick-add autocomplete
    allergies: string[];   // hard constraints
    notes: string[];       // freeform "anything else"
    isMe?: boolean;        // true for the auto-created profile
    emoji?: string;        // deprecated
}

export interface AppData {
    recipeHistory: string[];
    eaters: EaterProfile[];
}

function createMeProfile(): EaterProfile {
    return {
        id: ME_PROFILE_ID,
        name: 'Me',
        avatar: 'panda_content',
        likes: [],
        dislikes: [],
        allergies: [],
        notes: [],
        isMe: true,
    };
}

const DEFAULT_DATA: AppData = {
    recipeHistory: [],
    eaters: [createMeProfile()],
};

export function getMeProfile(data: AppData): EaterProfile {
    return data.eaters.find(e => e.isMe) ?? createMeProfile();
}

export async function loadAppData(): Promise<AppData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = { ...DEFAULT_DATA, ...JSON.parse(raw) };
            // Ensure "Me" profile always exists
            if (!parsed.eaters.some((e: EaterProfile) => e.isMe)) {
                parsed.eaters.unshift(createMeProfile());
            }
            // Ensure each profile has likes/dislikes arrays and valid avatar (migration from emoji)
            parsed.eaters = parsed.eaters.map((e: any) => {
                const avatar: AvatarId = e.avatar && Object.keys(AVATARS).includes(e.avatar)
                    ? e.avatar
                    : DEFAULT_AVATAR;

                return {
                    ...e,
                    avatar: e.isMe ? 'panda_content' : avatar, // ensure me is panda
                    likes: e.likes ?? [],
                    dislikes: e.dislikes ?? [],
                    emoji: undefined, // remove old emoji to save space
                };
            });
            return parsed;
        }
    } catch {
        // First launch or corrupted data — return defaults
    }
    return { ...DEFAULT_DATA, eaters: [createMeProfile()] };
}

export async function saveAppData(data: AppData): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Storage full or unavailable — fail silently
    }
}

// ----- Profile-level preference helpers -----

export async function addDislikeToProfile(profileId: string, ingredient: string): Promise<AppData> {
    const data = await loadAppData();
    const profile = data.eaters.find(e => e.id === profileId);
    if (!profile) return data;
    const lower = ingredient.toLowerCase();
    if (!profile.dislikes.includes(lower)) {
        profile.dislikes.push(lower);
    }
    // Remove from likes if it was there
    profile.likes = profile.likes.filter(i => i !== lower);
    await saveAppData(data);
    return data;
}

export async function addLikeToProfile(profileId: string, ingredient: string): Promise<AppData> {
    const data = await loadAppData();
    const profile = data.eaters.find(e => e.id === profileId);
    if (!profile) return data;
    const lower = ingredient.toLowerCase();
    if (!profile.likes.includes(lower)) {
        profile.likes.push(lower);
    }
    // Remove from dislikes if it was there
    profile.dislikes = profile.dislikes.filter(i => i !== lower);
    await saveAppData(data);
    return data;
}

export async function addRecipeHistory(titles: string[]): Promise<AppData> {
    const data = await loadAppData();
    data.recipeHistory = [...new Set([...data.recipeHistory, ...titles])];
    await saveAppData(data);
    return data;
}

export async function saveEater(eater: EaterProfile): Promise<AppData> {
    const data = await loadAppData();
    const idx = data.eaters.findIndex(e => e.id === eater.id);
    if (idx >= 0) {
        data.eaters[idx] = eater;
    } else {
        data.eaters.push(eater);
    }
    await saveAppData(data);
    return data;
}

export async function removeEater(id: string): Promise<AppData> {
    const data = await loadAppData();
    // Never delete "Me" profile
    if (data.eaters.find(e => e.id === id)?.isMe) return data;
    data.eaters = data.eaters.filter(e => e.id !== id);
    await saveAppData(data);
    return data;
}
