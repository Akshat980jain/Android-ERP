import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();

    // Continuous rotation for loading indicator
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBarStyle} backgroundColor={theme.colors.primary} />
      <View style={[styles.gradient, { backgroundColor: theme.colors.background }]}>
        {/* Background pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternCircle, styles.patternCircle1, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.05)' }]} />
          <View style={[styles.patternCircle, styles.patternCircle2, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.05)' }]} />
          <View style={[styles.patternCircle, styles.patternCircle3, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.05)' }]} />
        </View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.logoGradient, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="school" size={56} color="#fff" />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              {
                opacity: opacityAnim,
                color: theme.colors.text,
              },
            ]}
          >
            EduConnect
          </Animated.Text>

          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: opacityAnim,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            Professional Education Management
          </Animated.Text>

          <Animated.View
            style={[
              styles.loaderContainer,
              {
                opacity: opacityAnim,
                transform: [{ rotate }],
              },
            ]}
          >
            <View style={[styles.spinnerRing, { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)', borderTopColor: theme.colors.primary }]} />
          </Animated.View>

          <Animated.View
            style={[
              styles.loadingTextContainer,
              {
                opacity: opacityAnim,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  patternCircle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  patternCircle2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -80,
  },
  patternCircle3: {
    width: 150,
    height: 150,
    top: '50%',
    right: -60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 112,
    height: 112,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 12px 16px rgba(0, 0, 0, 0.25)',
    elevation: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 0.3,
  },
  loaderContainer: {
    width: 56,
    height: 56,
    marginBottom: 24,
  },
  spinnerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
