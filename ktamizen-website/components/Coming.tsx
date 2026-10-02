"use client";

import { useEffect, useRef, useState } from "react";
import MagneticButton from "./MagneticButton";
import { shopCta, site } from "@/config/site";
import { debugMarkers, withGsap, motionAllowed } from "@/lib/motion";

const blocks = [
  { title: "Posters", body: "3:4. 30x40, 50x70 and 70x100 cm." },
  { title: "Digital packs", body: "like wallpapers." },
  { title: "More soon", body: "in the same style." },
];

// The one red section, entered with a hard clip-path wipe.
export default function Coming() {
  const root = useRef<HTMLElement>(null);
  const cta = shopCta();

  useEffect(() => {
    if (!motionAllowed()) return;
    return withGsap(({ gsap }) => {
      const el = root.current!;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0 0 0 100%)" },
          {
            clipPath: "inset(0 0 0 0%)",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 25%", scrub: true, markers: debugMarkers() },
          },
        );
        gsap.fromTo(
          "[data-rise]",
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 45%", once: true },
          },
        );
      }, el);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} id="coming" aria-labelledby="coming-title" className="on-red relative bg-red text-paper">
      <div className="gutter mx-auto flex min-h-svh max-w-[1600px] flex-col justify-between gap-16 py-[12vh]">
        <p className="caption" data-rise>
          What is coming
        </p>
        <h2 id="coming-title" data-rise className="serif text-display" style={{ lineHeight: 0.86 }}>
          the shop
          <br />
          is <span className="italic">coming.</span>
        </h2>

        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-end">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {blocks.map((b) => (
              <li key={b.title} data-rise className="border-t border-paper/40 pt-4">
                <p className="caption">{b.title}</p>
                <p className="mt-2 text-[15px]">{b.body}</p>
              </li>
            ))}
          </ul>

          <div data-rise className="md:justify-self-end md:w-full md:max-w-[520px]">
            {site.shopState === "live" ? (
              <MagneticButton href={cta.href} variant="white" external>
                {cta.label}
              </MagneticButton>
            ) : (
              <WaitlistForm />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WaitlistForm() {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <p className="serif text-h2" role="status">
        you&apos;re on the list.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
        if (!/^\S+@\S+\.\S+$/.test(input.value)) {
          setState("error");
          return;
        }
        // Dummy: no provider yet. See README, waitlist.
        setState("done");
      }}
    >
      <label htmlFor="waitlist-email" className="caption">
        Get notified when the shop opens
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="your email"
          aria-invalid={state === "error"}
          aria-describedby="waitlist-msg"
          className="h-14 flex-1 border-b border-paper bg-transparent text-[17px] text-paper outline-none placeholder:text-paper/60"
        />
        <MagneticButton type="submit" variant="white">
          Tell me first
        </MagneticButton>
      </div>
      <p id="waitlist-msg" className="mt-3 min-h-5 text-[14px]" aria-live="polite">
        {state === "error" ? "that email looks off. try again." : ""}
      </p>
    </form>
  );
}
