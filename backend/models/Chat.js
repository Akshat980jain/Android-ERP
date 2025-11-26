const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date
  }],
  chatType: {
    type: String,
    enum: ['direct', 'group', 'course', 'department'],
    required: true
  },
  name: String, // For group chats
  description: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  department: String,
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'announcement'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    edited: {
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: Date,
      originalContent: String
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      emoji: String,
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat.messages'
    }
  }],
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowEditing: {
      type: Boolean,
      default: true
    },
    allowDeletion: {
      type: Boolean,
      default: false
    },
    muteNotifications: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ course: 1 });
chatSchema.index({ department: 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ 'messages.timestamp': -1 });

module.exports = mongoose.model('Chat', chatSchema);