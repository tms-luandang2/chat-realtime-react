/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, MessageCircle, Mail, Lock, User, Image, AlertCircle, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, profile, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && profile) {
      const from = (location.state as any)?.from?.pathname || '/chat';
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, location]);

  const handlePreFill = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@example.com');
      setPassword('password@123');
    } else {
      // Prompt values
      setEmail('luan.dang2@tomosia.com');
      setPassword('password@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        const { error } = await login(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
        } else {
          navigate('/chat');
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Vui lòng nhập họ và tên của bạn.');
          setSubmitting(false);
          return;
        }
        const { error } = await register(email.trim(), password, fullName.trim(), avatarUrl.trim());
        if (error) {
          setErrorMsg(error.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
        } else {
          alert('Đăng ký tài khoản thành công! Chat ngay.');
          navigate('/chat');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi ngoài ý muốn.');
    } finally {
      setSubmitting(false);
    }
  };

  // If Supabase credentials are missing, render a beautiful Configuration Guide card
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="inline-flex rounded-2xl bg-indigo-500/10 p-4 text-indigo-400 mb-6 border border-indigo-500/20">
            <ShieldCheck className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Yêu Cầu Thiết Lập Supabase</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Ứng dụng cần thông tin kết nối Supabase để chạy realtime. Vui lòng mở bảng <strong className="text-indigo-300">Settings &gt; Secrets</strong> trên giao diện Google AI Studio để thêm hai biến môi trường sau:
          </p>

          <div className="mt-6 space-y-3 text-left">
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tên Biến</span>
              <p className="text-xs font-mono text-indigo-400 font-bold mt-1">VITE_SUPABASE_URL</p>
              <p className="text-[11px] text-slate-400 mt-1">Lấy từ Project Settings --&gt; API trong Supabase Dashboard.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tên Biến</span>
              <p className="text-xs font-mono text-indigo-400 font-bold mt-1">VITE_SUPABASE_ANON_KEY</p>
              <p className="text-[11px] text-slate-400 mt-1">Mã khóa ANON công khai để kết nối dữ liệu client.</p>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-indigo-950/40 text-left border border-indigo-900/30">
            <p className="text-xs text-indigo-300 leading-relaxed">
              💡 <strong>Mẹo nhỏ:</strong> Hệ thống sẽ tự động đồng bộ hóa biến môi trường và khởi chạy lại máy chủ ngay lập tức khi bạn lưu các giá trị bí mật này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 animate-fade-in relative z-10">
        
        {/* Glow ball accents */}
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />

        {/* Head branding area */}
        <div className="flex flex-col items-center p-6 pb-0 select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-slate-800 dark:text-white">Realtime Messenger</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tiện ích nhắn tin tức thời cùng Supabase</p>
        </div>

        {/* Tabs switcher */}
        <div className="mx-6 mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Form controls */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-650 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Họ và tên của bạn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                    />
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Đường dẫn ảnh đại diện (URL - Tùy chọn)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                    />
                    <Image className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                />
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                />
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-95 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md shadow-blue-500/15 flex items-center justify-center gap-1"
            >
              {submitting ? 'Vùi lòng đợi...' : activeTab === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
            </button>
          </form>

          {/* Quick Pre-fill / Testing options */}
          {activeTab === 'login' && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
                Tài khoản dùng thử nhanh
              </span>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handlePreFill('admin')}
                  className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100"
                >
                  <KeyRound className="h-3.5 w-3.5 text-red-500" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFill('user')}
                  className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100"
                >
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  Member Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
