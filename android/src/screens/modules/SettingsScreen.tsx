import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Switch,
  TextInput,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp: any = await apiService.getProfile();
        const currentUser = resp?.user || resp?.data?.user || user;
        const p = currentUser?.profile || {};
        setProfile({
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          phone: p?.phone || '',
          address: p?.address || '',
          studentId: p?.studentId || currentUser?.studentId || '',
        });
      } catch (e) {
        // non-fatal
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Backend expects PUT /auth/profile with keys like name, phone, address, studentId
      const payload: any = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        phone: profile.phone,
        address: profile.address,
        studentId: profile.studentId,
      };
      const resp: any = await apiService.updateProfile(payload);
      if (resp?.success !== false) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Update failed', resp?.message || 'Could not update profile');
      }
    } catch (e: any) {
      Alert.alert('Update failed', e?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const firstName = profile.firstName || user?.firstName || (user?.name ? String(user.name).split(' ')[0] : '');
  const lastName = profile.lastName || user?.lastName || (user?.name ? String(user.name).split(' ').slice(1).join(' ') : '');
  const initials = `${(firstName || user?.name || user?.email || 'U').toString().trim()[0] || ''}${(lastName || '').toString().trim()[0] || ''}`.toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#00A8E8', '#007BB5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Large Initials */}
          <Text style={styles.initialsLarge}>{initials}</Text>
          
          {/* User Name */}
          <Text style={styles.userName}>
            {firstName} {lastName}
          </Text>
          
          {/* Email */}
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {/* Role */}
          <Text style={styles.userRole}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Personal Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={{ color: theme.colors.text, fontSize: 18 }}>Personal Information</Title>
              <TouchableOpacity onPress={isEditing ? handleSaveProfile : handleEditProfile}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name={isEditing ? 'checkmark' : 'pencil'} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.editText, { color: theme.colors.primary }]}>
                    {isEditing ? 'Save' : 'Edit'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>First Name</Text>
                {isEditing ? (
                  <TextInput
                    value={profile.firstName}
                    onChangeText={(t) => setProfile((p: any) => ({ ...p, firstName: t }))}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.text}
                  />
                ) : (
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{firstName || 'Not provided'}</Text>
                )}
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Last Name</Text>
                {isEditing ? (
                  <TextInput
                    value={profile.lastName}
                    onChangeText={(t) => setProfile((p: any) => ({ ...p, lastName: t }))}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.text}
                  />
                ) : (
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{lastName || 'Not provided'}</Text>
                )}
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.email}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
                {isEditing ? (
                  <TextInput
                    value={profile.phone}
                    onChangeText={(t) => setProfile((p: any) => ({ ...p, phone: t }))}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Enter phone number"
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.text}
                  />
                ) : (
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.phone || profile.phone || 'Not provided'}</Text>
                )}
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Student ID</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile.studentId || 'N/A'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text, fontSize: 18, marginBottom: 16 }}>Settings</Title>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Push Notifications</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Receive notifications on your device
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                thumbColor={notifications ? theme.colors.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Email Notifications</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Receive notifications via email
                  </Text>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                thumbColor={emailNotifications ? theme.colors.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Switch to dark theme
                  </Text>
                </View>
              </View>
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                thumbColor={theme.isDark ? theme.colors.primary : '#f4f3f4'}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  initialsLarge: {
    fontSize: 80,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 4,
    marginBottom: 20,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  input: {
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
