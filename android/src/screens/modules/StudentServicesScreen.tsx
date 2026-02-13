import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Card, Title, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const SERVICE_TYPES = [
    { id: 'bonafide', label: 'Bonafide Certificate', icon: 'document-text-outline', color: '#3B82F6', desc: 'For proof of enrollment' },
    { id: 'no-dues', label: 'No Dues Certificate', icon: 'checkmark-done-outline', color: '#10B981', desc: 'Required for graduation' },
    { id: 'fee-receipt', label: 'Fee Receipt', icon: 'receipt-outline', color: '#F59E0B', desc: 'Payment proof document' },
    { id: 'admit-card', label: 'Admit Card', icon: 'card-outline', color: '#8B5CF6', desc: 'For examination entry' },
    { id: 'migration', label: 'Migration Certificate', icon: 'airplane-outline', color: '#EF4444', desc: 'For transfer to other institution' },
    { id: 'character', label: 'Character Certificate', icon: 'shield-checkmark-outline', color: '#06B6D4', desc: 'Good conduct certificate' },
] as const;

interface ServiceRequest {
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected' | 'ready';
    requestedAt: string;
}

export default function StudentServicesScreen() {
    const { theme } = useTheme();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const handleRequest = (serviceId: string) => {
        const label = SERVICE_TYPES.find(s => s.id === serviceId)?.label || serviceId;
        Alert.alert(
            'Request Service',
            `Submit a request for ${label}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: () => {
                        const newReq: ServiceRequest = {
                            id: Date.now().toString(),
                            type: serviceId,
                            status: 'pending',
                            requestedAt: new Date().toISOString(),
                        };
                        setRequests(prev => [newReq, ...prev]);
                        Alert.alert('Success', 'Your request has been submitted and is under review.');
                    },
                },
            ],
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            case 'ready': return '#3B82F6';
            default: return '#F59E0B';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Student Services</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Available Services */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Available Services</Text>
                <View style={styles.servicesGrid}>
                    {SERVICE_TYPES.map(service => (
                        <TouchableOpacity
                            key={service.id}
                            style={[styles.serviceCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            onPress={() => handleRequest(service.id)}
                        >
                            <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                                <Ionicons name={service.icon as any} size={24} color={service.color} />
                            </View>
                            <Text style={[styles.serviceLabel, { color: theme.colors.text }]}>{service.label}</Text>
                            <Text style={[styles.serviceDesc, { color: theme.colors.textSecondary }]}>{service.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* My Requests */}
                {requests.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>My Requests</Text>
                        {requests.map(req => {
                            const service = SERVICE_TYPES.find(s => s.id === req.type);
                            return (
                                <Card key={req.id} style={[styles.requestCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                    <Card.Content style={styles.requestContent}>
                                        <Ionicons name={(service?.icon || 'document-outline') as any} size={20} color={service?.color || '#999'} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.requestLabel, { color: theme.colors.text }]}>{service?.label || req.type}</Text>
                                            <Text style={[styles.requestDate, { color: theme.colors.textSecondary }]}>
                                                {new Date(req.requestedAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Chip style={{ backgroundColor: getStatusColor(req.status) + '20' }}
                                            textStyle={{ color: getStatusColor(req.status), fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                                            {req.status}
                                        </Chip>
                                    </Card.Content>
                                </Card>
                            );
                        })}
                    </>
                )}

                {requests.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Ionicons name="document-text-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            No active requests. Tap a service above to submit one.
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    serviceCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
    serviceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    serviceLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    serviceDesc: { fontSize: 11, textAlign: 'center', marginTop: 4 },
    requestCard: { marginBottom: 10, borderRadius: 10, borderWidth: 1 },
    requestContent: { flexDirection: 'row', alignItems: 'center' },
    requestLabel: { fontSize: 14, fontWeight: '600' },
    requestDate: { fontSize: 11, marginTop: 2 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
