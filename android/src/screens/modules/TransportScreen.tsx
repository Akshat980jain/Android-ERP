import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Linking,
} from 'react-native';
import {
    Card,
    Title,
    Chip,
    ActivityIndicator,
    Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface RouteStop {
    name: string;
    time: string;
    fare: number;
    coordinates?: { latitude: number; longitude: number };
}

interface TransportRoute {
    _id: string;
    routeNumber: string;
    routeName: string;
    driver: { name: string; phone: string; licenseNumber?: string };
    vehicle: { number: string; type: string; capacity: number; model?: string };
    stops: RouteStop[];
    schedule?: { morningDeparture?: string; eveningDeparture?: string; operatingDays?: string[] };
    status: string;
    isSubscribed?: boolean;
    subscribedStop?: string;
    monthlyFee?: number;
}

export default function TransportScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { loadRoutes(); }, []);

    const loadRoutes = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getTransportRoutes();
            if (res && res.success !== false) {
                const list = Array.isArray(res.routes) ? res.routes :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setRoutes(list);
            }
        } catch (error) {
            console.error('Error loading routes:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadRoutes(); setRefreshing(false); };

    const handleSubscribe = async (routeId: string, stop: string) => {
        try {
            const res: any = await apiService.subscribeToRoute(routeId, stop);
            if (res && res.success !== false) {
                await loadRoutes(); // Reload to get updated subscription status
            }
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    const callDriver = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const getVehicleIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'bus': return 'bus-outline';
            case 'van': return 'car-outline';
            default: return 'car-sport-outline';
        }
    };

    const renderRouteCard = (route: TransportRoute) => {
        const expanded = expandedId === route._id;
        return (
            <Card key={route._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : route._id)} activeOpacity={0.8}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <View style={[styles.routeBadge, { backgroundColor: theme.colors.primary }]}>
                                <Ionicons name={getVehicleIcon(route.vehicle.type)} size={20} color="#FFF" />
                                <Text style={styles.routeNum}>{route.routeNumber}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Title style={[styles.routeName, { color: theme.colors.text }]}>{route.routeName}</Title>
                                <Text style={[styles.routeSub, { color: theme.colors.textSecondary }]}>
                                    {route.vehicle.number} · {route.vehicle.type} · {route.vehicle.capacity} seats
                                </Text>
                            </View>
                            {route.isSubscribed && (
                                <Chip style={{ backgroundColor: '#10B981' + '20' }}
                                    textStyle={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>
                                    SUBSCRIBED
                                </Chip>
                            )}
                        </View>

                        {/* Schedule summary */}
                        {route.schedule && (
                            <View style={styles.scheduleRow}>
                                {route.schedule.morningDeparture && (
                                    <View style={styles.scheduleItem}>
                                        <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
                                        <Text style={[styles.scheduleText, { color: theme.colors.text }]}>
                                            Morning: {route.schedule.morningDeparture}
                                        </Text>
                                    </View>
                                )}
                                {route.schedule.eveningDeparture && (
                                    <View style={styles.scheduleItem}>
                                        <Ionicons name="moon-outline" size={14} color="#8B5CF6" />
                                        <Text style={[styles.scheduleText, { color: theme.colors.text }]}>
                                            Evening: {route.schedule.eveningDeparture}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {expanded && (
                            <View style={[styles.expandedSection, { borderTopColor: theme.colors.border }]}>
                                {/* Driver info */}
                                <View style={styles.driverSection}>
                                    <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>DRIVER</Text>
                                    <View style={styles.driverRow}>
                                        <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
                                        <Text style={[styles.driverName, { color: theme.colors.text }]}>{route.driver.name}</Text>
                                        <TouchableOpacity onPress={() => callDriver(route.driver.phone)} style={[styles.callBtn, { backgroundColor: '#10B981' }]}>
                                            <Ionicons name="call" size={16} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Stops */}
                                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>STOPS</Text>
                                {route.stops.map((stop, i) => (
                                    <View key={i} style={styles.stopRow}>
                                        <View style={[styles.stopDot, { backgroundColor: i === 0 ? '#10B981' : i === route.stops.length - 1 ? '#EF4444' : theme.colors.primary }]} />
                                        {i < route.stops.length - 1 && <View style={[styles.stopLine, { backgroundColor: theme.colors.border }]} />}
                                        <View style={styles.stopInfo}>
                                            <Text style={[styles.stopName, { color: theme.colors.text }]}>{stop.name}</Text>
                                            <Text style={[styles.stopMeta, { color: theme.colors.textSecondary }]}>{stop.time} · ₹{stop.fare}</Text>
                                        </View>
                                        {!route.isSubscribed && (user as any)?.role === 'student' && (
                                            <TouchableOpacity onPress={() => handleSubscribe(route._id, stop.name)}
                                                style={[styles.subBtn, { borderColor: theme.colors.primary }]}>
                                                <Text style={[styles.subBtnText, { color: theme.colors.primary }]}>Subscribe</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                {/* Operating days */}
                                {route.schedule?.operatingDays && route.schedule.operatingDays.length > 0 && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>OPERATING DAYS</Text>
                                        <View style={styles.daysRow}>
                                            {route.schedule.operatingDays.map(d => (
                                                <Chip key={d} style={{ backgroundColor: theme.colors.primary + '15', marginRight: 6, marginBottom: 4 }}
                                                    textStyle={{ color: theme.colors.primary, fontSize: 11 }}>{d.slice(0, 3)}</Chip>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        <Ionicons
                            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={18} color={theme.colors.textSecondary}
                            style={{ alignSelf: 'center', marginTop: 4 }}
                        />
                    </Card.Content>
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={{ width: 28 }} />
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Transport</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadText, { color: theme.colors.textSecondary }]}>Loading routes...</Text>
                    </View>
                ) : routes.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="bus-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No routes available</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>Transport routes will appear here</Text>
                    </View>
                ) : (
                    <View style={{ paddingBottom: 20 }}>
                        {routes.map(r => renderRouteCard(r))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
    topBarTitle: { fontSize: 20, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    routeBadge: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    routeNum: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    routeName: { fontSize: 16, fontWeight: '600' },
    routeSub: { fontSize: 12, marginTop: 2 },
    scheduleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    scheduleText: { fontSize: 12 },
    expandedSection: { borderTopWidth: 1, paddingTop: 14, marginTop: 12 },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    driverSection: { marginBottom: 16 },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    driverName: { flex: 1, fontSize: 14, fontWeight: '500' },
    callBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4, position: 'relative' },
    stopDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    stopLine: { position: 'absolute', left: 8, top: 14, width: 2, height: 24 },
    stopInfo: { marginLeft: 12, flex: 1 },
    stopName: { fontSize: 14, fontWeight: '500' },
    stopMeta: { fontSize: 12, marginTop: 2 },
    subBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    subBtnText: { fontSize: 11, fontWeight: '600' },
    daysRow: { flexDirection: 'row', flexWrap: 'wrap' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center' },
});
