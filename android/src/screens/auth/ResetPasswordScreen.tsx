import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { token } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(token, password);
      
      if (response.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>EduConnect</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Set new password</Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>Reset Password</Title>
              <Paragraph style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                Enter your new password below
              </Paragraph>

              <TextInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
              />

              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={[styles.resetButton, { backgroundColor: theme.colors.primary }]}
                disabled={isLoading}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Reset Password'
                )}
              </Button>

              <View style={styles.footer}>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backButton}
                  textColor={theme.colors.primary}
                >
                  Back to Login
                </Button>
              </View>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    marginTop: 8,
  },
});
