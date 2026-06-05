/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Thích' },
  { emoji: '❤️', label: 'Yêu thích' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Ngạc nhiên' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '😡', label: 'Phẫn nộ' }
];

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  activeEmoji?: string | null;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ onReact, activeEmoji }) => {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
      {REACTION_EMOJIS.map(({ emoji, label }) => {
        const isActive = activeEmoji === emoji;
        return (
          <button
            key={emoji}
            title={label}
            onClick={() => onReact(emoji)}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125 active:scale-90 ${
              isActive ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-400' : ''
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};
