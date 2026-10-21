import React, { useState } from 'react';
import { Smile, Search, X } from 'lucide-react';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
}

interface EmojiCategory {
  name: string;
  id: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Marriage & Love',
    id: 'marriage',
    emojis: [
      '💍', '💒', '👰', '🤵', '💑', '💏', '💖', '💕', '💗', '💓', '🌹', '🌷', '💐', '🤲', '🕌', '✨', '💫', '🫀', '🎀', '💌', '🎊', '🎉', '🍰'
    ],
  },
  {
    name: 'Islamic & Heritage',
    id: 'islamic',
    emojis: [
      '☪️', '🕌', '🤲', '🕋', '📖', '🕊️', '🇧🇩', '🌙', '⭐', '📿', '🌿', '✨'
    ],
  },
  {
    name: 'Identity & Work',
    id: 'identity',
    emojis: [
      '👤', '👨‍👩‍👧‍👦', '💼', '🎓', '🏛️', '🧑‍🏫', '💻', '📐', '🏢', '🩺', '👨‍💻', '👳‍♂️', '🧕', '🧑‍🎓', '🛠️'
    ],
  },
  {
    name: 'Lifestyle & Hobbies',
    id: 'lifestyle',
    emojis: [
      '📚', '⭐', '🚗', '✈️', '🩸', '📅', '⏳', '🎂', '📍', '🏡', '📏', '☕', '🎮', '⚽', '🎨', '📸', '🎵', '🌿'
    ],
  },
  {
    name: 'Qualities & Symbols',
    id: 'symbols',
    emojis: [
      '💪', '⚖️', '🔧', '🌿', '💎', '✦', '🌟', '🛡️', '🎯', '🚀', '💡', '🧩', '👑', '🔑', '🌈', '🔥'
    ],
  },
];

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  title = 'Select an Emoji',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('marriage');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const currentCategoryObj = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
  const displayEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : currentCategoryObj?.emojis || [];

  return (
    <div className="admin-modal fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn cursor-default">
      <div className="w-full max-w-sm rounded-2xl bg-[#140b27] border border-amber-500/30 p-5 shadow-2xl text-[#f0ead8] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Smile size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs */}
        {!search && (
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/40'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Emojis Grid */}
        <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-black/40 border border-white/10 max-h-56 overflow-y-auto custom-scrollbar">
          {displayEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}_${idx}`}
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              className="text-2xl p-2 rounded-xl hover:bg-white/15 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[11px] text-white/40">Click an emoji to instantly insert into your biodata.</p>
        </div>
      </div>
    </div>
  );
};
