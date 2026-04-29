"use client";

import { useEffect, useState } from "react";

const HERO_VIDEOS = [
  "/samples/veo3.mp4",
  "/samples/hero_city.mp4",
  "/samples/hero_storm.mp4",
  "/samples/hero_musician.mp4",
  "/samples/kling3_castle.mp4",
  "/samples/kling3_cyberpunk.mp4",
];

export function HeroVideo() {
  const [src, setSrc] = useState(HERO_VIDEOS[0]);

  useEffect(() => {
    setSrc(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
    </div>
  );
}
