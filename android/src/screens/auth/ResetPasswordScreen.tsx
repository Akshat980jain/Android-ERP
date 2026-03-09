import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

export default function ResetPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={[styles.title, { color: theme.colors.text }]}>
              Link No Longer Used
            </Title>
            <Paragraph style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
              Password reset links are no longer supported. Please use the{' '}
              <Paragraph style={{ fontWeight: 'bold', color: theme.colors.text }}>
                Forgot Password
              </Paragraph>{' '}
              option on the login screen to receive a 6-digit OTP instead.
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              Use OTP Reset
            </Button>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paragraph: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
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
});
