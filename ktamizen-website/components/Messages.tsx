"use client";

import { useEffect, useRef } from "react";
import { messages } from "@/content/messages";
import { withGsap, motionAllowed } from "@/lib/motion";

// Renders only when there are real messages. They arrive one by one, stacked,
// each new one dimming the ones before it.
export default function Messages() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!messages.length || !motionAllowed()) return;
    return withGsap(({ gsap }) => {
      const el = root.current!;
      const ctx = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>("[data-msg]");
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 60%", once: true } });
        items.forEach((m, i) => {
          tl.fromTo(
            m,
            { opacity: 0, y: 16, filter: "blur(8px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 },
            i * 0.9,
          );
          if (i > 0) tl.to(items.slice(0, i), { opacity: 0.35, duration: 0.5 }, i * 0.9);
        });
      }, el);
      return () => ctx.revert();
    });
  }, []);

  if (!messages.length) return null;

  return (
    <section ref={root} aria-labelledby="messages-title" className="gutter bg-ink py-[16vh]">
      <h2 id="messages-title" className="caption mb-10 text-mute">
        what you send me
      </h2>
      <ul className="flex max-w-[40ch] flex-col gap-5">
        {messages.map((m, i) => (
          <li key={i} data-msg className="serif text-h2 lowercase" style={{ lineHeight: 1.05 }}>
            {m}
          </li>
        ))}
      </ul>
    </section>
  );
}
