import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const reportTypes = [
    { id: 'attendance', title: 'Attendance Report', icon: 'checkmark-done', color: '#10B981' },
    { id: 'academic', title: 'Academic Performance', icon: 'school', color: '#3B82F6' },
    { id: 'finance', title: 'Fee Payment Report', icon: 'cash', color: '#F59E0B' },
    { id: 'assignments', title: 'Assignment Report', icon: 'document-text', color: '#8B5CF6' },
    { id: 'overall', title: 'Overall Summary', icon: 'bar-chart', color: '#EF4444' },
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedReport]);

  const loadReportData = async () => {
    if (!selectedReport) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call for now
      // In production, you would call: await apiService.getReport(selectedReport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setReportData({
        generated: new Date().toLocaleString(),
        stats: {
          total: Math.floor(Math.random() * 100),
          completed: Math.floor(Math.random() * 80),
          pending: Math.floor(Math.random() * 20),
        }
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const renderReportCard = (report: any) => (
    <TouchableOpacity
      key={report.id}
      onPress={() => setSelectedReport(report.id)}
      style={styles.reportCardTouchable}
    >
      <Card 
        style={[
          styles.reportCard, 
          { 
            backgroundColor: theme.colors.card,
            borderColor: selectedReport === report.id ? report.color : theme.colors.border,
            borderWidth: selectedReport === report.id ? 2 : 1,
          }
        ]}
      >
        <Card.Content>
          <View style={styles.reportCardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: report.color + '20' }]}>
              <Ionicons name={report.icon as any} size={28} color={report.color} />
            </View>
          </View>
          <Title style={[styles.reportTitle, { color: theme.colors.text }]}>
            {report.title}
          </Title>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderReportContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Generating report...
          </Text>
        </View>
      );
    }

    if (!selectedReport) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Select a report type above to view
          </Text>
        </View>
      );
    }

    if (!reportData) {
      return null;
    }

    const reportType = reportTypes.find(r => r.id === selectedReport);

    return (
      <Card style={[styles.reportContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Card.Content>
          <View style={styles.reportHeader}>
            <View>
              <Title style={{ color: theme.colors.text }}>{reportType?.title}</Title>
              <Text style={[styles.generatedText, { color: theme.colors.textSecondary }]}>
                Generated: {reportData.generated}
              </Text>
            </View>
            <Button
              mode="contained"
              icon="download"
              style={{ backgroundColor: theme.colors.primary }}
              onPress={() => {/* Download report */}}
            >
              Download
            </Button>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {reportData.stats.total}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {reportData.stats.completed}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                {reportData.stats.pending}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
            </View>
          </View>

          <View style={styles.reportDetails}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Report Details</Text>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Period:</Text>
              <Text style={{ color: theme.colors.text }}>Current Semester</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Status:</Text>
              <Chip style={{ backgroundColor: '#10B981' + '20' }} textStyle={{ color: '#10B981' }}>
                Active
              </Chip>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Last Updated:</Text>
              <Text style={{ color: theme.colors.text }}>Just now</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={{ width: 28 }} />
        <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Reports</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <Paragraph style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          View and download comprehensive reports
        </Paragraph>

        <View style={styles.reportTypesContainer}>
          {reportTypes.map(report => renderReportCard(report))}
        </View>

        {renderReportContent()}
      </ScrollView>
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
    marginBottom: 20,
  },
  reportTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  reportCardTouchable: {
    width: '48%',
    marginBottom: 16,
  },
  reportCard: {
    borderRadius: 12,
    elevation: 2,
  },
  reportCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  reportContent: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  generatedText: {
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  reportDetails: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    fontSize: 16,
    textAlign: 'center',
  },
});
