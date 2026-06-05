/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, Conversation, Message, MessageReaction, MessageRead } from '../types';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Sticker } from '../components/chat/StickerPicker';
import { Loader2 } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const activeConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Load INITIAL batch of data
  const loadData = async () => {
    if (!profile || !isSupabaseConfigured) return;
    try {
      setLoading(true);

      // 1. Fetch Users Database
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true);

      if (usersErr) throw usersErr;
      const allUsers = (usersData || []) as UserProfile[];
      setUsers(allUsers);

      // 2. Fetch Active Conversations for current user
      const { data: myMembers, error: membersErr } = await supabase
        .from('conversation_members')
        .select('*')
        .eq('user_id', profile.id);

      if (membersErr) throw membersErr;

      const userConversationIds = myMembers?.map((m) => m.conversation_id) || [];

      if (userConversationIds.length > 0) {
        // Fetch conversation core details
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('*')
          .in('id', userConversationIds)
          .order('updated_at', { ascending: false });

        // Fetch all companion members
        const { data: allMembersData } = await supabase
          .from('conversation_members')
          .select('*')
          .in('conversation_id', userConversationIds);

        // Fetch latest message for each room
        const { data: latestMessagesData } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', userConversationIds)
          .order('created_at', { ascending: true }); // We will map the last message for each conversation in JS

        // Unread message counts
        const { data: myReadHistory } = await supabase
          .from('message_reads')
          .select('*')
          .eq('user_id', profile.id);

        const loadedConversations: Conversation[] = (conversationsData || []).map((conv) => {
          // Find companion user_id
          const members = allMembersData?.filter((m) => m.conversation_id === conv.id) || [];
          const partnerMember = members.find((m) => m.user_id !== profile.id);
          const partnerProfile = partnerMember
            ? allUsers.find((u) => u.id === partnerMember.user_id)
            : null;

          // Find latest message
          const roomMsgs = latestMessagesData?.filter((m) => m.conversation_id === conv.id) || [];
          const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;

          // Compute unread count (messages sent by others which don't have read receipts for current user)
          const partnerMsgs = roomMsgs.filter((m) => m.sender_id !== profile.id && !m.deleted);
          const unreadMsgs = partnerMsgs.filter(
            (m) => !myReadHistory?.some((r) => r.message_id === m.id)
          );

          return {
            ...conv,
            partner: partnerProfile || {
              id: 'unknown',
              auth_user_id: 'unknown',
              email: 'unknown',
              full_name: 'Người dùng cũ',
              avatar_url: null,
              role: 'user',
              is_active: false,
              is_online: false,
              last_seen: null,
            },
            last_message: lastMsg,
            unread_count: unreadMsgs.length,
          };
        });

        setConversations(loadedConversations);
      }
    } catch (err) {
      console.error('Error loading chat metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  // Load messages for selectively active conversation
  const loadActiveMessages = async (conversationId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          reactions (*),
          reads:message_reads (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);

      // Mark unread messages in this selected conversation as READ
      await markConversationAsRead(conversationId, (data || []) as Message[]);
    } catch (err) {
      console.error('Error loading active messages:', err);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadActiveMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Mark all unread messages as read in selected conversation
  const markConversationAsRead = async (conversationId: string, messageList: Message[]) => {
    if (!profile || !isSupabaseConfigured) return;
    const unreadFromPartner = messageList.filter(
      (m) => m.sender_id !== profile.id && !m.reads?.some((r) => r.user_id === profile.id)
    );

    if (unreadFromPartner.length === 0) return;

    try {
      const readInserts = unreadFromPartner.map((m) => ({
        message_id: m.id,
        user_id: profile.id,
        read_at: new Date().toISOString(),
      }));

      await supabase.from('message_reads').upsert(readInserts);

      // Clean unread count locally in Sidebar state
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Realtime Broadcast Listener subscriptions
  useEffect(() => {
    if (!profile || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('public-chat-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
        const target = payload.new as any;
        const oldTarget = payload.old as any;

        // 1. If active conversation, load or update the message log
        if (activeConversationIdRef.current && (target?.conversation_id === activeConversationIdRef.current || oldTarget?.conversation_id === activeConversationIdRef.current)) {
          if (payload.eventType === 'INSERT') {
            const { data: freshMsg } = await supabase
              .from('messages')
              .select('*, reactions(*), reads:message_reads (*)')
              .eq('id', target.id)
              .single();

            if (freshMsg) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === freshMsg.id)) return prev;
                return [...prev, freshMsg as Message];
              });

              // Auto-mark it as read if current user is active inside this conversation
              if (freshMsg.sender_id !== profile.id) {
                await supabase.from('message_reads').upsert([
                  { message_id: freshMsg.id, user_id: profile.id, read_at: new Date().toISOString() },
                ]);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) => (m.id === target.id ? { ...m, ...target } : m))
            );
          }
        }

        // 2. Dynamic Update sidebar latest text snippet & unread counts
        setConversations((prev) => {
          return prev.map((c) => {
            const currentRoomId = target?.conversation_id || oldTarget?.conversation_id;
            if (c.id === currentRoomId) {
              const countUpdate =
                target?.sender_id !== profile.id &&
                payload.eventType === 'INSERT' &&
                activeConversationIdRef.current !== currentRoomId
                  ? (c.unread_count || 0) + 1
                  : c.unread_count;

              return {
                ...c,
                last_message: payload.eventType === 'INSERT' ? (target as any) : c.last_message,
                unread_count: countUpdate,
              };
            }
            return c;
          });
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, async (payload) => {
        // Appends reaction realtime
        const target = payload.eventType === 'DELETE' ? (payload.old as any) : (payload.new as any);
        if (!target?.message_id) return;

        // Fetch refreshed reactions for that message
        const { data: freshReactions } = await supabase
          .from('reactions')
          .select('*')
          .eq('message_id', target.message_id);

        setMessages((prev) =>
          prev.map((m) => (m.id === target.message_id ? { ...m, reactions: (freshReactions || []) as MessageReaction[] } : m))
        );
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads' }, async (payload) => {
        // Mark message seen status
        const target = payload.new as any;
        if (!target?.message_id) return;

        const { data: freshReads } = await supabase
          .from('message_reads')
          .select('*')
          .eq('message_id', target.message_id);

        setMessages((prev) =>
          prev.map((m) => (m.id === target.message_id ? { ...m, reads: (freshReads || []) as MessageRead[] } : m))
        );
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        // Update online lists dynamic
        const updatedUser = payload.new as UserProfile;
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
        setConversations((prev) =>
          prev.map((c) =>
            c.partner?.id === updatedUser.id ? { ...c, partner: { ...c.partner, ...updatedUser } } : c
          )
        );
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id]);

  // Fail-safe silent background polling sync for messages, reactions, read-receipts, and lateral conversation updates
  useEffect(() => {
    if (!profile || !isSupabaseConfigured) return;

    const performSilentSync = async () => {
      try {
        // 1. Fetch Users Database silently to obtain statuses
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .eq('is_active', true);
        
        const allUsers = (usersData || []) as UserProfile[];
        if (allUsers.length > 0) {
          setUsers(allUsers);
        }

        // 2. Fetch Active Conversations for current user
        const { data: myMembers } = await supabase
          .from('conversation_members')
          .select('*')
          .eq('user_id', profile.id);

        const userConversationIds = myMembers?.map((m) => m.conversation_id) || [];

        if (userConversationIds.length > 0) {
          // Fetch conversation core details
          const { data: conversationsData } = await supabase
            .from('conversations')
            .select('*')
            .in('id', userConversationIds)
            .order('updated_at', { ascending: false });

          // Fetch all companion members
          const { data: allMembersData } = await supabase
            .from('conversation_members')
            .select('*')
            .in('conversation_id', userConversationIds);

          // Fetch latest message list
          const { data: latestMessagesData } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', userConversationIds)
            .order('created_at', { ascending: true });

          // Unread message histories
          const { data: myReadHistory } = await supabase
            .from('message_reads')
            .select('*')
            .eq('user_id', profile.id);

          const loadedConversations: Conversation[] = (conversationsData || []).map((conv) => {
            const members = allMembersData?.filter((m) => m.conversation_id === conv.id) || [];
            const partnerMember = members.find((m) => m.user_id !== profile.id);
            const partnerProfile = partnerMember
              ? allUsers.find((u) => u.id === partnerMember.user_id)
              : null;

            const roomMsgs = latestMessagesData?.filter((m) => m.conversation_id === conv.id) || [];
            const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;

            const partnerMsgs = roomMsgs.filter((m) => m.sender_id !== profile.id && !m.deleted);
            const unreadMsgs = partnerMsgs.filter(
              (m) => !myReadHistory?.some((r) => r.message_id === m.id)
            );

            return {
              ...conv,
              partner: partnerProfile || {
                id: 'unknown',
                auth_user_id: 'unknown',
                email: 'unknown',
                full_name: 'Người dùng cũ',
                avatar_url: null,
                role: 'user',
                is_active: false,
                is_online: false,
                last_seen: null,
              },
              last_message: lastMsg,
              unread_count: unreadMsgs.length,
            };
          });

          setConversations(loadedConversations);
        }

        // 3. Silently fetch active conversation messages if active
        if (activeConversationIdRef.current) {
          const { data: msgData } = await supabase
            .from('messages')
            .select(`
              *,
              reactions (*),
              reads:message_reads (*)
            `)
            .eq('conversation_id', activeConversationIdRef.current)
            .order('created_at', { ascending: true });

          if (msgData) {
            setMessages((prev) => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(msgData);
              if (prevStr !== nextStr) {
                return msgData as Message[];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Silent background sync error:', err);
      }
    };

    // Perform sync every 1.5 seconds for snappy near-instantaneous updates
    const interval = setInterval(performSilentSync, 1500);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Initiate message sending
  const handleSendText = async (text: string) => {
    if (!profile || !activeConversationId || !isSupabaseConfigured) return;
    try {
      const tempMsg = {
        conversation_id: activeConversationId,
        sender_id: profile.id,
        type: 'text',
        content: text,
        edited: false,
        deleted: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([tempMsg])
        .select('*, reactions(*), reads:message_reads (*)')
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as Message];
        });

        // Update conversation's last_message and bump its reference
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, last_message: data as Message }
              : c
          )
        );
      }

      // Update conversations updated_at timestamp to sync ordering in list
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSendSticker = async (sticker: Sticker) => {
    if (!profile || !activeConversationId || !isSupabaseConfigured) return;
    try {
      const stickerMsg = {
        conversation_id: activeConversationId,
        sender_id: profile.id,
        type: 'sticker',
        content: sticker.url,
        edited: false,
        deleted: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([stickerMsg])
        .select('*, reactions(*), reads:message_reads (*)')
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as Message];
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, last_message: data as Message }
              : c
          )
        );
      }

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);
    } catch (err) {
      console.error('Error sending sticker:', err);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!profile || !activeConversationId || !isSupabaseConfigured) return;
    try {
      setIsUploading(true);

      // Upload file to bucket
      const filePath = `${profile.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file);

      if (error) throw error;

      // Retreive public url
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      const publicImageUrl = urlData.publicUrl;

      // Store in messages database table
      const imageMsg = {
        conversation_id: activeConversationId,
        sender_id: profile.id,
        type: 'image',
        content: publicImageUrl,
        edited: false,
        deleted: false,
      };

      const { data: insertData, error: insertErr } = await supabase
        .from('messages')
        .insert([imageMsg])
        .select('*, reactions(*), reads:message_reads (*)')
        .single();

      if (insertErr) throw insertErr;
      if (insertData) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === insertData.id)) return prev;
          return [...prev, insertData as Message];
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, last_message: insertData as Message }
              : c
          )
        );
      }

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);
    } catch (err) {
      console.error('Error uploading chat image:', err);
      alert('Có lỗi xảy ra khi gởi ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  // Reactions Upsert
  const handleReact = async (messageId: string, emoji: string) => {
    if (!profile || !isSupabaseConfigured) return;

    try {
      // Check if user already selection with this emoji
      const { data: existing } = await supabase
        .from('reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', profile.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Toggle off - Delete reaction
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        // Check if there is other reaction by user, delete first to maintain single active reaction
        const { data: otherReactions } = await supabase
          .from('reactions')
          .select('*')
          .eq('message_id', messageId)
          .eq('user_id', profile.id);

        if (otherReactions && otherReactions.length > 0) {
          const ids = otherReactions.map((r) => r.id);
          await supabase.from('reactions').delete().in('id', ids);
        }

        // Add fresh reaction
        await supabase.from('reactions').insert([
          {
            message_id: messageId,
            user_id: profile.id,
            emoji: emoji,
          },
        ]);
      }

      // Read refreshed reactions from DB and update local state immediately
      const { data: freshReactions } = await supabase
        .from('reactions')
        .select('*')
        .eq('message_id', messageId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: (freshReactions || []) as MessageReaction[] }
            : m
        )
      );
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  // Soft Delete / Revoke Message
  const handleDelete = async (messageId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('messages')
        .update({ deleted: true, content: 'Tin nhắn đã được thu hồi.' })
        .eq('id', messageId);

      // Update locally immediately
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deleted: true, content: 'Tin nhắn đã được thu hồi.' }
            : m
        )
      );
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Click on user directory contact list card -> create or fetch active conversation
  const handleSelectUser = async (selectedUser: UserProfile) => {
    if (!profile || !isSupabaseConfigured) return;

    try {
      // Find existing 1-1 conversation involving ONLY the selectedUser and current user
      const existingConv = conversations.find((c) => c.partner?.id === selectedUser.id);

      if (existingConv) {
        setActiveConversationId(existingConv.id);
        return;
      }

      setLoading(true);

      // Create new conversation
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert([{}]).select().single();

      if (convErr) throw convErr;

      // Create member credentials
      const firstMember = { conversation_id: newConv.id, user_id: profile.id };
      const secondMember = { conversation_id: newConv.id, user_id: selectedUser.id };

      const { error: membersErr } = await supabase
        .from('conversation_members')
        .insert([firstMember, secondMember]);

      if (membersErr) throw membersErr;

      // Add to local state list instantly
      const newConversationObject: Conversation = {
        ...newConv,
        partner: selectedUser,
        unread_count: 0,
        last_message: null,
      };

      setConversations((prev) => [newConversationObject, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      console.error('Error initiating conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 dark:bg-slate-905 dark:text-slate-100">
      <Sidebar
        conversations={conversations}
        users={users}
        activeConversationId={activeConversationId}
        onSelectUser={handleSelectUser}
        onSelectConversation={setActiveConversationId}
      />
      
      {loading && messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-xs font-semibold text-slate-400">Đang đồng bộ hội thoại...</p>
          </div>
        </div>
      ) : (
        <ChatWindow
          conversation={activeConversation}
          currentProfile={profile!}
          messages={messages}
          onSendText={handleSendText}
          onSendSticker={handleSendSticker}
          onSendImage={handleSendImage}
          onReact={handleReact}
          onDelete={handleDelete}
          isUploading={isUploading}
        />
      )}
    </div>
  );
};
