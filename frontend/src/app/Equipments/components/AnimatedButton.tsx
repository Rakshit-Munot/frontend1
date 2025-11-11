"use client"

import React from "react"

interface AnimatedButtonProps {
  spriteUrl: string
  steps: number
  label: string
  onClick: () => void
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  spriteUrl,
  steps,
  label,
  onClick,
}) => {
  return (
    <div className="relative w-[100px] h-[50px] overflow-hidden border rounded-md mx-1">
      <button
        onClick={onClick}
        className="w-full h-full font-bold text-white text-[11px]"
        style={{
          backgroundColor: "#000",
          WebkitMaskImage: `url(${spriteUrl})`,
          maskImage: `url(${spriteUrl})`,
          WebkitMaskSize: `${steps * 100}% 100%`,
          maskSize: `${steps * 100}% 100%`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "0 0",
          maskPosition: "0 0",
        }}
      >
        <span className="absolute w-full text-center top-[17px]">{label}</span>
      </button>
    </div>
  )
}
