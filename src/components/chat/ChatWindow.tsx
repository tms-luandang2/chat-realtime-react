/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Message, UserProfile, Conversation } from '../../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Sticker } from './StickerPicker';
import { MessageSquare, ShieldAlert, ArrowDown, Palette, Check, RotateCcw, Paintbrush } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Mặc định', value: '' },
  { name: 'Xanh dương nhạt', value: '#e0f2fe' },
  { name: 'Xanh lá nhạt', value: '#dcfce7' },
  { name: 'Hồng hoài cổ', value: '#ffe4e6' },
  { name: 'Cam đào nhã', value: '#ffedd5' },
  { name: 'Tím oải hương', value: '#f3e8ff' },
  { name: 'Vàng nắng nhạt', value: '#fef08a' },
  { name: 'Xám dịu mát', value: '#f1f5f9' },
  { name: 'Xanh đại dương', value: '#1e3a8a' },
  { name: 'Xanh rừng sâu', value: '#14532d' },
  { name: 'Tím mận đậm', value: '#4c1d95' },
  { name: 'Đỏ mận chín', value: '#4c0519' },
  { name: 'Xanh lục bảo dường', value: '#064e42' },
  { name: 'Xám phi thuyền', value: '#1e293b' },
  { name: 'Vùng trời bóng tối', value: '#0f172a' },
];

interface ChatWindowProps {
  conversation: Conversation | null;
  currentProfile: UserProfile;
  messages: Message[];
  onSendText: (text: string) => void;
  onSendSticker: (sticker: Sticker) => void;
  onSendImage: (file: File) => Promise<void>;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  isUploading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentProfile,
  messages,
  onSendText,
  onSendSticker,
  onSendImage,
  onReact,
  onDelete,
  isUploading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [bgColor, setBgColor] = useState<string>('');
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [hexInput, setHexInput] = useState<string>('');

  useEffect(() => {
    if (conversation?.id) {
      const saved = localStorage.getItem(`chat_bg_color_${conversation.id}`) || '';
      setBgColor(saved);
      setHexInput(saved);
    } else {
      setBgColor('');
      setHexInput('');
    }
    setShowPicker(false);
  }, [conversation?.id]);

  const handleBgColorChange = (color: string) => {
    if (!conversation?.id) return;
    if (color) {
      localStorage.setItem(`chat_bg_color_${conversation.id}`, color);
    } else {
      localStorage.removeItem(`chat_bg_color_${conversation.id}`);
    }
    setBgColor(color);
    setHexInput(color);
  };

