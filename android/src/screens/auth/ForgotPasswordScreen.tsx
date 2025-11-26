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

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        Alert.alert(
          'Email Sent',
          'Please check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset email');
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
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Reset your password</Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>Forgot Password?</Title>
              <Paragraph style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                Enter your email address and we'll send you a link to reset your password.
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

              <Button
                mode="contained"
                onPress={handleForgotPassword}
                style={[styles.resetButton, { backgroundColor: theme.colors.primary }]}
                disabled={isLoading}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Send Reset Link'
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
    marginBottom: 24,
  },
  resetButton: {
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
