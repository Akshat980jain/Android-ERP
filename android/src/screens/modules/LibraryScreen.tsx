import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  ActivityIndicator,
  Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface Book {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher?: string;
  publishYear?: number;
  totalCopies: number;
  availableCopies: number;
  description?: string;
  language?: string;
  location?: string;
}

interface BookIssue {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: string;
    isbn: string;
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine?: number;
  calculatedFine?: number;
  status: 'issued' | 'returned' | 'overdue';
}

export default function LibraryScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState<'search' | 'issued' | 'history'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'author' | 'isbn'>('title');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    setError('');
    try {
      const [booksRes, issuesRes] = await Promise.all([
        apiService.getBooks(),
        apiService.getBookIssues(),
      ]);

      if (booksRes.success && booksRes.books) {
        const fetchedBooks = booksRes.books;
        setBooks(fetchedBooks);
        
        // Extract unique categories
        const cats = Array.from(new Set(fetchedBooks.map((b: Book) => b.category)));
        setCategories(['all', ...cats]);
      } else {
        setBooks([]);
      }

      if (issuesRes.success && issuesRes.issues) {
        setIssues(issuesRes.issues);
      } else {
        setIssues([]);
      }
    } catch (err) {
      console.error('Error fetching library data:', err);
      setError('Failed to load library data. Please try again.');
      setBooks([]);
      setIssues([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLibraryData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getBooks(searchQuery, selectedCategory, searchType);
      if (res.success && res.books) {
        setBooks(res.books);
      }
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'returned':
        return theme.colors.success;
      case 'issued':
        return theme.colors.info;
      case 'overdue':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'returned':
        return 'check-circle';
      case 'issued':
        return 'time';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      {/* Search Section */}
      <Card style={styles.searchCard}>
        <Card.Content>
          <View style={styles.searchSection}>
            <Searchbar
              placeholder={`Search by ${searchType}...`}
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              onSubmitEditing={handleSearch}
            />

            {/* Search Type Selector */}
            <View style={styles.searchTypeContainer}>
              {(['title', 'author', 'isbn'] as const).map((type) => (
                <Chip
                  key={type}
                  selected={searchType === type}
                  onPress={() => setSearchType(type)}
                  style={styles.chip}
                  selectedColor={theme.colors.primary}
                  textStyle={{ fontSize: 12 }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>

            {/* Category Filter */}
            <View style={styles.categoryFilter}>
              <Ionicons name="filter" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.filterLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    selected={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    style={styles.categoryChip}
                    selectedColor={theme.colors.primary}
                    textStyle={{ fontSize: 11 }}
                  >
                    {category === 'all' ? 'All' : category}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <Button
              mode="contained"
              onPress={handleSearch}
              style={styles.searchButton}
              labelStyle={{ fontSize: 14 }}
            >
              Search
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Books Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No books found</Text>
        </View>
      ) : (
        <View style={styles.booksGrid}>
          {books.map((book) => (
            <Card key={book._id} style={styles.bookCard}>
              <Card.Content>
                <View style={styles.bookHeader}>
                  <Ionicons name="book" size={32} color={theme.colors.primary} />
                  <Chip
                    style={[
                      styles.availabilityChip,
                      {
                        backgroundColor:
                          book.availableCopies > 0
                            ? theme.isDark ? '#1A4D2E' : '#D1FAE5'
                            : theme.isDark ? '#4D1A1A' : '#FEE2E2',
                      },
                    ]}
                    textStyle={{
                      color: book.availableCopies > 0 ? theme.colors.success : theme.colors.error,
                      fontSize: 10,
                    }}
                  >
                    {book.availableCopies > 0 ? 'Available' : 'Not Available'}
                  </Chip>
                </View>

                <Title style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Title>
                <Text style={styles.bookAuthor}>by {book.author}</Text>

                <View style={styles.bookDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ISBN:</Text>
                    <Text style={styles.detailValue}>{book.isbn}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>{book.category}</Text>
                  </View>
                  {book.publisher && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Publisher:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {book.publisher} {book.publishYear ? `(${book.publishYear})` : ''}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Available:</Text>
                    <Text style={styles.detailValue}>
                      {book.availableCopies}/{book.totalCopies}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </View>
  );

  const renderIssuedTab = () => {
    const currentIssues = issues.filter(
      (issue) => issue.status === 'issued' || issue.status === 'overdue'
    );

    return (
      <View style={styles.tabContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.tabTitle}>Currently Issued Books</Title>
          </Card.Content>
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading issued books...</Text>
          </View>
        ) : currentIssues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No issued books</Text>
          </View>
        ) : (
          currentIssues.map((issue) => (
            <Card key={issue._id} style={styles.issueCard}>
              <Card.Content>
                <View style={styles.issueHeader}>
                  <Ionicons
                    name={getStatusIcon(issue.status)}
                    size={24}
                    color={getStatusColor(issue.status)}
                  />
                  <View style={styles.issueInfo}>
                    <Title style={styles.issueTitle} numberOfLines={2}>
                      {issue.book.title}
                    </Title>
                    <Text style={styles.issueAuthor}>by {issue.book.author}</Text>
                  </View>
                </View>

                <View style={styles.issueDates}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.dateLabel}>Issued:</Text>
                    <Text style={styles.dateValue}>{formatDate(issue.issueDate)}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.dateLabel}>Due:</Text>
                    <Text style={styles.dateValue}>{formatDate(issue.dueDate)}</Text>
                  </View>
                </View>

                <View style={styles.issueFooter}>
                  <Chip
                    style={{ backgroundColor: getStatusColor(issue.status) + '20' }}
                    textStyle={{ color: getStatusColor(issue.status), fontSize: 12 }}
                  >
                    {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                  </Chip>
                  {(issue.fine || issue.calculatedFine) && issue.calculatedFine > 0 ? (
                    <Text style={styles.fineText}>Fine: ₹{issue.calculatedFine || issue.fine}</Text>
                  ) : null}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    );
  };

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.tabTitle}>Book Issue History</Title>
        </Card.Content>
      </Card>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No book issue history</Text>
        </View>
      ) : (
        issues.map((issue) => (
          <Card key={issue._id} style={styles.historyCard}>
            <Card.Content>
              <View style={styles.historyHeader}>
                <Title style={styles.historyTitle} numberOfLines={1}>
                  {issue.book.title}
                </Title>
                <Chip
                  style={{ backgroundColor: getStatusColor(issue.status) + '20' }}
                  textStyle={{ color: getStatusColor(issue.status), fontSize: 10 }}
                >
                  {issue.status}
                </Chip>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>ISBN:</Text>
                  <Text style={styles.historyValue}>{issue.book.isbn}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Issued:</Text>
                  <Text style={styles.historyValue}>{formatDate(issue.issueDate)}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Due:</Text>
                  <Text style={styles.historyValue}>{formatDate(issue.dueDate)}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Returned:</Text>
                  <Text style={styles.historyValue}>
                    {issue.returnDate ? formatDate(issue.returnDate) : '-'}
                  </Text>
                </View>
                {(issue.fine || 0) > 0 && (
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Fine:</Text>
                    <Text style={[styles.historyValue, { color: theme.colors.error }]}>
                      ₹{issue.fine}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );

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
          <Ionicons name="library" size={24} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Library</Title>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'search', label: 'Search Books', icon: 'search' },
            { id: 'issued', label: 'My Books', icon: 'book' },
            { id: 'history', label: 'History', icon: 'time' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && { color: theme.colors.primary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'issued' && renderIssuedTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>
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
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    tabsContainer: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 8,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: theme.colors.primary,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    tabContent: {
      padding: 16,
    },
    searchCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.card,
      elevation: 2,
    },
    searchSection: {
      gap: 12,
    },
    searchBar: {
      backgroundColor: theme.isDark ? '#0A0A0A' : '#F9FAFB',
      elevation: 0,
    },
    searchTypeContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      height: 32,
    },
    categoryFilter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    categoryChip: {
      height: 28,
      marginRight: 6,
    },
    searchButton: {
      marginTop: 4,
      backgroundColor: theme.colors.primary,
    },
    booksGrid: {
      gap: 12,
    },
    bookCard: {
      backgroundColor: theme.colors.card,
      marginBottom: 12,
      elevation: 2,
    },
    bookHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    availabilityChip: {
      height: 24,
    },
    bookTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    bookAuthor: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    bookDetails: {
      gap: 6,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 12,
      color: theme.colors.text,
      flex: 1,
      textAlign: 'right',
    },
    headerCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.card,
      elevation: 1,
    },
    tabTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    issueCard: {
      backgroundColor: theme.colors.card,
      marginBottom: 12,
      elevation: 2,
    },
    issueHeader: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    issueInfo: {
      flex: 1,
    },
    issueTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    issueAuthor: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    issueDates: {
      gap: 8,
      marginBottom: 12,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    dateValue: {
      fontSize: 12,
      color: theme.colors.text,
    },
    issueFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fineText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.error,
    },
    historyCard: {
      backgroundColor: theme.colors.card,
      marginBottom: 12,
      elevation: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    historyTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    historyDetails: {
      gap: 6,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    historyLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    historyValue: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 300,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorCard: {
      backgroundColor: theme.isDark ? '#2A1A1A' : '#FEE2E2',
      elevation: 1,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
    },
  });
