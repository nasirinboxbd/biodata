import React, { useState } from 'react';
import { GalleryImage } from '../../types/biodata';
import { SectionCard } from './SectionCard';
import { Image as ImageIcon, Maximize2, Sparkles, ZoomIn } from 'lucide-react';
import { GalleryLightbox } from './GalleryLightbox';

interface GallerySectionProps {
  gallery: GalleryImage[];
  lang?: 'en' | 'bn';
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery, lang = 'en' }) => {
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const visibleImages = gallery.filter((img) => img.visible !== false);
  if (visibleImages.length === 0) return null;

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <SectionCard
        accent="rose"
        pcol="232,84,122"
        icon={<ImageIcon size={20} />}
        title={lang === 'bn' ? 'ছবির অ্যালবাম' : 'Photo Gallery'}
        titleGradientClass="grad-text"
        id="gallery"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {visibleImages.map((img, idx) => {
            const caption = lang === 'bn' && img.captionBn ? img.captionBn : img.caption;

            return (
              <div
                key={img.id}
                onClick={() => handleOpenLightbox(idx)}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-500/10"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenLightbox(idx);
                  }
                }}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-white/5 relative">
                  <img
                    src={img.url}
                    alt={caption || 'Biodata Photo'}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-60 group-hover:opacity-85 transition-opacity" />

                  {/* Hover Zoom & Fullscreen overlay prompt */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <div className="p-1.5 rounded-full bg-black/60 text-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105 border border-white/15">
                      <ZoomIn size={14} className="text-amber-300" />
                    </div>
                  </div>

                  {img.isFeatured && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-black shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> Featured
                    </span>
                  )}

                  {/* Centered click overlay indicator on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span className="px-3 py-1.5 rounded-full bg-black/70 border border-white/20 text-white text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-xl">
                      <Maximize2 size={13} className="text-amber-400" />
                      <span>{lang === 'bn' ? 'পূর্ণ পর্দায় দেখুন' : 'View Full Screen'}</span>
                    </span>
                  </div>
                </div>

                {caption && (
                  <div className="p-3 bg-white/[0.02]">
                    <p className="text-xs font-medium text-[var(--text)] line-clamp-2 leading-relaxed">
                      {caption}
                    </p>
                    {img.dateAdded && (
                      <span className="text-[10px] text-[var(--soft)] mt-1 block">
                        {img.dateAdded}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Full-screen Zoomed-in Lightbox Modal */}
      <GalleryLightbox
        images={visibleImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        lang={lang}
      />
    </>
  );
};
