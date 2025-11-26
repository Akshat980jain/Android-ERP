const express = require('express');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/library/books
// @desc    Get all books with search and filter
// @access  Private
router.get('/books', auth, async (req, res) => {
  try {
    const { search, category, searchType = 'title' } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      if (searchType === 'title') {
        query.title = { $regex: search, $options: 'i' };
      } else if (searchType === 'author') {
        query.author = { $regex: search, $options: 'i' };
      } else if (searchType === 'isbn') {
        query.isbn = { $regex: search, $options: 'i' };
      }
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const books = await Book.find(query).sort({ title: 1 });

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/library/books
// @desc    Add new book (library staff only)
// @access  Private
router.post('/books', auth, authorize('library', 'admin'), async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();

    res.status(201).json({
      success: true,
      book
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/library/issues
// @desc    Get book issues
// @access  Private
router.get('/issues', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const issues = await BookIssue.find(query)
      .populate('book', 'title author isbn')
      .populate('student', 'name profile.studentId')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 });

    // Calculate fines for overdue books
    const issuesWithFines = issues.map(issue => {
      const issueObj = issue.toObject();
      if (issue.status !== 'returned') {
        issueObj.calculatedFine = issue.calculateFine();
        if (issueObj.calculatedFine > 0) {
          issueObj.status = 'overdue';
        }
      }
      return issueObj;
    });

    res.json({
      success: true,
      issues: issuesWithFines
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/library/issue
// @desc    Issue a book (library staff only)
// @access  Private
router.post('/issue', auth, authorize('library', 'admin'), async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;

    // Check if book is available
    const book = await Book.findById(bookId);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // Check if student already has this book
    const existingIssue = await BookIssue.findOne({
      book: bookId,
      student: studentId,
      status: 'issued'
    });

    if (existingIssue) {
      return res.status(400).json({ message: 'Student already has this book issued' });
    }

    // Create book issue
    const bookIssue = new BookIssue({
      book: bookId,
      student: studentId,
      dueDate: new Date(dueDate),
      issuedBy: req.user._id
    });

    await bookIssue.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      success: true,
      bookIssue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/library/return/:id
// @desc    Return a book (library staff only)
// @access  Private
router.put('/return/:id', auth, authorize('library', 'admin'), async (req, res) => {
  try {
    const { fine, remarks } = req.body;

    const bookIssue = await BookIssue.findById(req.params.id).populate('book');
    if (!bookIssue) {
      return res.status(404).json({ message: 'Book issue not found' });
    }

    if (bookIssue.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    // Update book issue
    bookIssue.returnDate = new Date();
    bookIssue.status = 'returned';
    bookIssue.fine = fine || bookIssue.calculateFine();
    bookIssue.returnedBy = req.user._id;
    bookIssue.remarks = remarks;

    await bookIssue.save();

    // Update book availability
    const book = await Book.findById(bookIssue.book._id);
    book.availableCopies += 1;
    await book.save();

    res.json({
      success: true,
      bookIssue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;