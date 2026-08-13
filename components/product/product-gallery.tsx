"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

const fallbackProductImage = "/uploads/products/abschlussarbeiten.webp";

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [mainImage, setMainImage] = useState(0);
  const galleryImages = Array.from(new Set(images.filter(Boolean)));
  if (!galleryImages.length) galleryImages.push(fallbackProductImage);
  const isRuntimeUpload = (image: string) => image.startsWith("/uploads/");

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  useEffect(() => {
    if (selectedImage === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
      if (event.key === "ArrowRight") {
        setSelectedImage((prev) => (prev === null ? prev : (prev + 1) % galleryImages.length));
      }
      if (event.key === "ArrowLeft") {
        setSelectedImage((prev) =>
          prev === null ? prev : (prev - 1 + galleryImages.length) % galleryImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryImages.length, selectedImage]);

  return (
    <div className="grid gap-4">
      <motion.div
        layoutId="main-image-stage"
        onClick={() => openLightbox(mainImage)}
        className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={galleryImages[mainImage]}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={galleryImages[mainImage]}
              alt={`${name} - Ansicht ${mainImage + 1}`}
              fill
              unoptimized={isRuntimeUpload(galleryImages[mainImage])}
              className="object-contain p-4 transition-transform duration-700 group-hover:scale-[1.025]"
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur">
          <ZoomIn className="h-3.5 w-3.5" />
          Zoom
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
          {mainImage + 1} / {galleryImages.length}
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3 overflow-x-auto pb-1 sm:grid-cols-5 lg:grid-cols-6">
        {galleryImages.map((image, index) => (
          <motion.button
            key={image + index}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMainImage(index)}
            className={`relative aspect-square min-w-16 overflow-hidden rounded-lg border transition-all ${
              mainImage === index
                ? "border-brand-primary shadow-[0_8px_26px_-14px_rgba(59,130,246,0.9)]"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Image
              src={image}
              alt={`${name} Thumbnail ${index + 1}`}
              fill
              unoptimized={isRuntimeUpload(image)}
              className={`object-cover transition ${mainImage === index ? "scale-105" : ""}`}
              sizes="140px"
            />
            {mainImage === index && (
              <motion.div
                layoutId="active-thumb-ring"
                className="absolute inset-0 rounded-lg ring-2 ring-brand-primary/80 ring-inset"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/35 p-2 text-white transition-colors hover:text-brand-primary md:right-6 md:top-6"
            >
              <X size={24} />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white transition-colors hover:text-brand-primary md:left-6"
            >
              <ChevronLeft size={28} />
            </button>

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/3] w-full max-w-6xl overflow-hidden rounded-xl border border-white/15 bg-black/20"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                    key={galleryImages[selectedImage]}
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.2 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={galleryImages[selectedImage]}
                    alt={`${name} Fullscreen`}
                    fill
                    unoptimized={isRuntimeUpload(galleryImages[selectedImage])}
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white transition-colors hover:text-brand-primary md:right-6"
            >
              <ChevronRight size={28} />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-sm font-medium text-white">
              {selectedImage + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
