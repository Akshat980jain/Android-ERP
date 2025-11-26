import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'academic' | 'cultural' | 'sports' | 'workshop' | 'seminar';
  organizer: string;
  attendees?: number;
}

export default function EventsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const eventTypes = [
    { id: 'all', label: 'All Events', color: theme.colors.primary },
    { id: 'academic', label: 'Academic', color: '#3B82F6' },
    { id: 'cultural', label: 'Cultural', color: '#8B5CF6' },
    { id: 'sports', label: 'Sports', color: '#10B981' },
    { id: 'workshop', label: 'Workshop', color: '#F59E0B' },
    { id: 'seminar', label: 'Seminar', color: '#EF4444' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEvents();
      console.log('Events response:', response);
      
      if (response && response.success !== false) {
        const eventsList = Array.isArray(response.events) ? response.events :
                          Array.isArray(response.data) ? response.data :
                          Array.isArray(response) ? response : [];
        setEvents(eventsList);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getTypeColor = (type: string) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType ? eventType.color : theme.colors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => e.type === selectedFilter);

  const renderEventCard = (event: Event) => (
    <Card 
      key={event._id} 
      style={[styles.eventCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <Card.Content>
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <View style={styles.titleRow}>
              <Title style={[styles.eventTitle, { color: theme.colors.text }]}>
                {event.title}
              </Title>
              <Chip 
                style={[styles.typeChip, { backgroundColor: getTypeColor(event.type) + '20' }]}
                textStyle={{ color: getTypeColor(event.type), fontSize: 11 }}
              >
                {event.type}
              </Chip>
            </View>
            <Paragraph style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>
              {event.description}
            </Paragraph>
          </View>
        </View>

        <View style={[styles.eventDetails, { borderTopColor: theme.colors.border }]}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {formatDate(event.date)} at {event.time}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {event.location}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="person" size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Organized by {event.organizer}
            </Text>
          </View>
          {event.attendees !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color={theme.colors.primary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {event.attendees} Attendees
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            compact
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            View Details
          </Button>
          <Button
            mode="contained"
            compact
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            Register
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={{ width: 28 }} />
        <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Events</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <Paragraph style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Discover and register for upcoming events
        </Paragraph>

        {/* Event Type Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {eventTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setSelectedFilter(type.id)}
            >
              <Chip
                selected={selectedFilter === type.id}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: selectedFilter === type.id ? type.color : theme.colors.surface,
                    borderColor: type.color,
                    borderWidth: 1,
                  }
                ]}
                textStyle={{ 
                  color: selectedFilter === type.id ? '#FFFFFF' : theme.colors.text,
                  fontWeight: selectedFilter === type.id ? '600' : '400',
                }}
              >
                {type.label}
              </Chip>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading events...
            </Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No events found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {selectedFilter === 'all' 
                ? 'There are currently no upcoming events' 
                : `No ${selectedFilter} events scheduled`}
            </Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {filteredEvents.map(event => renderEventCard(event))}
          </View>
        )}
      </ScrollView>

      {user?.role !== 'student' && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          color="#FFFFFF"
          onPress={() => setShowAddModal(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChip: {
    marginRight: 8,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  typeChip: {
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  eventDetails: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    flex: 0.48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
