"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  images?: string[];
  intervalMs?: number;
  className?: string;
};

export default function ImageCarousel({
  images,
  intervalMs = 7000,
  className = "",
}: Props) {
  const slides = useMemo(
    () => images ?? ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg", "/6.jpg", "/7.jpg"],
    [images]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, Math.max(1200, intervalMs));
    return () => clearInterval(id);
  }, [slides, intervalMs]);

  if (!slides.length) return null;

  return (
    <div className={`relative w-full h-64 md:h-96 bg-white border-[4px] border-black ${className}`}>
      <div className="relative w-full h-full bg-white border-[6px] border-[#A31F34]">
        <div className="relative w-full h-full overflow-hidden border-[4px] border-black">
          <AnimatePresence>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ x: { duration: 1.4, ease: "easeInOut" }, opacity: { duration: 1.4, ease: "easeInOut" } }}
              style={{ willChange: "transform, opacity" }}
            >
              {/* Ken Burns subtle zoom for eye-catching motion */}
              <motion.div
                key={`img-${index}`}
                className="absolute inset-0"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: Math.max(1.0, intervalMs / 1000), ease: "easeInOut" }}
              >
                <Image
                  src={slides[index]}
                  alt="Slideshow image"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </motion.div>
              {/* Soft top fade to keep UI crisp over images */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === index ? "bg-black/80 w-6" : "bg-black/40 hover:bg-black/60"
                }`}
                onClick={() => setIndex(i)}
              />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
