import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    Card,
    ActivityIndicator,
    Avatar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface ChatItem {
    _id: string;
    participants: { _id: string; name: string; email?: string }[];
    lastMessage?: { content: string; createdAt: string; sender: string };
    createdAt: string;
}

interface MessageItem {
    _id: string;
    content: string;
    sender: { _id: string; name: string } | string;
    createdAt: string;
}

export default function ChatScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => { loadChats(); }, []);

    const loadChats = async () => {
        setLoading(true);
        try {
            const res: any = await apiService.getChats();
            if (res && res.success !== false) {
                const list = Array.isArray(res.chats) ? res.chats :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setChats(list);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const openChat = async (chat: ChatItem) => {
        setSelectedChat(chat);
        try {
            const res: any = await apiService.getChatMessages(chat._id);
            if (res && res.success !== false) {
                const list = Array.isArray(res.messages) ? res.messages :
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res) ? res : [];
                setMessages(list);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSend = async () => {
        if (!messageText.trim() || !selectedChat) return;
        setSending(true);
        try {
            await apiService.sendMessage(selectedChat._id, { content: messageText.trim() });
            setMessageText('');
            // Reload messages
            await openChat(selectedChat);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const getChatName = (chat: ChatItem) => {
        const others = chat.participants.filter(p => p._id !== (user as any)?._id);
        return others.map(p => p.name).join(', ') || 'Chat';
    };

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    const formatTime = (d: string) => {
        const date = new Date(d);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getSenderName = (sender: any) => {
        if (typeof sender === 'string') return sender === (user as any)?._id ? 'You' : 'Unknown';
        return sender?._id === (user as any)?._id ? 'You' : (sender?.name || 'Unknown');
    };

    const isMine = (sender: any) => {
        const senderId = typeof sender === 'string' ? sender : sender?._id;
        return senderId === (user as any)?._id;
    };

    // Chat list view
    if (!selectedChat) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                    <View style={{ width: 28 }} />
                    <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>Messages</Text>
                    <View style={{ width: 28 }} />
                </View>

                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadText, { color: theme.colors.textSecondary }]}>Loading chats...</Text>
                    </View>
                ) : chats.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No conversations</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>Start a conversation with your peers or faculty</Text>
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        keyExtractor={item => item._id}
                        renderItem={({ item }) => {
                            const name = getChatName(item);
                            return (
                                <TouchableOpacity onPress={() => openChat(item)} style={[styles.chatRow, { borderBottomColor: theme.colors.border }]}>
                                    <Avatar.Text size={48} label={getInitial(name)} style={{ backgroundColor: theme.colors.primary }} />
                                    <View style={styles.chatInfo}>
                                        <Text style={[styles.chatName, { color: theme.colors.text }]} numberOfLines={1}>{name}</Text>
                                        {item.lastMessage && (
                                            <Text style={[styles.chatPreview, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                                {item.lastMessage.content}
                                            </Text>
                                        )}
                                    </View>
                                    {item.lastMessage && (
                                        <Text style={[styles.chatTime, { color: theme.colors.textSecondary }]}>
                                            {formatTime(item.lastMessage.createdAt)}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
        );
    }

    // Message view
    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={[styles.topBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => setSelectedChat(null)}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.topBarTitle, { color: theme.colors.text }]} numberOfLines={1}>{getChatName(selectedChat)}</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                renderItem={({ item }) => {
                    const mine = isMine(item.sender);
                    return (
                        <View style={[styles.msgRow, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
                            {!mine && <Text style={[styles.msgSender, { color: theme.colors.textSecondary }]}>{getSenderName(item.sender)}</Text>}
                            <View style={[styles.msgBubble, { backgroundColor: mine ? theme.colors.primary : theme.colors.surface }]}>
                                <Text style={[styles.msgText, { color: mine ? '#FFF' : theme.colors.text }]}>{item.content}</Text>
                            </View>
                            <Text style={[styles.msgTime, { color: theme.colors.textSecondary, alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.centerBox}>
                        <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>No messages yet</Text>
                    </View>
                }
            />

            <View style={[styles.inputBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                <TextInput
                    style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={2000}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!messageText.trim() || sending}
                    style={[styles.sendBtn, { backgroundColor: messageText.trim() ? theme.colors.primary : theme.colors.surface }]}
                >
                    <Ionicons name="send" size={20} color={messageText.trim() ? '#FFF' : theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, gap: 12 },
    topBarTitle: { fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadText: { marginTop: 16, fontSize: 14 },
    emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
    emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    chatRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    chatInfo: { flex: 1, marginLeft: 14 },
    chatName: { fontSize: 16, fontWeight: '600' },
    chatPreview: { fontSize: 13, marginTop: 2 },
    chatTime: { fontSize: 11 },
    msgRow: { maxWidth: '80%', marginBottom: 12 },
    msgSender: { fontSize: 11, marginBottom: 2, marginLeft: 4 },
    msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
    msgText: { fontSize: 15 },
    msgTime: { fontSize: 10, marginTop: 2, marginHorizontal: 4 },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1, gap: 8 },
    input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
    sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
