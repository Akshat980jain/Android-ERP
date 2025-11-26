const express = require('express');
const Chat = require('../models/Chat');
const { auth, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Get user's chats
router.get('/', auth, checkVerification, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
      isActive: true
    })
    .populate('participants.user', 'firstName lastName role')
    .populate('course', 'name code')
    .sort({ 'messages.timestamp': -1 });

    // Add unread count for each chat
    const chatsWithUnread = chats.map(chat => {
      const lastMessage = chat.messages[chat.messages.length - 1];
      const unreadCount = chat.messages.filter(msg => 
        !msg.readBy.some(read => read.user.toString() === req.user._id.toString()) &&
        msg.sender.toString() !== req.user._id.toString()
      ).length;

      return {
        ...chat.toObject(),
        lastMessage,
        unreadCount
      };
    });

    res.json({ chats: chatsWithUnread });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chat
router.post('/', auth, checkVerification, async (req, res) => {
  try {
    const { participants, chatType, name, description, courseId, department } = req.body;

    if (!participants || participants.length === 0) {
      return res.status(400).json({ message: 'Participants are required' });
    }

    // Add current user to participants if not included
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id.toString());
    }

    const chatData = {
      participants: participants.map(userId => ({ user: userId })),
      chatType,
      name,
      description,
      createdBy: req.user._id
    };

    if (courseId) chatData.course = courseId;
    if (department) chatData.department = department;

    const chat = new Chat(chatData);
    await chat.save();
    await chat.populate(['participants.user', 'course']);

    res.status(201).json({ message: 'Chat created successfully', chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', auth, checkVerification, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType, attachments, replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = {
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      attachments: attachments || [],
      replyTo
    };

    chat.messages.push(message);
    await chat.save();

    // Emit real-time message via Socket.IO
    if (global.io) {
      chat.participants.forEach(participant => {
        if (participant.user.toString() !== req.user._id.toString()) {
          global.io.to(participant.user.toString()).emit('new-message', {
            chatId,
            message: {
              ...message,
              sender: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName
              }
            }
          });
        }
      });
    }

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.patch('/:chatId/read', auth, checkVerification, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark all unread messages as read
    chat.messages.forEach(message => {
      if (!message.readBy.some(read => read.user.toString() === req.user._id.toString())) {
        message.readBy.push({ user: req.user._id });
      }
    });

    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;