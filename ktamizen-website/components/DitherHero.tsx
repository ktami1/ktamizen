"use client";

import { useEffect, useRef } from "react";
import { isFinePointer, isLowEnd, motionAllowed } from "@/lib/motion";

// 8x8 Bayer matrix, normalized to 0..1
const BAYER = (() => {
  const m = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30,
    54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
    61, 29, 53, 21,
  ];
  return Float32Array.from(m, (v) => (v + 0.5) / 64);
})();

const RED = (255 << 24) | (0 << 16) | (0 << 8) | 211; // ABGR for #D30000
const BLACK = 255 << 24;

type Props = {
  // 0..1 from the pinned scroll, read every frame
  progress: { current: number };
};

// A slow red ember drawn as an ordered dither at very low resolution and
// scaled up with crisp pixels. Coarse at the top of the hero, fine at the end.
export default function DitherHero({ progress }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const animated = motionAllowed() && !isLowEnd();
    const fine = isFinePointer();
    const minCell = fine ? 4 : 3;
    const maxCell = fine ? 26 : 18;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let cell = 0;
    let img: ImageData | null = null;
    let buf: Uint32Array | null = null;

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const measure = () => {
      const r = canvas.parentElement!.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cell = 0;
    };

    const setCell = (c: number) => {
      if (c === cell) return;
      cell = c;
      cols = Math.ceil(w / cell);
      rows = Math.ceil(h / cell);
      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${cols * cell}px`;
      canvas.style.height = `${rows * cell}px`;
      img = ctx.createImageData(cols, rows);
      buf = new Uint32Array(img.data.buffer);
    };

    const draw = (t: number) => {
      const p = Math.min(1, Math.max(0, progress.current));
      // Ease the focus so most of the sharpening happens early in the scroll.
      const e = 1 - Math.pow(1 - p, 2.2);
      setCell(Math.max(minCell, Math.round(maxCell + (minCell - maxCell) * e)));
      if (!buf || !img) return;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const aspect = w / h;
      const s = t * 0.00022;
      const cx = 0.5 + Math.sin(s * 0.9) * 0.05 + mouse.x * 0.035;
      const cy = (aspect > 1 ? 0.6 : 0.6) + Math.cos(s * 0.7) * 0.035 + mouse.y * 0.025 - e * 0.04;
      const r0 = (aspect > 1 ? 0.3 : 0.19) * (1 + Math.sin(s * 1.7) * 0.06);
      const b1x = cx + Math.cos(s * 1.3) * 0.16;
      const b1y = cy + Math.sin(s * 1.1) * 0.09;
      const b2x = cx + Math.cos(s * 0.8 + 2) * 0.2;
      const b2y = cy + Math.sin(s * 1.5 + 1) * 0.12;
      const inv0 = 1 / (r0 * r0);
      const inv1 = 1 / (r0 * r0 * 0.35);
      const inv2 = 1 / (r0 * r0 * 0.22);

      for (let y = 0; y < rows; y++) {
        const v = (y + 0.5) / rows;
        const by = (y & 7) << 3;
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const u = (x + 0.5) / cols;
          const ux = (u - cx) * aspect;
          const vy = v - cy;
          const ux1 = (u - b1x) * aspect;
          const vy1 = v - b1y;
          const ux2 = (u - b2x) * aspect;
          const vy2 = v - b2y;
          let f =
            Math.exp(-(ux * ux + vy * vy) * inv0) * 0.95 +
            Math.exp(-(ux1 * ux1 + vy1 * vy1) * inv1) * 0.45 +
            Math.exp(-(ux2 * ux2 + vy2 * vy2) * inv2) * 0.35;
          // Flicker, like heat moving through the shape.
          f *= 0.82 + 0.18 * Math.sin(u * 9 + s * 3.1) * Math.cos(v * 7 - s * 2.3);
          buf[row + x] = f > BAYER[by + (x & 7)] ? RED : BLACK;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    measure();

    if (!animated) {
      progress.current = 0.6;
      draw(4000);
      const onResize = () => {
        measure();
        draw(4000);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let visible = true;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return; // 30fps is plenty for a slow ember
      last = t;
      draw(t);
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas.parentElement!);

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [progress]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pixelated absolute left-0 top-0 block"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
