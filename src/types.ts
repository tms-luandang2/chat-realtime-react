/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string; // App user ID (UUID)
  auth_user_id: string; // FK to auth.users
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  is_online: boolean;
  last_seen: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  // Dynamic fields fetched or client-calculated
  partner?: UserProfile;
  last_message?: Message | null;
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'sticker';
  content: string;
  edited: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  // Optional relations
  sender?: UserProfile;
  reactions?: MessageReaction[];
  reads?: MessageRead[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: UserProfile; // Joined profile if available
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}
