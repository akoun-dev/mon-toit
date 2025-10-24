import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  rental_application_id?: string;
  lease_id?: string;
  subject?: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'document' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  is_read: boolean;
  read_at?: string;
  is_important: boolean;
  is_archived: boolean;
  archived_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by_id?: string;
  moderated_by_id?: string;
  moderated_at?: string;
  moderation_reason?: string;
  metadata: Record<string, any>;
  reply_to_id?: string;
  thread_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;

  // Relations (inclues via select)
  sender?: {
    full_name: string;
    avatar_url?: string;
    user_type: string;
  };
  receiver?: {
    full_name: string;
    avatar_url?: string;
    user_type: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
}

export interface MessageFormData {
  receiver_id: string;
  subject?: string;
  content: string;
  message_type?: Message['message_type'];
  property_id?: string;
  rental_application_id?: string;
  lease_id?: string;
  reply_to_id?: string;
  file?: File;
}

export interface MessageThread {
  thread_id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    user_type: string;
  };
  property?: {
    id: string;
    title: string;
  };
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
  unread_count: number;
  message_count: number;
}

/**
 * Hook pour la gestion de la messagerie
 */
export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessageNotification, setNewMessageNotification] = useState<Message | null>(null);

  // Récupérer la boîte de réception
  const {
    data: inbox,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['messages', 'inbox', user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, user_type),
          receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url, user_type),
          property:properties(id, title, address)
        `)
        .eq('receiver_id', user.id)
        .eq('is_deleted', false)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id
  });

  // Récupérer les messages envoyés
  const {
    data: sent,
    isLoading: isLoadingSent
  } = useQuery({
    queryKey: ['messages', 'sent', user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, user_type),
          receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url, user_type),
          property:properties(id, title, address)
        `)
        .eq('sender_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id
  });

  // Récupérer les conversations (threads)
  const {
    data: threads,
    isLoading: isLoadingThreads
  } = useQuery({
    queryKey: ['message-threads', user?.id],
    queryFn: async (): Promise<MessageThread[]> => {
      if (!user?.id) return [];

      // Récupérer tous les messages impliquant l'utilisateur
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, user_type),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url, user_type),
          property:properties(id, title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('is_deleted', false)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Grouper par thread_id
      const threadMap = new Map<string, MessageThread>();

      messages.forEach((message: any) => {
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        const threadId = message.thread_id;

        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, {
            thread_id: threadId,
            other_user: otherUser,
            property: message.property,
            last_message: {
              content: message.content,
              created_at: message.created_at,
              is_read: message.is_read,
              sender_id: message.sender_id
            },
            unread_count: 0,
            message_count: 0
          });
        }

        const thread = threadMap.get(threadId)!;
        thread.message_count++;

        // Compter les messages non lus (reçus par l'utilisateur et non lus)
        if (message.receiver_id === user.id && !message.is_read) {
          thread.unread_count++;
        }
      });

      return Array.from(threadMap.values())
        .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());
    },
    enabled: !!user?.id
  });

  // Récupérer les messages d'un thread spécifique
  const getThreadMessages = (threadId: string) => {
    return useQuery({
      queryKey: ['messages', 'thread', threadId],
      queryFn: async (): Promise<Message[]> => {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url, user_type),
            receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url, user_type),
            property:properties(id, title, address)
          `)
          .eq('thread_id', threadId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Message[];
      },
      enabled: !!threadId
    });
  };

  // Envoyer un message
  const sendMessage = useMutation({
    mutationFn: async (formData: MessageFormData): Promise<Message> => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      // Gérer l'upload de fichier si présent
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-files')
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-files')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
        fileName = formData.file.name;
        fileSize = formData.file.size;
        fileType = formData.file.type;
      }

      // Créer un thread_id si nécessaire
      const threadId = formData.reply_to_id
        ? await getThreadId(formData.reply_to_id)
        : crypto.randomUUID();

      const messageData = {
        sender_id: user.id,
        receiver_id: formData.receiver_id,
        subject: formData.subject,
        content: formData.content,
        message_type: formData.file ? 'file' : (formData.message_type || 'text'),
        file_url,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        reply_to_id: formData.reply_to_id,
        thread_id: threadId,
        property_id: formData.property_id,
        rental_application_id: formData.rental_application_id,
        lease_id: formData.lease_id,
        metadata: {},
        last_message_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, user_type),
          receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url, user_type),
          property:properties(id, title, address)
        `)
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
    }
  });

  // Marquer un message comme lu
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('receiver_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
    }
  });

  // Archiver un message
  const archiveMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
    }
  });

  // Supprimer un message
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_id: user?.id
        })
        .eq('id', messageId)
        .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
    }
  });

  // Marquer tous les messages comme lus dans un thread
  const markThreadAsRead = useMutation({
    mutationFn: async (threadId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
    }
  });

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setNewMessageNotification(newMessage);

          // Rafraîchir les données
          queryClient.invalidateQueries({ queryKey: ['messages', 'inbox', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fonction utilitaire pour obtenir le thread_id d'un message
  const getThreadId = async (messageId: string): Promise<string> => {
    const { data, error } = await supabase
      .from('messages')
      .select('thread_id')
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data.thread_id;
  };

  return {
    inbox,
    sent,
    threads,
    isLoading,
    isLoadingSent,
    isLoadingThreads,
    error,
    refetch,
    getThreadMessages,
    sendMessage,
    markAsRead,
    markThreadAsRead,
    archiveMessage,
    deleteMessage,
    newMessageNotification,
    clearNewMessageNotification: () => setNewMessageNotification(null)
  };
};