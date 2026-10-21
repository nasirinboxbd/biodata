import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GalleryImage } from '../../types/biodata';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Image as ImageIcon,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'bn';
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  lang = 'en',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync index when initialIndex changes or opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll while lightbox is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const currentImage = images[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3.5, Number((prev + 0.35).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(0.6, Number((prev - 0.35).toFixed(2)));
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleToggleZoom = () => {
    if (zoom > 1.1) {
      handleResetZoom();
    } else {
      setZoom(2.2);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Mouse wheel zoom inside container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan & drag for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage.url;
    a.download = `Nasir_Biodata_Photo_${currentIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !currentImage) return null;

  const caption = lang === 'bn' && currentImage.captionBn ? currentImage.captionBn : currentImage.caption;
  const secondaryCaption =
    lang === 'bn' ? currentImage.caption : currentImage.captionBn;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] flex flex-col justify-between bg-black/95 backdrop-blur-2xl text-white select-none overflow-hidden animate-fadeIn"
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ══ TOP TOOLBAR ══ */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent border-b border-white/10 backdrop-blur-md">
        {/* Left: Info & Counter */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <ImageIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-white font-serif">
                {lang === 'bn' ? 'ছবির অ্যালবাম' : "Nasir's Gallery"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-amber-300 border border-amber-400/20">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            {currentImage.isFeatured && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                <Sparkles size={10} /> Featured Portrait
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 disabled:opacity-30 transition cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom Level Indicator */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 transition cursor-pointer"
            title="Reset Zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 disabled:opacity-30 transition cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </button>

          {/* Reset Zoom */}
          {zoom !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-amber-400 hover:bg-white/15 transition cursor-pointer"
              title="Reset Zoom (1:1)"
            >
              <RotateCcw size={16} />
            </button>
          )}

          <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer hidden sm:flex items-center justify-center"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Download Original */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Download Full Resolution"
          >
            <Download size={16} />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 sm:ml-2 p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ══ MAIN INTERACTIVE STAGE ══ */}
      <main
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-20 p-3 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 hover:border-amber-400/50 backdrop-blur-xl shadow-2xl transition hover:scale-110 active:scale-95 cursor-pointer"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Central Zoomed Image Display */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onDoubleClick={handleToggleZoom}
        >
          <img
            ref={imageRef}
            src={currentImage.url}
            alt={caption || 'Biodata Photo'}
            className="max-h-[72vh] sm:max-h-[76vh] w-auto max-w-[94vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/15 ring-1 ring-white/10 pointer-events-auto"
            draggable={false}
          />

          {/* Quick Double-click Tip Overlay when zoom is 1 */}
          {zoom === 1 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/50 opacity-0 hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
              Double-click to zoom
            </div>
          )}
        </div>

        {/* Navigation Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-20 p-3 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 hover:border-amber-400/50 backdrop-blur-xl shadow-2xl transition hover:scale-110 active:scale-95 cursor-pointer"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </main>

      {/* ══ BOTTOM CONTROLS, CAPTIONS & THUMBNAILS ══ */}
      <footer className="relative z-30 flex flex-col items-center bg-gradient-to-t from-black/95 via-black/80 to-transparent border-t border-white/10 backdrop-blur-md px-4 py-3 gap-2.5">
        {/* Caption & Metadata Pill */}
        {(caption || currentImage.dateAdded) && (
          <div className="max-w-xl text-center px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
            {caption && (
              <p className="text-sm font-serif font-semibold text-white tracking-wide">
                {caption}
              </p>
            )}
            {secondaryCaption && secondaryCaption !== caption && (
              <p className="text-xs text-white/60 font-serif italic mt-0.5">
                {secondaryCaption}
              </p>
            )}
            {currentImage.dateAdded && (
              <span className="text-[10px] text-amber-300/70 inline-flex items-center gap-1 mt-0.5">
                <Calendar size={10} /> Added: {currentImage.dateAdded}
              </span>
            )}
          </div>
        )}

        {/* Thumbnail Filmstrip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`relative shrink-0 w-12 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md shadow-amber-500/20 opacity-100'
                    : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                }`}
                title={img.caption || `Photo ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>,
    document.body
  );
};
