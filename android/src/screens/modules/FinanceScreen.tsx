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
  ProgressBar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface FeeRecord {
  _id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAmount?: number;
  paidDate?: string;
  transactionId?: string;
}

export default function FinanceScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [financeStats, setFinanceStats] = useState({
    totalFees: 0,
    paidFees: 0,
    pendingFees: 0,
    overdueFees: 0,
  });

  const filterOptions = [
    { id: 'all', label: 'All', color: theme.colors.primary },
    { id: 'paid', label: 'Paid', color: '#10B981' },
    { id: 'pending', label: 'Pending', color: '#F59E0B' },
    { id: 'overdue', label: 'Overdue', color: '#EF4444' },
  ];

  useEffect(() => {
    loadFeeRecords();
  }, []);

  const loadFeeRecords = async () => {
    setLoading(true);
    try {
      const response = await apiService.getFees();
      console.log('Fees response:', response);
      
      if (response && response.success !== false) {
        const feesList = Array.isArray(response.fees) ? response.fees :
                        Array.isArray(response.data) ? response.data :
                        Array.isArray(response) ? response : [];
        setFeeRecords(feesList);
        
        // Calculate stats
        const total = feesList.reduce((sum: number, fee: FeeRecord) => sum + fee.amount, 0);
        const paid = feesList
          .filter((fee: FeeRecord) => fee.status === 'paid')
          .reduce((sum: number, fee: FeeRecord) => sum + fee.amount, 0);
        const pending = feesList
          .filter((fee: FeeRecord) => fee.status === 'pending')
          .reduce((sum: number, fee: FeeRecord) => sum + fee.amount, 0);
        const overdue = feesList
          .filter((fee: FeeRecord) => fee.status === 'overdue')
          .reduce((sum: number, fee: FeeRecord) => sum + fee.amount, 0);
        
        setFinanceStats({
          totalFees: total,
          paidFees: paid,
          pendingFees: pending,
          overdueFees: overdue,
        });
      }
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeRecords();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return theme.colors.textSecondary;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredFees = selectedFilter === 'all' 
    ? feeRecords 
    : feeRecords.filter(fee => fee.status === selectedFilter);

  const paymentProgress = financeStats.totalFees > 0 
    ? financeStats.paidFees / financeStats.totalFees 
    : 0;

  const renderFeeCard = (fee: FeeRecord) => (
    <Card 
      key={fee._id} 
      style={[styles.feeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <Card.Content>
        <View style={styles.feeHeader}>
          <View style={styles.feeInfo}>
            <Title style={[styles.feeType, { color: theme.colors.text }]}>
              {fee.type}
            </Title>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(fee.status) + '20' }]}
              textStyle={{ color: getStatusColor(fee.status), fontSize: 11, fontWeight: '600' }}
            >
              {fee.status.toUpperCase()}
            </Chip>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: theme.colors.primary }]}>
              {formatCurrency(fee.amount)}
            </Text>
          </View>
        </View>

        <View style={[styles.feeDetails, { borderTopColor: theme.colors.border }]}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Due Date:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(fee.dueDate)}
            </Text>
          </View>
          
          {fee.status === 'paid' && fee.paidDate && (
            <>
              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Paid On:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {formatDate(fee.paidDate)}
                </Text>
              </View>
              {fee.transactionId && (
                <View style={styles.detailRow}>
                  <Ionicons name="receipt-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Transaction ID:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: 11 }]}>
                    {fee.transactionId}
                  </Text>
                </View>
              )}
            </>
          )}
          
          {fee.status === 'pending' && fee.paidAmount && fee.paidAmount > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="wallet-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Paid Amount:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {formatCurrency(fee.paidAmount)}
              </Text>
            </View>
          )}
        </View>

        {fee.status !== 'paid' && (
          <Button
            mode="contained"
            style={[styles.payButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {/* Handle payment */}}
          >
            Pay Now
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={{ width: 28 }} />
        <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Finance</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Finance Summary Card */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Payment Summary</Title>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={{ color: theme.colors.textSecondary }}>Payment Progress</Text>
                <Text style={[styles.progressText, { color: theme.colors.primary }]}>
                  {Math.round(paymentProgress * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={paymentProgress} 
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Fees</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {formatCurrency(financeStats.totalFees)}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#10B981' + '15' }]}>
                <Text style={[styles.statLabel, { color: '#10B981' }]}>Paid</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {formatCurrency(financeStats.paidFees)}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#F59E0B' + '15' }]}>
                <Text style={[styles.statLabel, { color: '#F59E0B' }]}>Pending</Text>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {formatCurrency(financeStats.pendingFees)}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#EF4444' + '15' }]}>
                <Text style={[styles.statLabel, { color: '#EF4444' }]}>Overdue</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {formatCurrency(financeStats.overdueFees)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Paragraph style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Fee Records & Payment History
        </Paragraph>

        {/* Fee Status Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedFilter(option.id)}
            >
              <Chip
                selected={selectedFilter === option.id}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: selectedFilter === option.id ? option.color : theme.colors.surface,
                    borderColor: option.color,
                    borderWidth: 1,
                  }
                ]}
                textStyle={{ 
                  color: selectedFilter === option.id ? '#FFFFFF' : theme.colors.text,
                  fontWeight: selectedFilter === option.id ? '600' : '400',
                }}
              >
                {option.label}
              </Chip>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Fee Records List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading fee records...
            </Text>
          </View>
        ) : filteredFees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No fee records found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {selectedFilter === 'all' 
                ? 'You have no fee records yet' 
                : `No ${selectedFilter} fees`}
            </Text>
          </View>
        ) : (
          <View style={styles.feesContainer}>
            {filteredFees.map(fee => renderFeeCard(fee))}
          </View>
        )}
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
  summaryCard: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
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
  feesContainer: {
    marginBottom: 20,
  },
  feeCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  feeDetails: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  payButton: {
    marginTop: 4,
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
});
