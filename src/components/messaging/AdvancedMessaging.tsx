/**
 * MESSAGERIE AVANCÉE AVEC SUPPORT VOCAL ET VIDÉO
 * Communication complète entre locataires, propriétaires et agences
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Mic, Video, Phone, PhoneOff, MessageSquare, Paperclip,
  Image, File, Smile, MoreVertical, Search, Archive, Star,
  Clock, Check, CheckCheck, Volume2, VolumeX, Camera,
  Pause, Play, Download, Trash2, Forward, Reply
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: string;
  replyTo?: string;
  reactions?: MessageReaction[];
  createdAt: string;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number;
}

interface MessageMetadata {
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  voiceNote?: {
    duration: number;
    transccribed: boolean;
    transcription?: string;
  };
  videoCall?: {
    duration: number;
    recordingUrl?: string;
  };
}

interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: {
    userId: string;
    role: 'tenant' | 'owner' | 'agency';
    hasUnreadMessages: boolean;
    lastSeen?: string;
    isTyping?: boolean;
    isOnline?: boolean;
  }[];
  propertyId?: string;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isStarred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface VoiceCall {
  id: string;
  conversationId: string;
  initiatorId: string;
  participants: string[];
  status: 'ringing' | 'ongoing' | 'ended' | 'missed';
  startTime: string;
  endTime?: string;
  duration?: number;
  isVideoCall: boolean;
  recordingUrl?: string;
}

interface AdvancedMessagingProps {
  userId: string;
  userRole: 'tenant' | 'owner' | 'agency';
  initialConversationId?: string;
}

const AdvancedMessaging: React.FC<AdvancedMessagingProps> = ({
  userId,
  userRole,
  initialConversationId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  // États pour appels vocaux/vidéo
  const [activeCall, setActiveCall] = useState<VoiceCall | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    loadConversations();
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }

    // Configurer WebRTC pour les appels
    setupWebRTC();

    return () => {
      // Nettoyer les flux média
      audioStream?.getTracks().forEach(track => track.stop());
      videoStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/messaging/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      // Charger les détails de la conversation
      const convResponse = await fetch(`/api/messaging/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (convResponse.ok) {
        const conversation = await convResponse.json();
        setSelectedConversation(conversation);

        // Charger les messages
        const messagesResponse = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData);

          // Marquer les messages comme lus
          markMessagesAsRead(conversationId, messagesData);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'audio' | 'video' = 'text', attachments?: MessageAttachment[]) => {
    if (!selectedConversation || (!content.trim() && !attachments?.length)) return;

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      senderId: userId,
      receiverId: selectedConversation.participants.find(p => p.userId !== userId)?.userId || '',
      propertyId: selectedConversation.propertyId,
      content,
      type,
      attachments,
      isRead: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sending'
    };

    // Ajouter le message localement
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`/api/messaging/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          content,
          type,
          attachments,
          replyTo: tempMessage.replyTo
        })
      });

      if (response.ok) {
        const savedMessage = await response.json();

        // Mettre à jour le message avec l'ID réel
        setMessages(prev => prev.map(m =>
          m.id === tempMessage.id ? { ...savedMessage, deliveryStatus: 'sent' } : m
        ));

        // Mettre à jour la dernière conversation
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: savedMessage, updatedAt: savedMessage.createdAt }
            : c
        ));

        // Effacer l'input
        setMessageInput('');
      } else {
        // Marquer comme échoué
        setMessages(prev => prev.map(m =>
          m.id === tempMessage.id ? { ...m, deliveryStatus: 'failed' } : m
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Marquer comme échoué
      setMessages(prev => prev.map(m =>
        m.id === tempMessage.id ? { ...m, deliveryStatus: 'failed' } : m
      ));
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        // Envoyer comme note vocale
        const attachment: MessageAttachment = {
          id: `audio_${Date.now()}`,
          type: 'audio',
          name: audioFile.name,
          url: URL.createObjectURL(audioBlob),
          size: audioFile.size,
          mimeType: audioFile.type,
          duration: 0 // Sera calculé par le serveur
        };

        await sendMessage('', 'audio', [attachment]);

        // Nettoyer
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const initiateCall = async (isVideoCall: boolean = false) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/messaging/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          isVideoCall
        })
      });

      if (response.ok) {
        const call: VoiceCall = await response.json();
        setActiveCall(call);

        // Configurer les flux média
        if (isVideoCall) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setVideoStream(stream);
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);
        }
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const endCall = async () => {
    if (!activeCall) return;

    try {
      await fetch(`/api/messaging/calls/${activeCall.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      // Nettoyer les flux
      audioStream?.getTracks().forEach(track => track.stop());
      videoStream?.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setVideoStream(null);
      setActiveCall(null);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const setupWebRTC = () => {
    // Configuration WebRTC pour les appels en temps réel
    // Implémentation simplifiée - nécessite serveur de signalisation
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedConversation) return;

    const attachments: MessageAttachment[] = [];

    for (const file of Array.from(files)) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const attachment: MessageAttachment = {
          id: `file_${Date.now()}_${Math.random()}`,
          type: file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' : 'file',
          name: file.name,
          url: e.target?.result as string,
          size: file.size,
          mimeType: file.type
        };

        attachments.push(attachment);

        // Envoyer tous les fichiers
        if (attachments.length === files.length) {
          await sendMessage('', 'text', attachments);
        }
      };

      reader.readAsDataURL(file);
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const markMessagesAsRead = async (conversationId: string, messagesToMark: Message[]) => {
    const unreadMessages = messagesToMark.filter(m =>
      !m.isRead && m.receiverId === userId
    );

    if (unreadMessages.length === 0) return;

    try {
      await fetch(`/api/messaging/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          messageIds: unreadMessages.map(m => m.id)
        })
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Liste d'émojis simplifiée
  const emojis = ['😀', '😊', '😍', '🤔', '😂', '❤️', '👍', '👎', '🔥', '✨'];

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p =>
      p.userId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Liste des conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => loadConversation(conversation.id)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {conversation.participants.find(p => p.userId !== userId)?.userId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {conversation.participants.find(p => p.userId !== userId)?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.participants.find(p => p.userId !== userId)?.userId}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conversation.updatedAt)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'Nouveau message'}
                      </p>

                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* En-tête de conversation */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {selectedConversation.participants.find(p => p.userId !== userId)?.userId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {selectedConversation.participants.find(p => p.userId !== userId)?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.participants.find(p => p.userId !== userId)?.userId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.participants.find(p => p.userId !== userId)?.isTyping
                        ? 'En train d\'écrire...'
                        : selectedConversation.participants.find(p => p.userId !== userId)?.isOnline
                        ? 'En ligne'
                        : 'Hors ligne'
                      }
                    </p>
                  </div>
                </div>

                {/* Actions d'appel */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => initiateCall(false)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => initiateCall(true)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Appel en cours */}
            <AnimatePresence>
              {activeCall && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 border-b border-green-200 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">
                        {activeCall.isVideoCall ? 'Appel vidéo' : 'Appel vocal'} en cours
                      </span>
                      <span className="text-green-600 text-sm">
                        {activeCall.startTime && formatMessageTime(activeCall.startTime)}
                      </span>
                    </div>

                    <button
                      onClick={endCall}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Vidéo de l'appel */}
                  {activeCall.isVideoCall && videoStream && (
                    <div className="mt-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 bg-black rounded-lg"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-lg ${
                    message.senderId === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  } rounded-lg px-4 py-2`}>
                    {/* En-tête du message */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs opacity-75">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {message.senderId === userId && (
                        <div className="flex items-center gap-1">
                          {message.deliveryStatus === 'sending' && <Clock className="w-3 h-3" />}
                          {message.deliveryStatus === 'sent' && <Check className="w-3 h-3" />}
                          {message.deliveryStatus === 'delivered' && <CheckCheck className="w-3 h-3" />}
                          {message.deliveryStatus === 'read' && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          {message.deliveryStatus === 'failed' && <span className="text-red-300">✗</span>}
                        </div>
                      )}
                    </div>

                    {/* Contenu du message */}
                    {message.type === 'text' && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Attachements */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id}>
                            {attachment.type === 'image' && (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="rounded-lg max-w-full h-auto"
                              />
                            )}

                            {attachment.type === 'audio' && (
                              <audio controls className="w-full">
                                <source src={attachment.url} type={attachment.mimeType} />
                              </audio>
                            )}

                            {attachment.type === 'video' && (
                              <video controls className="rounded-lg max-w-full h-auto">
                                <source src={attachment.url} type={attachment.mimeType} />
                              </video>
                            )}

                            {attachment.type === 'file' && (
                              <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                                <File className="w-4 h-4" />
                                <span className="text-sm truncate">{attachment.name}</span>
                                <a
                                  href={attachment.url}
                                  download={attachment.name}
                                  className="ml-auto"
                                >
                                  <Download className="w-4 h-4 hover:scale-110 transition-transform" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Réponses */}
                    {message.replyTo && (
                      <div className="mt-2 p-2 bg-black/10 rounded border-l-2 border-white/30">
                        <p className="text-xs opacity-75">En réponse à un message</p>
                      </div>
                    )}

                    {/* Réactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.reactions.map((reaction, i) => (
                          <span
                            key={i}
                            className="text-xs bg-white/20 px-2 py-1 rounded-full"
                          >
                            {reaction.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              {/* Indicateur d'enregistrement vocal */}
              {isRecording && (
                <div className="flex items-center justify-between mb-3 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 text-sm font-medium">
                      Enregistrement vocal en cours...
                    </span>
                  </div>
                  <button
                    onClick={stopVoiceRecording}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Options d'attachement */}
              <AnimatePresence>
                {showAttachments && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 mb-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Image className="w-4 h-4" />
                      <span className="text-sm">Photo/Vidéo</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <File className="w-4 h-4" />
                      <span className="text-sm">Document</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Barre de saisie */}
              <div className="flex items-end gap-3">
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      setIsTyping(e.target.value.length > 0);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(messageInput);
                      }
                    }}
                    placeholder="Écrivez votre message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={isRecording}
                  />
                </div>

                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {messageInput.trim() ? (
                  <button
                    onClick={() => sendMessage(messageInput)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isRecording ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              {/* Sélecteur d'émojis */}
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="grid grid-cols-10 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojis(false);
                          }}
                          className="text-2xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          // État vide
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-500">
                Choisissez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMessaging;