import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Animation values (persist across renders)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email, password);
      console.log('Login response:', JSON.stringify(response, null, 2));

      // Check if login succeeded without checking success flag issues
      if (!response || response.success === false) {
        // Show the actual error message from backend for debugging
        const message = response?.message || response?.error || 'Login failed. Please check your credentials.';
        console.log('Login failed with message:', message);
        Alert.alert('Login Failed', message);
        return;
      }

      const anyResp: any = response as any;
      const otpRequired = Boolean(response.twoFactorRequired || anyResp.otpRequired || anyResp.tempToken);
      const tempToken = anyResp.tempToken;
      const method = (response as any).method || 'email';

      // OTP/2FA flow
      if (otpRequired && tempToken) {
        console.log('OTP required. Navigating to OtpVerification with tempToken.');
        navigation.navigate('OtpVerification', { email, tempToken, method });
        return;
      }

      // Direct login success (user and token already set by AuthContext)
      if (response.success && response.user && response.token) {
        console.log('Login successful, user authenticated');
        return;
      }

      // Unexpected state
      Alert.alert('Notice', 'Please complete verification to continue.');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.background}>
        {/* Subtle dark pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternCircle, styles.patternCircle1]} />
          <View style={[styles.patternCircle, styles.patternCircle2]} />
          <View style={[styles.patternCircle, styles.patternCircle3]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Professional Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Ionicons name="school" size={48} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.title}>EduConnect</Text>
              <Text style={styles.subtitle}>Professional Education Management</Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <Surface style={styles.card} elevation={5}>
                <View style={styles.cardHeader}>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Sign in to access your dashboard
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                    </View>
                    <TextInput
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                      outlineColor="#334155"
                      activeOutlineColor="#3B82F6"
                      textColor="#FFFFFF"
                      theme={{
                        colors: {
                          primary: '#3B82F6',
                          background: '#1E293B',
                          text: '#FFFFFF',
                          placeholder: '#64748B',
                        }
                      }}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#3B82F6" />
                    </View>
                    <TextInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      outlineColor="#334155"
                      activeOutlineColor="#3B82F6"
                      textColor="#FFFFFF"
                      theme={{
                        colors: {
                          primary: '#3B82F6',
                          background: '#1E293B',
                          text: '#FFFFFF',
                          placeholder: '#64748B',
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View style={[styles.buttonGradient, isLoading && styles.buttonDisabled]}>
                    {isLoading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.buttonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot your password?</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>New to EduConnect? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Register')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.registerLink}>Create Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Surface>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  background: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
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
    top: height * 0.4,
    right: -60,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    elevation: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#1E293B',
    padding: 0,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    paddingTop: 40,
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 18,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#1E293B',
    paddingLeft: 48,
    fontSize: 15,
    height: 56,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    marginHorizontal: 28,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  forgotButton: {
    paddingVertical: 8,
  },
  forgotText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '400',
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
});
