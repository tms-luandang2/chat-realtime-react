/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Users, Shield, Eye, ToggleLeft, ToggleRight, Trash2, 
  Plus, Edit, Search, MessageSquare, AlertTriangle, 
  ArrowLeft, CheckCircle2, RefreshCw, LogOut, CheckCircle, ShieldAlert 
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  
  // Modal Fields
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isActive, setIsActive] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load database users
  const fetchUsersList = async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserProfile[]);
    } catch (err: any) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  // Filter users lists
  const filteredUsers = users.filter((u) => {
    const searchString = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(searchString) ||
      u.email.toLowerCase().includes(searchString) ||
      u.role.toLowerCase().includes(searchString)
    );
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.is_active).length;
  const onlineCount = users.filter((u) => u.is_online).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedUserId(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('user');
    setIsActive(true);
    setAvatarUrl('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setModalType('edit');
    setSelectedUserId(user.id);
    setEmail(user.email);
    setPassword('');
    setFullName(user.full_name);
    setRole(user.role);
    // Find matching profile status
    const uDetail = users.find(u => u.id === user.id);
    setIsActive(uDetail ? uDetail.is_active : true);
    setAvatarUrl(user.avatar_url || '');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const targetStatus = !user.is_active;
    
    // Prevent self-deactivation
    if (user.id === profile?.id) {
      alert("Bạn không thể tự vô hiệu hóa tài khoản của chính mình!");
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: targetStatus })
        .eq('id', user.id);

      if (error) throw error;

      // Update locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: targetStatus } : u))
      );
    } catch (err: any) {
      alert("Lỗi khi thay đổi trạng thái hoạt động: " + err.message);
    }
  };

  const handleHardDelete = async (user: UserProfile) => {
    if (user.id === profile?.id) {
      alert("Bạn không thể tự xóa tài khoản của mình!");
      return;
    }

    const confirmDelete = window.confirm(
      `Cảnh báo: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của "${user.full_name}"? Hành động này sẽ gỡ hoàn toàn thông tin profile.`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;

      // Update local set
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      alert("Xóa tài khoản thành công!");
    } catch (err: any) {
      alert("Lỗi khi thực hiện xóa cứng: " + err.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (modalType === 'create') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setErrorMsg('Địa chỉ email không chính xác định dạng (Vui lòng nhập dạng: name@domain.com).');
          setSubmitting(false);
          return;
        }

        if (!password || password.length < 6) {
          setErrorMsg('Mật khẩu bắt buộc phải từ 6 ký tự trở lên.');
          setSubmitting(false);
          return;
        }

        // 1. Dual Sign-Up Client Hack to avoid logging out the current admin!
        const tempSupabase = createClient(
          (import.meta as any).env.VITE_SUPABASE_URL,
          (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        );

        const { data: authData, error: authErr } = await tempSupabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (authErr) throw authErr;

        if (authData?.user) {
          // 2. Insert public profile explicitly
          const newUserProfile = {
            auth_user_id: authData.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            avatar_url: avatarUrl.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
            role: role,
            is_active: isActive,
            is_online: false,
            last_seen: null,
          };

          const { error: dbErr } = await supabase.from('users').insert([newUserProfile]);
          if (dbErr) throw dbErr;

          alert(`Đã tạo tài khoản cho ${fullName} thành công!`);
          setShowModal(false);
          fetchUsersList();
        }
      } else {
        // Edit flow
        if (!selectedUserId) return;

        const updates: Partial<UserProfile> = {
          full_name: fullName.trim(),
          role: role,
          is_active: isActive,
          avatar_url: avatarUrl.trim() || null,
        };

        const { error: editErr } = await supabase
          .from('users')
          .update(updates)
          .eq('id', selectedUserId);

        if (editErr) throw editErr;

        alert(`Đã cập nhật thông tin cho ${fullName}!`);
        setShowModal(false);
        fetchUsersList();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi ngoài ý muốn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Header Panel */}
      <header className="h-16 bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/chat"
            className="rounded-xl border border-slate-100 p-2 hover:bg-slate-50 hover:text-blue-500 dark:border-slate-800 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
            title="Quay lại Phòng Chat"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-850 dark:text-white flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-red-500" />
              Bảng Quản Trị Hệ Thống
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Quản lý và phân quyền tài khoản Messenger</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsersList}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          
          <button
            onClick={signOut}
            className="rounded-xl border border-red-105/20 px-3 py-1.5 text-xs font-semibold text-red-650 bg-red-50/50 hover:bg-red-50 hover:text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 flex items-center gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Statistics Dash Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-550 dark:bg-blue-950/30 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thành viên</p>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{totalUsers}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-2.5 text-green-550 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tài khoản hoạt động</p>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{activeUsersCount}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-555 dark:bg-emerald-950/30 dark:text-emerald-400">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang Online</p>
              <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{onlineCount}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-550 dark:bg-red-950/30 dark:text-red-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quản trị viên (Admin)</p>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{adminCount}</h3>
            </div>
          </div>
        </div>

        {/* Action Controls & Listing */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Input Filter */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thành viên (Tên, Email, Role)..."
                className="w-full rounded-xl border border-slate-150 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-850 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            {/* Create New Account Button Action */}
            <button
              onClick={handleOpenCreate}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-95 flex items-center gap-1 shadow-md shadow-blue-500/10"
            >
              <Plus className="h-4 w-4" />
              Thêm tài khoản mới
            </button>
          </div>

          {/* Table Element Responsive View */}
          <div className="overflow-x-auto">
            {loading && users.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Không tìm thấy tài khoản nào khớp với bộ lọc tìm kiếm.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-950/20 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3.5">Thành viên</th>
                    <th className="px-6 py-3.5">Phân quyền</th>
                    <th className="px-6 py-3.5">Trạng thái online</th>
                    <th className="px-6 py-3.5">Trạng thái hoạt động</th>
                    <th className="px-6 py-3.5">Ngày tham gia</th>
                    <th className="px-6 py-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/65">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === profile?.id;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition-colors">
                        
                        {/* Member item detail */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                referrerPolicy="no-referrer"
                                className="h-9 w-9 rounded-full object-cover bg-slate-100"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/40 text-xs">
                                {user.full_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                {user.full_name}
                                {isSelf && (
                                  <span className="bg-blue-50 text-blue-600 font-bold px-1 rounded text-[9px] dark:bg-blue-950/40">
                                    Tôi
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-405 font-mono mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role tag */}
                        <td className="px-6 py-3.5">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 font-semibold text-[10px] dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                              Thành viên
                            </span>
                          )}
                        </td>

                        {/* Online status indicator */}
                        <td className="px-6 py-3.5">
                          {user.is_online ? (
                            <span className="inline-flex items-center gap-1 text-green-500 font-bold">
                              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                              Online
                            </span>
                          ) : (
                            <span className="text-slate-400">Offline</span>
                          )}
                        </td>

                        {/* Active toggle check */}
                        <td className="px-6 py-3.5">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1 font-bold ${
                              user.is_active 
                                ? 'text-emerald-500 hover:text-emerald-600' 
                                : 'text-slate-405 hover:text-red-500'
                            } disabled:opacity-50`}
                          >
                            {user.is_active ? (
                              <>
                                <ToggleRight className="h-6 w-6" />
                                <span>Kích hoạt</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-6 w-6" />
                                <span className="line-through text-slate-400">Vô hiệu hóa</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions buttons */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-blue-500 dark:hover:bg-slate-800 transition-colors"
                              title="Sửa thông tin"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              disabled={isSelf}
                              onClick={() => handleHardDelete(user)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 hover:disabled:text-slate-400 transition-colors"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Popover Create/Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-slide-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                {modalType === 'create' ? <Plus className="text-blue-500 h-4.5 w-4.5" /> : <Edit className="text-blue-500 h-4.5 w-4.5" />}
                {modalType === 'create' ? 'Tạo Tài Khoản Mới' : 'Sửa Thông Tin Tài Khoản'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-650 dark:hover:bg-slate-800"
              >
                <XBtn />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Form Input fields */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Họ tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Luan Dang"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  disabled={modalType === 'edit'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {modalType === 'create' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Mật mã khởi tạo
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 mục ký tự..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Đường dẫn Avatar (URL - Tùy chọn)
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://api.dicebear.com/..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              {/* Roles selectors and toggle status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1.5">
                    Phân quyền hệ thống
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  >
                    <option value="user" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">USER (Thường)</option>
                    <option value="admin" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">ADMIN (Quản trị)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1.5">
                    Trạng thái kết nối
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                  >
                    <option value="true" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Cho phép hoạt động</option>
                    <option value="false" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Tạm khóa / Vô hiệu hóa</option>
                  </select>
                </div>
              </div>

              {/* Submit panel buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-150 mt-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-55 dark:hover:bg-slate-800 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-95 flex items-center gap-1 shadow-md shadow-blue-500/10 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {submitting ? 'Vui lòng chờ...' : modalType === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Close Icon SVG
const XBtn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
