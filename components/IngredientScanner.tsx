import * as Sentry from '@sentry/react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, RefreshCw } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    onCapture: (uri: string) => void;
}

export function IngredientScanner({ onCapture }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>GrubEyes needs camera access to see your ingredients!</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const takePicture = async () => {
        if (!cameraRef.current || isProcessing) return;

        try {
            setIsProcessing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (photo?.uri) {
                onCapture(photo.uri);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error("Failed to take picture:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Camera renders as a background — no children to avoid the text string error */}
            <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef} />

            {/* Overlay rendered OUTSIDE CameraView */}
            <View style={styles.overlay}>
                <View style={styles.targetBox}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                        <RefreshCw color="#450A0A" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                        onPress={takePicture}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFFFFF" size="large" />
                        ) : (
                            <Camera color="#FFFFFF" size={32} />
                        )}
                    </TouchableOpacity>

                    {/* Spacer */}
                    <View style={styles.spacer} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEF2F2',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    permissionText: {
        fontFamily: 'Karla',
        fontSize: 18,
        color: '#450A0A',
        textAlign: 'center',
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#CA8A04',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Karla',
        fontWeight: '700',
        fontSize: 18,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        paddingBottom: 48,
        paddingTop: 64,
    },
    targetBox: {
        alignSelf: 'center',
        width: '80%',
        height: '50%',
        marginTop: '10%',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#CA8A04',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 6,
        borderLeftWidth: 6,
        borderTopLeftRadius: 16,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 6,
        borderRightWidth: 6,
        borderTopRightRadius: 16,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 6,
        borderLeftWidth: 6,
        borderBottomLeftRadius: 16,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        borderBottomRightRadius: 16,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#F87171',
    },
    captureButtonDisabled: {
        opacity: 0.7,
    },
    spacer: {
        width: 56,
    },
});
