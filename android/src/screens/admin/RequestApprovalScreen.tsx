import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Modal as PaperModal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface VerificationRequest {
  _id: string;
  name: string;
  email: string;
  requestedRole: string;
  program?: string;
  department?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  remarks?: string;
}

export default function RequestApprovalScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getVerificationRequests();
      
      if (response.success && response.data) {
        setRequests(response.data);
      } else if (response.requests) {
        setRequests(response.requests);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests');
      setRequests([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleDecision = (request: VerificationRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setDecision(status);
    setRemarks('');
    setShowDecisionModal(true);
  };

  const processDecision = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest._id);
    setShowDecisionModal(false);

    try {
      const response = await apiService.processVerificationRequest(
        selectedRequest._id,
        decision,
        remarks
      );

      if (response.success) {
        Alert.alert(
          'Success',
          `Request ${decision === 'approved' ? 'approved' : 'rejected'} successfully!`,
          [{ text: 'OK' }]
        );
        
        // Remove the processed request from the list
        setRequests(requests.filter(r => r._id !== selectedRequest._id));
      } else {
        Alert.alert('Error', response.message || 'Failed to process request');
      }
    } catch (err: any) {
      console.error('Error processing request:', err);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    }

    setProcessingId(null);
    setSelectedRequest(null);
    setRemarks('');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return theme.colors.info;
      case 'faculty':
        return theme.colors.primary;
      case 'admin':
        return theme.colors.warning;
      case 'library':
        return '#8B5CF6';
      case 'placement':
        return '#EC4899';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return 'school';
      case 'faculty':
        return 'person';
      case 'admin':
        return 'shield-checkmark';
      case 'library':
        return 'library';
      case 'placement':
        return 'briefcase';
      default:
        return 'person-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.surface}
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Title style={styles.headerTitle}>Verification Requests</Title>
            <Text style={styles.headerSubtitle}>
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <Button
                  mode="contained"
                  onPress={fetchRequests}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle" size={80} color={theme.colors.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No pending verification requests</Text>
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            {requests.map((request) => (
              <Card key={request._id} style={styles.requestCard}>
                <Card.Content>
                  {/* Header */}
                  <View style={styles.requestHeader}>
                    <View style={styles.requestHeaderLeft}>
                      <View
                        style={[
                          styles.roleIconWrapper,
                          { backgroundColor: getRoleColor(request.requestedRole) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getRoleIcon(request.requestedRole) as any}
                          size={24}
                          color={getRoleColor(request.requestedRole)}
                        />
                      </View>
                      <View style={styles.requestInfo}>
                        <Title style={styles.requestName}>{request.name}</Title>
                        <Text style={styles.requestEmail}>{request.email}</Text>
                      </View>
                    </View>
                    <Chip
                      style={{ backgroundColor: getRoleColor(request.requestedRole) + '20' }}
                      textStyle={{
                        color: getRoleColor(request.requestedRole),
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {request.requestedRole.toUpperCase()}
                    </Chip>
                  </View>

                  {/* Details */}
                  <View style={styles.requestDetails}>
                    {request.program && (
                      <View style={styles.detailRow}>
                        <Ionicons name="school-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.detailLabel}>Program:</Text>
                        <Text style={styles.detailValue}>{request.program}</Text>
                      </View>
                    )}
                    {request.department && (
                      <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.detailLabel}>Department:</Text>
                        <Text style={styles.detailValue}>{request.department}</Text>
                      </View>
                    )}
                    {request.phone && (
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.detailLabel}>Phone:</Text>
                        <Text style={styles.detailValue}>{request.phone}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.detailLabel}>Requested:</Text>
                      <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {processingId === request._id ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.processingText}>Processing...</Text>
                    </View>
                  ) : (
                    <View style={styles.actionsContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => handleDecision(request, 'rejected')}
                        style={styles.rejectButton}
                        labelStyle={styles.rejectButtonText}
                        icon="close-circle"
                      >
                        Reject
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleDecision(request, 'approved')}
                        style={styles.approveButton}
                        icon="check-circle"
                      >
                        Approve
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Decision Modal */}
      <Portal>
        <PaperModal
          visible={showDecisionModal}
          onDismiss={() => setShowDecisionModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>
            {decision === 'approved' ? 'Approve' : 'Reject'} Request
          </Title>
          
          {selectedRequest && (
            <>
              <Text style={styles.modalText}>
                {decision === 'approved' 
                  ? `Are you sure you want to approve ${selectedRequest.name}'s request for ${selectedRequest.requestedRole} role?`
                  : `Are you sure you want to reject ${selectedRequest.name}'s request?`
                }
              </Text>

              <Text style={styles.inputLabel}>Remarks {decision === 'rejected' ? '(Required)' : '(Optional)'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter remarks..."
                placeholderTextColor={theme.colors.textSecondary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDecisionModal(false)}
                  style={styles.modalCancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={processDecision}
                  style={[
                    styles.modalConfirmButton,
                    decision === 'rejected' && styles.modalRejectButton,
                  ]}
                  disabled={decision === 'rejected' && !remarks.trim()}
                >
                  {decision === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </View>
            </>
          )}
        </PaperModal>
      </Portal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 400,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    errorCard: {
      margin: 16,
      backgroundColor: theme.isDark ? '#2A1A1A' : '#FEE2E2',
      elevation: 2,
    },
    errorContent: {
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      marginTop: 12,
      marginBottom: 20,
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 400,
    },
    emptyTitle: {
      marginTop: 20,
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    emptyText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    requestsContainer: {
      padding: 16,
      gap: 16,
    },
    requestCard: {
      backgroundColor: theme.colors.card,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    requestHeaderLeft: {
      flexDirection: 'row',
      flex: 1,
      gap: 12,
      marginRight: 12,
    },
    roleIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    requestEmail: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    requestDetails: {
      gap: 10,
      marginBottom: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      minWidth: 80,
    },
    detailValue: {
      fontSize: 13,
      color: theme.colors.text,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    approveButton: {
      flex: 1,
      backgroundColor: theme.colors.success,
    },
    rejectButton: {
      flex: 1,
      borderColor: theme.colors.error,
    },
    rejectButtonText: {
      color: theme.colors.error,
    },
    processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      gap: 12,
    },
    processingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modal: {
      margin: 20,
      padding: 24,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    modalText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 20,
      lineHeight: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
      marginBottom: 20,
      minHeight: 80,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      borderColor: theme.colors.border,
    },
    modalConfirmButton: {
      flex: 1,
      backgroundColor: theme.colors.success,
    },
    modalRejectButton: {
      backgroundColor: theme.colors.error,
    },
  });

