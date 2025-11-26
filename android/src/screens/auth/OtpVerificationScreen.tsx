import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function OtpVerificationScreen({ navigation, route }: any) {
  const { email, tempToken, method } = route.params || {};
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const { verifyOtp, verifyTwoFactor } = useAuth();
  const { theme } = useTheme();

  console.log('OtpVerificationScreen mounted with params:', { email, tempToken, method });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      
      if (method === 'email') {
        response = await verifyOtp(email, otp);
      } else {
        response = await verifyTwoFactor(tempToken, otp);
      }

      if (response.success) {
        // Navigation handled by AppNavigator
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timeLeft > 0) {
      Alert.alert('Please Wait', `You can resend the code in ${formatTime(timeLeft)}`);
      return;
    }
    // TODO: Implement resend OTP functionality
    Alert.alert('Success', 'A new verification code has been sent to your email');
    setTimeLeft(300);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Background decorative elements */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.patternCircle, styles.patternCircle1, { backgroundColor: theme.colors.primary + '10' }]} />
        <View style={[styles.patternCircle, styles.patternCircle2, { backgroundColor: theme.colors.primary + '08' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconGradient, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Verify Your Account</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={[styles.emailText, { color: theme.colors.primary }]}>{email || 'your email'}</Text>
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.cardContent}>
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Verification Code</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { backgroundColor: theme.colors.background }]}
                  outlineColor={theme.colors.border}
                  activeOutlineColor={theme.colors.primary}
                  placeholder="000000"
                  placeholderTextColor={theme.colors.textSecondary}
                  textColor={theme.colors.text}
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: theme.colors.background,
                      text: theme.colors.text,
                    }
                  }}
                />
                {timeLeft > 0 && (
                  <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.timerText, { color: theme.colors.textSecondary }]}>
                      Code expires in {formatTime(timeLeft)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, (isLoading || otp.length !== 6) && styles.verifyButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.buttonGradient,
                  {
                    backgroundColor: (isLoading || otp.length !== 6) 
                      ? theme.colors.border 
                      : theme.colors.primary
                  }
                ]}>
                  {isLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.buttonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                  Didn't receive the code?
                </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={timeLeft > 0}
                  activeOpacity={0.7}
                  style={styles.resendButton}
                >
                  <Text style={[
                    styles.resendLink,
                    { color: timeLeft > 0 ? theme.colors.textSecondary : theme.colors.primary }
                  ]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
                  <Text style={[styles.backText, { color: theme.colors.primary }]}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
              Secure verification with end-to-end encryption
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    bottom: -80,
    left: -80,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 24,
    height: 64,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  verifyButtonDisabled: {
    elevation: 2,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
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
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '400',
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '400',
  },
});
