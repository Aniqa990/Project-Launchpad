import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Send, 
  Search, 
  MoreVertical,
  Paperclip,
  Trash2,
  Check,
  CheckCheck,
  ArrowLeft,
  User,
  Clock
} from 'lucide-react';
import { getUserMessages, getConversationMessages, sendMessage, markMessageRead, deleteMessage } from '../../apiendpoints';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  messageContent: string;
  upload?: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}

export function FreelancerMessages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock current user ID (in real app, get from auth context)
  const currentUserId = 2; // Different ID for freelancer

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      // Get all messages for current user
      const data = await getUserMessages(currentUserId);
      setConversations(data);
      
      // Group messages by conversation
      const conversationMap = new Map<number, Conversation>();
      
      (data as Message[]).forEach((message: Message) => {
        const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: `Client ${otherUserId}`, // In real app, fetch user details
            lastMessage: message.messageContent,
            lastMessageTime: message.timestamp,
            unreadCount: message.senderId !== currentUserId && !message.isRead ? 1 : 0,
            avatar: `https://images.pexels.com/photos/${2000 + otherUserId}/pexels-photo-${2000 + otherUserId}.jpeg?auto=compress&cs=tinysrgb&w=400`
          });
        } else {
          const conversation = conversationMap.get(otherUserId)!;
          if (new Date(message.timestamp) > new Date(conversation.lastMessageTime)) {
            conversation.lastMessage = message.messageContent;
            conversation.lastMessageTime = message.timestamp;
          }
          if (message.senderId !== currentUserId && !message.isRead) {
            conversation.unreadCount++;
          }
        }
      });
      
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    try {
      const data = await getConversationMessages(currentUserId, otherUserId);
      setMessages(data);
      
      // Mark messages as read
      (data as Message[])
        .filter((msg: Message) => msg.senderId !== currentUserId && !msg.isRead)
        .forEach((msg: Message) => { markMessageRead(msg.id); });
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSending(true);
    try {
      const messageData = {
        senderId: currentUserId,
        receiverId: selectedConversation.userId,
        messageContent: newMessage.trim(),
        upload: null
      };
      
      const data = await sendMessage(messageData);
      setMessages((prev: Message[]) => [...prev, data as Message]);
      setNewMessage('');
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.userId === selectedConversation.userId 
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: new Date().toISOString() }
          : conv
      ));
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await markMessageRead(messageId);
      setMessages(prev => prev.map((msg: Message) => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Failed to mark message as read');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter((msg: Message) => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading messages...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-120px)]">
      <div className="flex h-full bg-white rounded-lg shadow-sm border">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No conversations found' : 'No messages yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.userId === conversation.userId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar src={conversation.avatar} alt={conversation.userName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{conversation.userName}</h3>
                        <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <Badge variant="default" size="sm">
                            {conversation.unreadCount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar src={selectedConversation.avatar} alt={selectedConversation.userName} size="md" />
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversation.userName}</h2>
                    <p className="text-sm text-gray-500">Active now</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUserId
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.messageContent}</p>
                        <div className={`flex items-center justify-between mt-1 text-xs ${
                          message.senderId === currentUserId ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.senderId === currentUserId && (
                            <div className="flex items-center space-x-1">
                              {message.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            </div>
                          )}
                        </div>
                        {message.senderId === currentUserId && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-green-100 hover:text-white mt-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    icon={Send}
                    size="sm"
                    variant="primary"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 