"use client";

import { useEffect, useRef, useState } from "react";
import { isLowEnd, motionAllowed } from "@/lib/motion";

// Film grain: a few pre-baked noise tiles stepped at about 8fps.
export default function Grain() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!motionAllowed() || isLowEnd() || coarse) return;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const el = ref.current!;
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const tiles: string[] = [];
    for (let f = 0; f < 5; f++) {
      const img = ctx.createImageData(size, size);
      const d = new Uint32Array(img.data.buffer);
      for (let i = 0; i < d.length; i++) {
        const v = (Math.random() * 255) | 0;
        d[i] = (255 << 24) | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(img, 0, 0);
      tiles.push(`url(${canvas.toDataURL("image/png")})`);
    }
    let i = 0;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 125) return;
      last = t;
      el.style.backgroundImage = tiles[i++ % tiles.length];
      el.style.backgroundPosition = `${(Math.random() * size) | 0}px ${(Math.random() * size) | 0}px`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ opacity: 0.055, mixBlendMode: "screen", backgroundSize: "160px 160px" }}
    />
  );
}
