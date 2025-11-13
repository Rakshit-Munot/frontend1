'use client'

import HandoutManagerPage from "./components/HandoutManagerPage";

export default function Handouts() {
  return (
    <div className="min-h-screen bg-white">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-black">HANDOUTS</h1>
      <HandoutManagerPage />
    </div>
  </div>
  );
}