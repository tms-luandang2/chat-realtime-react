/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export interface Sticker {
  id: string;
  name: string;
  url: string;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: Sticker[];
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'quby',
    name: 'Cậu bé ba bánh (Quby)',
    icon: 'https://media2.giphy.com/media/KzTvF6Fshshf0bYpQe/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s',
    stickers: [
      { id: 'quby-shy', name: 'Thẹn thùng', url: 'https://media2.giphy.com/media/KzTvF6Fshshf0bYpQe/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-dance', name: 'Quẩy cực sung', url: 'https://media1.giphy.com/media/L4TvG6zfx90WunAtE1/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-cry', name: 'Khóc ròng', url: 'https://media3.giphy.com/media/Y8SCSm92O4bXJEuC0U/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-heart', name: 'Thả ngàn tim', url: 'https://media3.giphy.com/media/mBeBPS1p3Y0sCshC63/giphy.gif?cid=ecf05e47kdrd3yuxl432a2vqqx72e1s2f2t710b7b1b3b3b2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-rage', name: 'Đập đầu ăn vạ', url: 'https://media3.giphy.com/media/QxSNeG3v6W0Wb9V2x4/giphy.gif?cid=ecf05e47kdrd3yuxl432a2vqqx72e1s2f2t710b7b1b3b3b2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-yay', name: 'Nhảy ăn mừng', url: 'https://media4.giphy.com/media/QfTZon5N8UfW3Hpq6r/giphy.gif?cid=ecf05e47kdrd3yuxl432a2vqqx72e1s2f2t710b7b1b3b3b2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-feeding', name: 'Bón đồ ăn', url: 'https://media2.giphy.com/media/VJh8v99g40rO3FMyC7/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'quby-sleepy', name: 'Ngủ tít mắt', url: 'https://media4.giphy.com/media/gA8p9s82H3gL7W35XG/giphy.gif?cid=ecf05e47w4j6icf0twtmsc7l6p260pzhqfnt8e3rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' }
    ]
  },
  {
    id: 'pusheen',
    name: 'Mèo béo Pusheen',
    icon: 'https://media4.giphy.com/media/nifb1U6TWeHhDkdT6F/giphy.gif?cid=ecf05e478id2ndz571ndf1n6d8d67fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s',
    stickers: [
      { id: 'pusheen-eat', name: 'Ăn kem', url: 'https://media4.giphy.com/media/nifb1U6TWeHhDkdT6F/giphy.gif?cid=ecf05e478id2ndz571ndf1n6d8d67fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-love', name: 'Ôm tim yêu', url: 'https://media2.giphy.com/media/134ve0clH0mre0/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-pizza', name: 'Gặm pizza', url: 'https://media1.giphy.com/media/3o72EX5QZ9N9d51dqo/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-cry', name: 'Khóc lụt nhà', url: 'https://media1.giphy.com/media/l46Cgctdy5C2yvMcU/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-hfive', name: 'High-five!', url: 'https://media1.giphy.com/media/13ZgXW66O6Z0qI/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-fly', name: 'Bay bong bóng', url: 'https://media2.giphy.com/media/m3864rBwwY75K/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-cool', name: 'Kính ngầu đét', url: 'https://media2.giphy.com/media/3o6gaUP9pZfSIsL1hC/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' },
      { id: 'pusheen-work', name: 'Code ngày đêm', url: 'https://media0.giphy.com/media/3o7qDQ4kc9rtL897dm/giphy.gif?cid=ecf05e47unidm71ntdf1n6d8d65fnt8e2rby93k0x2&ep=v1_stickers_search&rid=giphy.gif&ct=s' }
    ]
  },
  {
    id: 'memes',
    name: 'Siêu Meme Tiktok',
    icon: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzRiaGlkMzRhdTRnb2N5MzVnczQ2d2t5dHl6YzNpZzFidTZpMzRwNiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/HCTfY92mXJjLO2cGpX/giphy.gif',
    stickers: [
      { id: 'pepe-punch', name: 'Múc luôn', url: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2FkcXNuNWhqamJldzNpMDR2cGZxbjFhZHFzOGtzNDdpeThsdnUxbSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/XBS7cpJaQzfQA/giphy.gif' },
      { id: 'doge-derp', name: 'Doge cười ngơ', url: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzRiaGlkMzRhdTRnb2N5MzVnczQ2d2t5dHl6YzNpZzFidTZpMzRwNiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/HCTfY92mXJjLO2cGpX/giphy.gif' },
      { id: 'cat-dzoi', name: 'Nằm dài dỗi', url: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bmd2a3E4dmcycHQ2MmExbWF6dm0yeGl3ZnA3M2ZydnJtdTZzcSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/v8qFALf6VKacYcj78K/giphy.gif' },
      { id: 'pepe-like', name: 'Tuyệt vời', url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4OTVqYXk3bGlidWlra3FjdDNqZ3ZleHJpcTdsdTQxajh0YWsxbyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/U8iiD9GBdt5v0Lal82/giphy.gif' },
      { id: 'pepe-cry', name: 'Khóc tu tu', url: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJyaHBmaXhvdTdwNmd0enNwdXU3azBvNjRxOHBwYThnbzhveW96aCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/33OrjzUFwkwEg/giphy.gif' },
      { id: 'pepe-shake', name: 'Ngoáy dẻo', url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHgydm02aXo4a29uNzI2bHptbzNqdHplNjExdzV0ZXk4ODg0YmsxbCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/5K4fX9fA9Xatv2m47p/giphy.gif' },
      { id: 'dance-cute', name: 'Quẩy điệu đà', url: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTk4bnpxcmoxMm04ZWUwcTJtbm9tZTllMGk0cW1maWV5Yjhob2J5YSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xUA7aQaXmHNis6vXfW/giphy.gif' },
      { id: 'bongo-cat', name: 'Barty cats', url: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWNnYzl3eTY4MzhocTVmYTFwbTcwNzBiaDJscGFxeHBrODZ3NzFubSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/SsrEbyMAluV11GZl45/giphy.gif' }
    ]
  }
];

// Flat export of all stickers for fallback/compatibility and indexing
export const STICKERS: Sticker[] = STICKER_PACKS.flatMap(p => p.stickers);

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  onClose?: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
  const [activePackId, setActivePackId] = useState<string>('quby');

  const activePack = STICKER_PACKS.find(pack => pack.id === activePackId) || STICKER_PACKS[0];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 w-80 max-h-[380px] overflow-hidden animate-slide-up">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Cửa hàng nhãn dán
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid Sticker lists for selected tab */}
      <div className="flex-1 overflow-y-auto px-4 py-3 grid grid-cols-4 gap-3 max-h-[240px]">
        {activePack.stickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            className="flex flex-col items-center justify-center rounded-xl p-1.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 group relative border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-md transition-transform duration-200 group-hover:scale-110">
              <img
                src={sticker.url}
                alt={sticker.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="mt-1 text-[9px] font-medium text-slate-400 dark:text-slate-500 truncate w-full text-center">
              {sticker.name}
            </span>
          </button>
        ))}
      </div>

      {/* Sticker Pacs Menu Tab strip (At the bottom exactly like Messenger, Zalo) */}
      <div className="flex items-center gap-1.5 border-t border-slate-150 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/90 overflow-x-auto shrink-0">
        {STICKER_PACKS.map((pack) => {
          const isActive = activePackId === pack.id;
          return (
            <button
              key={pack.id}
              onClick={() => setActivePackId(pack.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 hover:scale-[1.03] active:scale-[0.97] border ${
                isActive 
                  ? 'bg-white border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold' 
                  : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 font-medium'
              }`}
              title={pack.name}
            >
              <img
                src={pack.icon}
                alt={pack.name}
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-md object-contain"
              />
              <span className="text-[10px] hidden sm:inline whitespace-nowrap">{pack.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
