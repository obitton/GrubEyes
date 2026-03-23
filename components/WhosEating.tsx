import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AVATARS } from '../utils/avatars';
import { EaterProfile } from '../utils/storage';
import { ClayPressable } from './ClayPressable';
import { EaterModal } from './EaterModal';

interface WhosEatingProps {
    eaters: EaterProfile[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSaveEater: (eater: EaterProfile) => void;
    onDeleteEater: (id: string) => void;
}

export function WhosEating({
    eaters,
    selectedIds,
    onToggle,
    onSaveEater,
    onDeleteEater,
}: WhosEatingProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEater, setEditingEater] = useState<EaterProfile | null>(null);

    const handleAdd = () => {
        setEditingEater(null);
        setModalVisible(true);
    };

    const handleEdit = (eater: EaterProfile) => {
        setEditingEater(eater);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Who's Eating? 🍽️</Text>
            <Text style={styles.subtitle}>
                Tap to select, long-press to edit preferences
            </Text>

            <View style={styles.avatarRow}>
                {eaters.map((eater) => {
                    const isSelected = selectedIds.includes(eater.id);
                    return (
                        <ClayPressable
                            key={eater.id}
                            style={[styles.avatar, isSelected && styles.avatarSelected]}
                            onPress={() => onToggle(eater.id)}
                            onLongPress={() => handleEdit(eater)}
                        >
                            <Image source={AVATARS[eater.avatar]} style={styles.avatarImage} />
                            <Text
                                style={[styles.avatarName, isSelected && styles.avatarNameSelected]}
                                numberOfLines={1}
                            >
                                {eater.name}
                            </Text>
                            {eater.allergies.length > 0 && (
                                <Text style={styles.allergyBadge}>⚠️</Text>
                            )}
                        </ClayPressable>
                    );
                })}

                {/* Add button */}
                <ClayPressable style={styles.addBtn} onPress={handleAdd}>
                    <Plus size={24} color="#CA8A04" />
                    <Text style={styles.addText}>Add</Text>
                </ClayPressable>
            </View>

            <EaterModal
                visible={modalVisible}
                eater={editingEater}
                onSave={onSaveEater}
                onDelete={onDeleteEater}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        fontSize: 20,
        fontWeight: '800',
        color: '#450A0A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#78716C',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    avatarRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: 82,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: '#D1D5DB',
        shadowColor: '#C2410C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 3,
        opacity: 0.6,
    },
    avatarSelected: {
        borderColor: '#CA8A04',
        backgroundColor: '#FEF9C3',
        opacity: 1,
        shadowOpacity: 0.18,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 2,
    },
    avatarName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        maxWidth: 60,
        textAlign: 'center',
    },
    avatarNameSelected: {
        color: '#450A0A',
    },
    allergyBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        fontSize: 12,
    },
    addBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: 82,
        borderRadius: 20,
        backgroundColor: '#FFF7ED',
        borderWidth: 3,
        borderColor: '#FED7AA',
        borderStyle: 'dashed',
    },
    addText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#CA8A04',
        marginTop: 2,
    },
});
