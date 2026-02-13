import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Card, Title, Chip, ActivityIndicator, Button, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface UserItem {
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
    program?: string;
    department?: string;
}

export default function UserManagementScreen() {
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getAllUsers();
            const list = Array.isArray(res?.users) ? res.users :
                Array.isArray(res?.data) ? res.data :
                    Array.isArray(res) ? res : [];
            setUsers(list);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadUsers(); setRefreshing(false); };

    const handleDelete = (userId: string, name: string) => {
        Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await apiService.deleteUser(userId);
                        setUsers(prev => prev.filter(u => u._id !== userId));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete user');
                    }
                },
            },
        ]);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#EF4444';
            case 'faculty': return '#3B82F6';
            case 'student': return '#10B981';
            case 'parent': return '#8B5CF6';
            default: return '#9CA3AF';
        }
    };

    const filteredUsers = users
        .filter(u => roleFilter === 'all' || u.role === roleFilter)
        .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const roleCounts = {
        all: users.length,
        student: users.filter(u => u.role === 'student').length,
        faculty: users.filter(u => u.role === 'faculty').length,
        admin: users.filter(u => u.role === 'admin').length,
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>User Management</Text>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Searchbar
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchbar, { backgroundColor: theme.colors.card }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                    placeholderTextColor={theme.colors.textSecondary}
                />
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {(['all', 'student', 'faculty', 'admin'] as const).map(role => (
                    <TouchableOpacity key={role} onPress={() => setRoleFilter(role)}>
                        <Chip
                            selected={roleFilter === role}
                            style={[styles.filterChip, { backgroundColor: roleFilter === role ? theme.colors.primary : theme.colors.surface }]}
                            textStyle={{ color: roleFilter === role ? '#FFF' : theme.colors.text, fontWeight: roleFilter === role ? '600' : '400' }}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)} ({(roleCounts as any)[role] || 0})
                        </Chip>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading users...</Text>
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No users found</Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 40 }}>
                        {filteredUsers.map(user => (
                            <Card key={user._id} style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Card.Content style={styles.userContent}>
                                    <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                                        <Ionicons name="person" size={20} color={getRoleColor(user.role)} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
                                        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
                                        <View style={styles.userMeta}>
                                            <Chip style={{ backgroundColor: getRoleColor(user.role) + '20' }}
                                                textStyle={{ color: getRoleColor(user.role), fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                                                {user.role}
                                            </Chip>
                                            {user.isVerified && (
                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 8 }} />
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(user._id, user.name)} style={styles.deleteBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    searchRow: { paddingHorizontal: 16, paddingTop: 12 },
    searchbar: { borderRadius: 12, elevation: 1 },
    filterRow: { maxHeight: 52 },
    filterChip: { marginRight: 8, marginVertical: 8 },
    content: { flex: 1, padding: 16 },
    centerBox: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    userCard: { marginBottom: 10, borderRadius: 12, borderWidth: 1 },
    userContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    userName: { fontSize: 15, fontWeight: '600' },
    userEmail: { fontSize: 12, marginTop: 2 },
    userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    deleteBtn: { padding: 8 },
});
