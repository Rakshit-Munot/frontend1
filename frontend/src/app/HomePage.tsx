"use client";
import ImageCarousel from "./components/ImageCarousel";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Force white background regardless of theme variables */}
      <div className="fixed inset-0 -z-10 bg-white" />
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <ImageCarousel className="!h-[70vh]" />
      </div>
    </div>
  );
}