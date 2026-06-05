/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Message, UserProfile, MessageReaction } from '../../types';
import { ReactionBar } from './ReactionBar';
import { Eye, Trash2, Smile } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  currentProfile: UserProfile;
  partnerProfile: UserProfile | null;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  isLastReadByPartner: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentProfile,
  partnerProfile,
  onReact,
  onDelete,
  isLastReadByPartner,
}) => {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isSelf = message.sender_id === currentProfile.id;

  // Aggregate reactions
  const reactionGroups: { [emoji: string]: string[] } = {};
  message.reactions?.forEach((r) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = [];
    }
    reactionGroups[r.emoji].push(r.user_id);
  });

  const parsedReactions = Object.entries(reactionGroups).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    hasReacted: userIds.includes(currentProfile.id),
  }));

  const activeUserReaction = message.reactions?.find((r) => r.user_id === currentProfile.id)?.emoji || null;

  // Format time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`group flex flex-col mb-4 ${isSelf ? 'items-end' : 'items-start'} relative px-2`}>
      {/* Sender name for companion messages */}
      {!isSelf && partnerProfile && (
        <span className="ml-12 mb-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {partnerProfile.full_name}
        </span>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] relative ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isSelf && partnerProfile ? (
          <img
            src={partnerProfile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(partnerProfile.full_name)}`}
            alt={partnerProfile.full_name}
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full bg-slate-100 object-cover"
          />
        ) : !isSelf ? (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40" />
        ) : null}

        {/* Bubble Inner Container */}
        <div className="relative">
          {/* Reaction trigger hover overlay */}
          <div className={`absolute top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex items-center gap-1.5 ${
            isSelf ? '-left-24' : '-right-24'
          }`}>
            <button
              onClick={() => setShowReactionBar(!showReactionBar)}
              className="rounded-full bg-white p-1.5 text-slate-400 border border-slate-100 shadow-md hover:text-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-blue-400"
              title="Thả cảm xúc"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {isSelf && !message.deleted && (
              <button
                onClick={() => onDelete(message.id)}
                className="rounded-full bg-white p-1.5 text-slate-400 border border-slate-100 shadow-md hover:text-red-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-red-400"
                title="Gỡ tin nhắn"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Reaction Bar Popover */}
          {showReactionBar && (
            <div className={`absolute bottom-full mb-2 z-20 ${isSelf ? 'right-0' : 'left-0'}`}>
              <ReactionBar
                activeEmoji={activeUserReaction}
                onReact={(emoji) => {
                  onReact(message.id, emoji);
                  setShowReactionBar(false);
                }}
              />
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowReactionBar(false)}
              />
            </div>
          )}

          {/* Message Content */}
          <div
            className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
              message.deleted
                ? 'bg-slate-100/70 border border-slate-200/50 text-slate-400 italic dark:bg-slate-800/40 dark:border-slate-700/50 dark:text-slate-500'
                : isSelf
                  ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-100 text-slate-850 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-tl-sm'
            }`}
          >
            {message.deleted ? (
              <span>Tin nhắn đã bị thu hồi</span>
            ) : message.type === 'text' ? (
              <span className="whitespace-pre-wrap break-all leading-relaxed">{message.content}</span>
            ) : message.type === 'image' ? (
              <div 
                className="mt-1 cursor-zoom-in overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700 max-w-sm"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img
                  src={message.content}
                  alt="Ảnh trong hội thoại"
                  referrerPolicy="no-referrer"
                  className="max-h-56 w-auto max-w-full object-cover transition-transform hover:scale-[1.02]"
                />
              </div>
            ) : message.type === 'sticker' ? (
              <div className="h-28 w-28 p-1">
                <img
                  src={message.content}
                  alt="Nhãn dán"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain animate-wiggle"
                />
              </div>
            ) : (
              <span className="break-all">{message.content}</span>
            )}

            {/* Reaction badge display integrated directly on the bottom edge */}
            {parsedReactions.length > 0 && !message.deleted && (
              <div className={`absolute bottom-[-10px] flex items-center gap-1 rounded-full border border-slate-100 bg-white px-2 py-0.5 text-xs shadow-md dark:border-slate-800 dark:bg-slate-900 ${
                isSelf ? 'right-2' : 'left-2'
              }`}>
                {parsedReactions.slice(0, 3).map((group) => (
                  <button
                    key={group.emoji}
                    onClick={() => onReact(message.id, group.emoji)}
                    className={`flex items-center gap-0.5 hover:scale-110 active:scale-95 transition-all ${
                      group.hasReacted ? 'font-bold text-blue-500' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span>{group.emoji}</span>
                    <span className="text-[10px]">{group.count > 1 ? group.count : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono select-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap self-center px-1">
          {formatTime(message.created_at)}
        </span>
      </div>

      {/* Seen / Read indicators */}
      {isLastReadByPartner && partnerProfile && (
        <div className="flex items-center gap-1 mt-1.5 mr-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <Eye className="h-3 w-3 text-emerald-500" />
          <span>{partnerProfile.full_name} đã xem</span>
          <img
            src={partnerProfile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(partnerProfile.full_name)}`}
            alt={partnerProfile.full_name}
            referrerPolicy="no-referrer"
            className="h-3.5 w-3.5 rounded-full ml-1 border border-white"
          />
        </div>
      )}

      {/* Lightbox / Image Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-slate-800/70 p-2 text-white hover:bg-slate-700/80 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={message.content}
            alt="Phóng to ảnh"
            referrerPolicy="no-referrer"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
