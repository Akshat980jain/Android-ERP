import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type ResetStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();

  // Step state machine
  const [step, setStep] = useState<ResetStep>('email');

  // Field values
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpTimer(600); // 10 minutes
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setStep('otp');
        startTimer();
      } else {
        setErrorMsg(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyResetOtp(email.trim().toLowerCase(), otp.trim());
      if (res.success) {
        setStep('password');
        setErrorMsg('');
      } else {
        setErrorMsg(res.message || 'Invalid OTP. Please try again.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Reset Password ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
      if (res.success) {
        Alert.alert(
          'Password Reset',
          'Your password has been reset successfully.',
          [{ text: 'Log In', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setErrorMsg(res.message || 'Failed to reset password.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles: Record<ResetStep, string> = {
    email: 'Forgot Password?',
    otp: 'Verify Code',
    password: 'New Password',
  };

  const stepSubtitles: Record<ResetStep, string> = {
    email: 'Reset your password',
    otp: 'Enter verification code',
    password: 'Create new password',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>EduConnect</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {stepSubtitles[step]}
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              {/* Step dot indicator */}
              <View style={styles.stepDots}>
                {(['email', 'otp', 'password'] as ResetStep[]).map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.dot,
                      { backgroundColor: s === step ? theme.colors.primary : '#d1d5db' },
                    ]}
                  />
                ))}
              </View>

              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                {stepTitles[step]}
              </Title>

              {/* ─── STEP 1: Email ─── */}
              {step === 'email' && (
                <>
                  <Paragraph style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    Enter your email and we'll send a 6-digit OTP to reset your password.
                  </Paragraph>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    left={<TextInput.Icon icon="email" />}
                  />
                  {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
                  <Button
                    mode="contained"
                    onPress={handleSendOtp}
                    disabled={isLoading}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : 'Send OTP'}
                  </Button>
                </>
              )}

              {/* ─── STEP 2: OTP ─── */}
              {step === 'otp' && (
                <>
                  <Paragraph style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    Code sent to{' '}
                    <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{email}</Text>
                  </Paragraph>
                  {otpTimer > 0 ? (
                    <Text style={styles.timer}>Expires in {formatTimer(otpTimer)}</Text>
                  ) : (
                    <Text style={styles.expired}>OTP expired. Please resend.</Text>
                  )}
                  <TextInput
                    label="6-Digit OTP"
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={6}
                    style={styles.input}
                    left={<TextInput.Icon icon="numeric" />}
                  />
                  {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
                  <Button
                    mode="contained"
                    onPress={handleVerifyOtp}
                    disabled={isLoading || otp.length < 6}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : 'Verify OTP'}
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => { setStep('email'); setOtp(''); setErrorMsg(''); }}
                    textColor={theme.colors.primary}
                    style={styles.textButton}
                  >
                    Resend OTP
                  </Button>
                </>
              )}

              {/* ─── STEP 3: New Password ─── */}
              {step === 'password' && (
                <>
                  <Paragraph style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    OTP verified ✅ — set your new password below.
                  </Paragraph>
                  <TextInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword((p) => !p)}
                      />
                    }
                  />
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-check" />}
                  />
                  {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
                  <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : 'Reset Password'}
                  </Button>
                </>
              )}

              {/* Always-visible back to login */}
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                textColor={theme.colors.primary}
                style={styles.textButton}
              >
                Back to Login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 4,
  },
  timer: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 12,
  },
  expired: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
});
