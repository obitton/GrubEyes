import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    PressableProps,
    StyleProp,
    ViewStyle,
} from 'react-native';

interface ClayPressableProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

/**
 * A pressable wrapper that applies a claymorphism "soft bounce" animation
 * on press. Uses the spring curve recommended by ui-ux-pro-max:
 * cubic-bezier(0.34, 1.56) ≈ React Native spring with friction ~7.
 *
 * Press down: scale to 0.96 (subtle squish)
 * Release: spring back to 1.0 with slight overshoot (bouncy clay feel)
 */
export function ClayPressable({ style, children, onPress, ...rest }: ClayPressableProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 14, // Overshoot for that bouncy clay feel
        }).start();
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} {...rest}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </Pressable>
    );
}
