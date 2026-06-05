/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, Conversation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, LogOut, Shield, Settings, User, Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  conversations: Conversation[];
  users: UserProfile[];
  activeConversationId: string | null;
  onSelectUser: (user: UserProfile) => void;
  onSelectConversation: (conversationId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  users,
  activeConversationId,
  onSelectUser,
  onSelectConversation,
}) => {
  const { profile, signOut, updateProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'chats' | 'users'>('chats');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || '');

  if (!profile) return null;

  // Filter conversations based on search
  const filteredConversations = conversations.filter((c) => {
    const partnerName = c.partner?.full_name || '';
    return partnerName.toLowerCase().includes(search.toLowerCase());
  });

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    // Exclude self
    if (u.id === profile.id) return false;
    return u.full_name.toLowerCase().includes(search.toLowerCase());
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const { error } = await updateProfile({
      full_name: editName.trim(),
      avatar_url: editAvatar.trim() || null,
    });
    if (!error) {
      setShowEditProfile(false);
    } else {
      alert("Cập nhật thông tin thất bại.");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-full w-full md:w-80 flex-col border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Messenger
            </span>
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                <Shield className="h-2.5 w-2.5" />
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {profile.role === 'admin' && (
              <Link
                to="/admin"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title="Quản lý Admin"
              >
                <Shield className="h-4.5 w-4.5" />
              </Link>
            )}
            <button
              onClick={() => {
                setEditName(profile.full_name);
                setEditAvatar(profile.avatar_url || '');
                setShowEditProfile(true);
              }}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Cài đặt tài khoản"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={signOut}
              className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-500"
              title="Đăng xuất"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm người dùng hoặc phòng..."
            className="w-full rounded-full border border-slate-100 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
          />
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-50 dark:border-slate-850 text-center font-semibold text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/60 p-1 m-2 rounded-xl">
        <button
          onClick={() => setTab('chats')}
          className={`py-1.5 rounded-lg transition-all ${
            tab === 'chats'
              ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
              : 'hover:text-slate-805 dark:hover:text-slate-300'
          }`}
        >
          Trò chuyện ({filteredConversations.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`py-1.5 rounded-lg transition-all ${
            tab === 'users'
              ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
              : 'hover:text-slate-805 dark:hover:text-slate-300'
          }`}
        >
          Danh bạ ({filteredUsers.length})
        </button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' ? (
          <div>
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Chưa có hội thoại nào</p>
                <button
                  onClick={() => setTab('users')}
                  className="mt-2 text-xs font-semibold text-blue-500 hover:underline"
                >
                  Bắt đầu nhắn tin ngay
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                const unreadStr = conv.unread_count && conv.unread_count > 0 ? `(${conv.unread_count})` : '';
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50/30 dark:border-slate-800/20 ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-l-blue-500 pl-3'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Avatar with Presence dot */}
                    <div className="relative">
                      {conv.partner?.avatar_url ? (
                        <img
                          src={conv.partner.avatar_url}
                          alt={conv.partner.full_name}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 rounded-full bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                          {conv.partner ? getInitials(conv.partner.full_name) : 'G'}
                        </div>
                      )}
                      {conv.partner?.is_online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 block" />
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold text-slate-800 dark:text-slate-100 ${
                          conv.unread_count && conv.unread_count > 0 ? 'font-bold text-slate-900' : ''
                        }`}>
                          {conv.partner?.full_name || 'Hội thoại'}
                        </span>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-[11px] truncate ${
                        conv.unread_count && conv.unread_count > 0 ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-400'
                      }`}>
                        {conv.last_message?.deleted 
                          ? 'Tin nhắn đã gỡ' 
                          : conv.last_message?.type === 'image' 
                            ? '[Hình ảnh]' 
                            : conv.last_message?.type === 'sticker'
                              ? '[Sticker]'
                              : conv.last_message?.content || 'Chưa có tin nhắn nào'
                        }
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy người dùng nào khác
              </div>
            ) : (
              filteredUsers.map((u) => {
                return (
                  <button
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-805/40 transition-colors border-b border-slate-50/30 dark:border-slate-804/20"
                  >
                    {/* User Presence Avatar */}
                    <div className="relative">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name}
                          className="h-11 w-11 rounded-full bg-slate-100 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {getInitials(u.full_name)}
                        </div>
                      )}
                      {u.is_online ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />
                      ) : (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-300 border-2 border-white dark:border-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {u.full_name}
                        </span>
                        {u.role === 'admin' && (
                          <span className="rounded bg-red-100 px-1 py-0.2 text-[8px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                            Ad
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                        {u.is_online ? (
                          <span className="text-green-500 font-medium">Đang hoạt động</span>
                        ) : u.last_seen ? (
                          `Hoạt động ${new Date(u.last_seen).toLocaleDateString('vi-VN')} lúc ${new Date(u.last_seen).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}`
                        ) : (
                          'Ngoại tuyến'
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Dynamic Modal / Self Profile Edits */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-slide-up">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-blue-500" />
              Cài đặt hồ sơ cá nhân
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Đường dẫn ảnh đại diện (URL)
                </label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Để trống để dùng ảnh mặc định"
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </div>

              {editAvatar.trim() && (
                <div className="flex justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40">
                  <img
                    src={editAvatar}
                    alt="Preview"
                    className="h-14 w-14 rounded-full object-cover border-2 border-blue-400"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-95 flex items-center gap-1 shadow-md shadow-blue-500/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logged-in profile badge at base footer */}
      <div className="p-3 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-50 dark:border-slate-850 flex items-center gap-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover border border-slate-100 dark:border-slate-800"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-slate-100 dark:border-slate-800">
            {getInitials(profile.full_name)}
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {profile.full_name}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {profile.email}• <span className="font-semibold uppercase text-slate-400">{profile.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
