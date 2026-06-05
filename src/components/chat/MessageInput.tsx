/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sticker, StickerPicker } from './StickerPicker';
import { Smile, Image, Send, X, Loader2, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendSticker: (sticker: Sticker) => void;
  onSendImage: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendSticker,
  onSendImage,
  isUploading,
}) => {
  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close sticker picker on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowStickers(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSend = () => {
    if (selectedFile) {
      onSendImage(selectedFile).then(() => {
        clearFile();
      });
      return;
    }

    if (!text.trim()) return;
    onSendText(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 transition-all ${
        dragOver ? 'bg-blue-50/50 dark:bg-slate-800/80 ring-2 ring-dashed ring-blue-400 m-2 rounded-2xl border-none' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual HUD overlay */}
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 pointer-events-none rounded-2xl">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Thả ảnh tại đây để gửi cực nhanh!</p>
        </div>
      )}

      {/* Image Upload Preview Panel */}
      {filePreview && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-950/40 w-fit max-w-full">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
            <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
            <button
              onClick={clearFile}
              className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-slate-900 active:scale-90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
              {selectedFile?.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Sticker Picker Popover Overlay */}
      {showStickers && (
        <div className="absolute bottom-full mb-3 left-4 z-40">
          <StickerPicker
            onSelect={(sticker) => {
              onSendSticker(sticker);
              setShowStickers(false);
            }}
            onClose={() => setShowStickers(false)}
          />
        </div>
      )}

      {/* Controls Container */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {/* Sticker Clicker */}
          <button
            onClick={() => setShowStickers(!showStickers)}
            className={`rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 active:scale-95 ${
              showStickers ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30' : ''
            }`}
            title="Nhãn dán"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Attachment / File Image Clicker */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 active:scale-95"
            title="Gửi hình ảnh"
          >
            <Image className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Text Input Panel */}
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isUploading}
            placeholder={
              selectedFile 
                ? 'Nhấn gởi hoặc Enter để tải ảnh...' 
                : 'Nhập tin nhắn... (Thả ảnh trực tiếp để gởi nhanh)'
            }
            className="w-full rounded-full border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900"
          />
          {isUploading && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Send Trigger Action */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || isUploading}
          className="rounded-full bg-blue-600 p-2.5 text-white transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