  // Auto scroll logic
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    // Scroll instantly on initial switch, smoothly on new messages
    scrollToBottom(messages.length <= 15 ? 'auto' : 'smooth');
  }, [messages.length, conversation?.id]);

  if (!conversation || !conversation.partner) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-950">
        <div className="rounded-full bg-blue-50 p-5 dark:bg-blue-950/40 animate-pulse">
          <MessageSquare className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">Chào mừng bạn trở lại!</h3>
        <p className="mt-1 max-w-xs text-xs text-slate-400 dark:text-slate-500">
          Chọn một người dùng hoặc hội thoại từ bên trái để khám phá và bắt đầu nhắn tin realtime cực nhanh.
        </p>
      </div>
    );
  }

  const partner = conversation.partner;

  // Let's find the last message sent by current user that partner has read (read_at is populated)
  // We check message_reads for partner.id.
  const getLastSelfMessageReadByPartnerIdx = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender_id === currentProfile.id && !msg.deleted) {
        const wasRead = msg.reads?.some((r) => r.user_id === partner.id);
        if (wasRead) return i;
      }
    }
    return -1;
  };

  const lastReadIdx = getLastSelfMessageReadByPartnerIdx();

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 h-full overflow-hidden">
      {/* Active Conversation User Header Banner */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center gap-3">
          {/* Avatar frame */}
          <div className="relative">
            {partner.avatar_url ? (
              <img
                src={partner.avatar_url}
                alt={partner.full_name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover bg-slate-100"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                {partner.full_name.substring(0, 2).toUpperCase()}
              </div>
            )}
            {partner.is_online ? (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />
            ) : (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white dark:border-slate-900" />
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {partner.full_name}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              {partner.is_online ? (
                <span className="text-green-500">Đang trực tuyến</span>
              ) : partner.last_seen ? (
                `Hoạt động lần cuối: ${new Date(partner.last_seen).toLocaleDateString()} lúc ${new Date(partner.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              ) : (
                'Ngoại tuyến'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Deactivated account notice */}
          {!partner.is_active && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-50 text-red-650 px-3 py-1 border border-red-100 text-[10px] font-bold dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Tài khoản đã bị vô hiệu hóa</span>
            </div>
          )}

          {/* Background customizer dropdown/popover */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Đổi màu nền cuộc trò chuyện"
            >
              <Palette className="h-3.5 w-3.5 text-blue-500" />
              <span className="hidden sm:inline">Màu nền</span>
            </button>

            {showPicker && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowPicker(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white p-4 shadow-xl dark:bg-slate-900 z-40 animate-slide-up">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 dark:border-slate-800">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Paintbrush className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Màu nền cuộc trò chuyện
                    </h5>
                    <button
                      onClick={() => handleBgColorChange('')}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                      title="Khôi phục mặc định"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Preset circles */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = bgColor === preset.value;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => handleBgColorChange(preset.value)}
                          className={`h-9 w-9 rounded-full border border-slate-200/60 dark:border-slate-700/65 flex items-center justify-center relative cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none ${
                            isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                          }`}
                          style={{
                            backgroundColor: preset.value || undefined,
                            background: !preset.value ? 'linear-gradient(135deg, #f1f5f9 50%, #020617 50%)' : undefined,
                          }}
                          title={preset.name}
                        >
                          {isSelected && (
                            <Check className={`h-4.5 w-4.5 font-bold ${preset.value === '' || preset.value === '#e0f2fe' || preset.value === '#dcfce7' || preset.value === '#ffe4e6' || preset.value === '#ffedd5' || preset.value === '#f3e8ff' || preset.value === '#fef08a' || preset.value === '#f1f5f9' ? 'text-slate-800' : 'text-white'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom HEX code input and type color native indicator */}
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Nhập mã màu (Hex) hoặc tự chọn
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-bold">#</span>
                        <input
                          type="text"
                          value={hexInput.replace('#', '')}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setHexInput('#' + val);
                            if (/^[0-9A-Fa-f]{3,6}$/.test(val)) {
                              handleBgColorChange(val.startsWith('#') ? val : '#' + val);
                            }
                          }}
                          placeholder="e.g. 3b82f6"
                          maxLength={7}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-3 py-1.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      
                      {/* Native color picker */}
                      <div className="relative h-8 w-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer">
                        <input
                          type="color"
                          value={bgColor && /^#[0-9A-Fa-f]{6}$/.test(bgColor) ? bgColor : '#3b82f6'}
                          onChange={(e) => {
                            handleBgColorChange(e.target.value);
                          }}
                          className="absolute inset-0 h-full w-full opacity-100 cursor-pointer border-none p-0 bg-transparent w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%]"
                          title="Chọn màu tự do"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Listing Area */}
      <div 
        ref={scrollContainerRef}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={`flex-1 overflow-y-auto px-4 py-6 scroll-smooth transition-colors duration-300 ${!bgColor ? 'bg-slate-50 dark:bg-slate-950' : ''}`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
            {partner.avatar_url ? (
              <img
                src={partner.avatar_url}
                alt={partner.full_name}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-full object-cover opacity-60 mb-3"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-100 mb-3 flex items-center justify-center text-slate-400 font-bold text-xl dark:bg-slate-800">
                {partner.full_name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">Vẫy tay chào {partner.full_name}!</h5>
            <p className="max-w-[200px] mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Họ đang trực tuyến, hãy là người đầu tiên khơi nguồn tin nhắn realtime tuyệt vời này!
            </p>
          </div>
        ) : (
          messages.map((message, i) => {
            const isLastRead = i === lastReadIdx;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                currentProfile={currentProfile}
                partnerProfile={partner}
                onReact={onReact}
                onDelete={onDelete}
                isLastReadByPartner={isLastRead}
              />
            );
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Active message composer input sheet */}
      <MessageInput
        onSendText={onSendText}
        onSendSticker={onSendSticker}
        onSendImage={onSendImage}
        isUploading={isUploading}
      />
    </div>
  );
};
