import { Image } from 'expo-image';
import { AlertTriangle, Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { AVATARS, AVATAR_IDS, AvatarId, DEFAULT_AVATAR } from '../utils/avatars';
import { EaterProfile } from '../utils/storage';
import { ClayPressable } from './ClayPressable';
import { COMMON_FOODS } from './IngredientEditor';

interface EaterModalProps {
    visible: boolean;
    eater?: EaterProfile | null;
    onSave: (eater: EaterProfile) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
}

// Reusable quick-add list with autocomplete
function QuickAddList({
    label,
    icon,
    items,
    color,
    onAdd,
    onRemove,
}: {
    label: string;
    icon: React.ReactNode;
    items: string[];
    color: string;
    onAdd: (item: string) => void;
    onRemove: (item: string) => void;
}) {
    const [text, setText] = useState('');

    const suggestions = useMemo(() => {
        if (text.length < 2) return [];
        const query = text.toLowerCase();
        return COMMON_FOODS
            .filter(f => f.toLowerCase().includes(query) && !items.some(i => i.toLowerCase() === f.toLowerCase()))
            .slice(0, 4);
    }, [text, items]);

    const handleAdd = (item: string) => {
        onAdd(item);
        setText('');
    };

    return (
        <View style={qStyles.section}>
            <View style={qStyles.labelRow}>
                {icon}
                <Text style={qStyles.label}>{label}</Text>
            </View>

            {/* Existing items as removable pills */}
            {items.length > 0 && (
                <View style={qStyles.pillRow}>
                    {items.map((item, idx) => (
                        <View key={idx} style={[qStyles.pill, { borderColor: color }]}>
                            <Text style={qStyles.pillText}>{item}</Text>
                            <ClayPressable style={qStyles.pillX} onPress={() => onRemove(item)}>
                                <X size={12} color={color} />
                            </ClayPressable>
                        </View>
                    ))}
                </View>
            )}

            {/* Quick-add input */}
            <View style={qStyles.inputRow}>
                <TextInput
                    style={qStyles.input}
                    placeholder="Type to add..."
                    placeholderTextColor="#9CA3AF"
                    defaultValue=""
                    onChangeText={setText}
                    onSubmitEditing={() => { if (text.trim()) handleAdd(text.trim()); }}
                />
                <ClayPressable
                    style={[qStyles.addBtn, { backgroundColor: color }]}
                    onPress={() => { if (text.trim()) handleAdd(text.trim()); }}
                >
                    <Plus size={16} color="#FFFFFF" />
                </ClayPressable>
            </View>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
                <View style={qStyles.suggestions}>
                    {suggestions.map((s, idx) => (
                        <ClayPressable key={idx} style={qStyles.suggestionItem} onPress={() => handleAdd(s)}>
                            <Text style={qStyles.suggestionText}>{s}</Text>
                        </ClayPressable>
                    ))}
                </View>
            )}
        </View>
    );
}

