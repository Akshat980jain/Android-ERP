import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, Clock, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import apiClient from '../../utils/api';

interface Book {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
  publisher?: string;
  publishYear?: number;
  description?: string;
  language?: string;
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

export function LibraryModule() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>(['all']);

  useEffect(() => {
    async function fetchLibraryData() {
      setLoading(true);
      setError('');
      try {
        const booksRes: unknown = await apiClient.getBooks();
        let fetchedBooks: Book[] = [];
        if (booksRes && typeof booksRes === 'object' && 'books' in booksRes && Array.isArray((booksRes as { books?: unknown }).books)) {
          fetchedBooks = (booksRes as { books: Book[] }).books;
        } else if (booksRes && typeof booksRes === 'object' && 'data' in booksRes && Array.isArray((booksRes as { data?: unknown }).data)) {
          fetchedBooks = (booksRes as { data: Book[] }).data;
        } else if (Array.isArray(booksRes)) {
          fetchedBooks = booksRes as Book[];
        }
        setBooks(fetchedBooks);
        const cats = Array.from(new Set(fetchedBooks.map((b: Book) => b.category).filter(Boolean)));
        setCategories(['all', ...cats]);

        const issuesRes: unknown = await apiClient.getBookIssues();
        let fetchedIssues: BookIssue[] = [];
        if (issuesRes && typeof issuesRes === 'object' && 'issues' in issuesRes && Array.isArray((issuesRes as { issues?: unknown }).issues)) {
          fetchedIssues = (issuesRes as { issues: BookIssue[] }).issues;
        } else if (issuesRes && typeof issuesRes === 'object' && 'data' in issuesRes && Array.isArray((issuesRes as { data?: unknown }).data)) {
          fetchedIssues = (issuesRes as { data: BookIssue[] }).data;
        } else if (Array.isArray(issuesRes)) {
          fetchedIssues = issuesRes as BookIssue[];
        }
        setIssuedBooks(fetchedIssues);
      } catch {
        setError('Failed to load library data. Please try again later.');
        setBooks([]);
        setIssuedBooks([]);
        setCategories(['all']);
      }
      setLoading(false);
    }
    fetchLibraryData();
  }, []);

  const filteredBooks = books.filter(book => {
    const matchesSearch = searchQuery === '' || 
      (searchType === 'title' && book.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (searchType === 'author' && book.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (searchType === 'isbn' && book.isbn.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'returned':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'issued':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'returned':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'issued':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const tabs = [
    { id: 'search', label: 'Search Books' },
    { id: 'issued', label: 'My Books' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'search' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="w-4 h-4 text-gray-400" />}
                    />
                  </div>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="isbn">ISBN</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading books...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No books found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book._id}>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          book.availableCopies > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.availableCopies > 0 ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>ISBN: {book.isbn}</p>
                        <p>Category: {book.category}</p>
                        {book.publisher && (
                          <p>Publisher: {book.publisher} {book.publishYear ? `(${book.publishYear})` : ''}</p>
                        )}
                        <p>Available: {book.availableCopies}/{book.totalCopies}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'issued' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currently Issued Books</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading issued books...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : issuedBooks.filter(book => book.status === 'issued' || book.status === 'overdue').length === 0 ? (
                <div className="text-center py-8 text-gray-500">No issued books.</div>
              ) : (
                <div className="space-y-4">
                  {issuedBooks.filter(book => book.status === 'issued' || book.status === 'overdue').map((issue) => (
                    <div key={issue._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(issue.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{issue.book.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {new Date(issue.issueDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>
                          </div>
                          {(issue.fine || issue.calculatedFine) && (
                            <p className="text-sm text-red-600">Fine: ₹{issue.calculatedFine || issue.fine}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={getStatusBadge(issue.status)}>
                          {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Book Issue History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading history...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : issuedBooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No book issue history.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issuedBooks.map((issue) => (
                      <tr key={issue._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {issue.book.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(issue.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(issue.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(issue.status)}>
                            {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.fine ? `₹${issue.fine}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}