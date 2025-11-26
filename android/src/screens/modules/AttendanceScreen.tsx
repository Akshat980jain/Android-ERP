import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  DataTable,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import CircularAttendanceChart from '../../components/CircularAttendanceChart';

const { width } = Dimensions.get('window');

export default function AttendanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({
    physical: 104,
    placement: 38,
    absent: 13,
    total: 155,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await apiService.getStudentAttendance();
      if (response.success) {
        const data = response.data || [];
        setAttendance(data);
        
        // Calculate attendance stats from real data if available
        if (Array.isArray(data) && data.length > 0) {
          const physical = data.filter((a: any) => a.status === 'present').length;
          const absent = data.filter((a: any) => a.status === 'absent').length;
          const placement = data.filter((a: any) => a.type === 'placement').length;
          const total = data.length;
          
          setAttendanceData({ physical, placement, absent, total });
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const mockAttendance = [
    {
      id: '1',
      course: 'Data Structures',
      date: '2024-01-15',
      status: 'present',
      type: 'Physical',
    },
    {
      id: '2',
      course: 'Database Systems',
      date: '2024-01-15',
      status: 'present',
      type: 'Physical',
    },
    {
      id: '3',
      course: 'Web Development',
      date: '2024-01-14',
      status: 'absent',
      type: 'Physical',
    },
    {
      id: '4',
      course: 'Algorithms',
      date: '2024-01-14',
      status: 'present',
      type: 'Placement',
    },
  ];

  const displayAttendance = attendance.length > 0 ? attendance : mockAttendance;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ATTENDANCE</Text>
          <Ionicons name="information-circle-outline" size={24} color="#9CA3AF" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Circular Chart */}
        <Surface style={styles.chartCard} elevation={4}>
          <CircularAttendanceChart data={attendanceData} />
        </Surface>

        {/* Recent Attendance Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          <Surface style={styles.tableCard} elevation={2}>
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title textStyle={styles.tableHeaderText}>Course</DataTable.Title>
                <DataTable.Title textStyle={styles.tableHeaderText}>Date</DataTable.Title>
                <DataTable.Title textStyle={styles.tableHeaderText}>Status</DataTable.Title>
              </DataTable.Header>

              {displayAttendance.slice(0, 10).map((record: any) => (
                <DataTable.Row key={record.id} style={styles.tableRow}>
                  <DataTable.Cell textStyle={styles.tableCellText}>
                    {record.course}
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={styles.tableCellText}>
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      mode="flat"
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            record.status === 'present'
                              ? '#D1FAE5'
                              : record.status === 'absent'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                        },
                      ]}
                      textStyle={[
                        styles.statusChipText,
                        {
                          color:
                            record.status === 'present'
                              ? '#059669'
                              : record.status === 'absent'
                              ? '#DC2626'
                              : '#D97706',
                        },
                      ]}
                    >
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>
        </View>

        {/* Info Note */}
        <Surface style={styles.infoCard} elevation={1}>
          <Ionicons name="information-circle" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Minimum 75% attendance is required for semester eligibility
          </Text>
        </Surface>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  chartCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#4338CA',
    lineHeight: 18,
  },
});