export function EaterModal({ visible, eater, onSave, onDelete, onClose }: EaterModalProps) {
    const [name, setName] = useState(eater?.name ?? '');
    const [avatar, setAvatar] = useState<AvatarId>(eater?.avatar ?? DEFAULT_AVATAR);
    const [likes, setLikes] = useState<string[]>(eater?.likes ?? []);
    const [dislikes, setDislikes] = useState<string[]>(eater?.dislikes ?? []);
    const [allergies, setAllergies] = useState<string[]>(eater?.allergies ?? []);
    const [notesText, setNotesText] = useState(eater?.notes?.join(', ') ?? '');

    React.useEffect(() => {
        if (visible) {
            setName(eater?.name ?? '');
            setAvatar(eater?.avatar ?? DEFAULT_AVATAR);
            setLikes(eater?.likes ?? []);
            setDislikes(eater?.dislikes ?? []);
            setAllergies(eater?.allergies ?? []);
            setNotesText(eater?.notes?.join(', ') ?? '');
        }
    }, [visible, eater]);

    const handleSave = () => {
        if (!name.trim() && !eater?.isMe) return; // 'Me' name is locked but others aren't
        const profile: EaterProfile = {
            id: eater?.id ?? Date.now().toString(),
            name: eater?.isMe ? 'Me' : name.trim(),
            avatar: eater?.isMe ? 'panda_content' : avatar,
            likes,
            dislikes,
            allergies,
            notes: notesText.split(',').map(s => s.trim()).filter(Boolean),
            isMe: eater?.isMe,
        };
        onSave(profile);
        onClose();
    };

    const addToList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        const lower = item.toLowerCase();
        if (!list.includes(lower)) setList(prev => [...prev, lower]);
    };

    const removeFromList = (setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        setList(prev => prev.filter(i => i !== item));
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                    automaticallyAdjustKeyboardInsets={true}
                >
                    <View style={styles.modalWrapper}>
                        <View style={styles.modal}>
                            <Text style={styles.title}>
                                {eater?.isMe ? '👨‍🍳 Edit My Preferences' : eater ? `Edit ${eater.name}` : '🍽️ Add an Eater'}
                            </Text>

                            {/* Emoji + Name row (hide emoji for "Me") */}
                            {!eater?.isMe && (
                                <>
                                    <Text style={styles.label}>Pick an avatar</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                                        {AVATAR_IDS.map((a) => (
                                            <ClayPressable
                                                key={a}
                                                style={[styles.emojiBtn, avatar === a && styles.emojiBtnSelected]}
                                                onPress={() => setAvatar(a)}
                                            >
                                                <Image source={AVATARS[a]} style={styles.avatarImg} />
                                            </ClayPressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.label}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Emma"
                                        placeholderTextColor="#9CA3AF"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </>
                            )}

                            {/* Quick-add Likes */}
                            <QuickAddList
                                label="Loves these 💚"
                                icon={<ThumbsUp size={16} color="#CA8A04" />}
                                items={likes}
                                color="#CA8A04"
                                onAdd={(item) => addToList(likes, setLikes, item)}
                                onRemove={(item) => removeFromList(setLikes, item)}
                            />

                            {/* Quick-add Dislikes */}
                            <QuickAddList
                                label="Dislikes 👎"
                                icon={<ThumbsDown size={16} color="#DC2626" />}
                                items={dislikes}
                                color="#DC2626"
                                onAdd={(item) => addToList(dislikes, setDislikes, item)}
                                onRemove={(item) => removeFromList(setDislikes, item)}
                            />

                            {/* Quick-add Allergies */}
                            <QuickAddList
                                label="⚠️ Allergies (hard constraints)"
                                icon={<AlertTriangle size={16} color="#EA580C" />}
                                items={allergies}
                                color="#EA580C"
                                onAdd={(item) => addToList(allergies, setAllergies, item)}
                                onRemove={(item) => removeFromList(setAllergies, item)}
                            />

                            {/* Freeform notes */}
                            <Text style={styles.label}>Other notes (optional)</Text>
                            <TextInput
                                style={[styles.input, styles.multiline]}
                                placeholder="e.g. only eats carrots if baked, no spicy food"
                                placeholderTextColor="#9CA3AF"
                                value={notesText}
                                onChangeText={setNotesText}
                                multiline
                            />

                            {/* Actions */}
                            <View style={styles.actions}>
                                <ClayPressable style={styles.cancelBtn} onPress={onClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </ClayPressable>

                                {eater && !eater.isMe && onDelete && (
                                    <ClayPressable
                                        style={styles.deleteBtn}
                                        onPress={() => { onDelete(eater.id); onClose(); }}
                                    >
                                        <Text style={styles.deleteText}>Delete</Text>
                                    </ClayPressable>
                                )}

                                <ClayPressable style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveText}>Save</Text>
                                </ClayPressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

// QuickAddList styles
const qStyles = StyleSheet.create({
    section: { marginTop: 14 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    label: { fontSize: 14, fontWeight: '700', color: '#78716C' },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    pill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 12, paddingVertical: 4, paddingLeft: 10, paddingRight: 4,
        borderWidth: 2,
    },
    pillText: { fontSize: 13, fontWeight: '600', color: '#450A0A', marginRight: 4 },
    pillX: { padding: 3 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    input: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB',
        paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#450A0A',
    },
    addBtn: {
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)',
    },
    suggestions: {
        backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB',
        marginTop: 4, overflow: 'hidden',
    },
    suggestionItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    suggestionText: { fontSize: 14, color: '#450A0A', fontWeight: '500' },
});

// Modal styles
const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' },
    scrollContent: { flexGrow: 1, padding: 20 },
    modalWrapper: { flex: 1, justifyContent: 'center' },
    modal: {
        backgroundColor: '#FFF7ED', borderRadius: 24, padding: 24,
        borderWidth: 4, borderColor: '#FED7AA',
        shadowColor: '#C2410C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 0, elevation: 10,
    },
    title: { fontSize: 22, fontWeight: '800', color: '#450A0A', textAlign: 'center', marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '700', color: '#78716C', marginBottom: 6, marginTop: 12 },
    emojiRow: { flexDirection: 'row', marginBottom: 4 },
    emojiBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 3, borderColor: '#FED7AA',
    },
    emojiBtnSelected: { borderColor: '#CA8A04', backgroundColor: '#FEF9C3' },
    avatarImg: { width: 32, height: 32, borderRadius: 16 },
    input: {
        backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 3, borderColor: '#FED7AA',
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#450A0A',
    },
    multiline: { minHeight: 60, textAlignVertical: 'top' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
    cancelBtn: {
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#F3F4F6', borderWidth: 3, borderColor: '#D1D5DB',
    },
    cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
    deleteBtn: {
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#FEF2F2', borderWidth: 3, borderColor: '#FECACA',
    },
    deleteText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
    saveBtn: {
        paddingHorizontal: 24, paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#CA8A04', borderWidth: 3, borderColor: '#A16207',
        shadowColor: '#92400E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 0, elevation: 4,
    },
    saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
