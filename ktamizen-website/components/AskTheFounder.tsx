"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Faq } from "@/content/faq";
import { match, related } from "@/lib/ask";
import { withGsap, motionAllowed } from "@/lib/motion";
import { scrollTo } from "./Experience";

type State =
  { kind: "idle" } | { kind: "answer"; faq: Faq; asked: string } | { kind: "miss"; asked: string; sent: boolean };

export default function AskTheFounder({ faqs }: { faqs: Faq[] }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [placeholder, setPlaceholder] = useState(faqs[0]?.question ?? "");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const chips = faqs.slice(0, 6);

  const show = useCallback((faq: Faq, asked?: string) => {
    setState({ kind: "answer", faq, asked: asked ?? faq.question });
    setCopied(false);
  }, []);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const hit = match(t, faqs);
    if (hit) show(hit, t);
    else setState({ kind: "miss", asked: t, sent: false });
  };

  // Typed, rotating placeholder made of real questions.
  useEffect(() => {
    if (!motionAllowed()) return;
    let q = 0;
    let c = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const target = faqs[q % faqs.length].question;
      c++;
      setPlaceholder(target.slice(0, c));
      if (c < target.length) timer = setTimeout(step, 38);
      else
        timer = setTimeout(() => {
          q++;
          c = 0;
          step();
        }, 3000);
    };
    timer = setTimeout(step, 800);
    return () => clearTimeout(timer);
  }, [faqs]);

  // Deep links: /?ask=how-lines plays that answer.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("ask");
    const faq = id ? faqs.find((f) => f.id === id) : undefined;
    if (!faq) return;
    const go = () => {
      scrollTo(sectionRef.current!);
      setTimeout(() => show(faq), 700);
    };
    if (document.documentElement.classList.contains("seen") || !motionAllowed()) setTimeout(go, 200);
    else window.addEventListener("ktz:ready", go, { once: true });
  }, [faqs, show]);

  const share = async (faq: Faq) => {
    const url = `${window.location.origin}/?ask=${faq.id}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ url, title: "KTAMIZEN" });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {}
  };

  return (
    <section
      ref={sectionRef}
      id="ask"
      data-cursor-ask
      aria-labelledby="ask-title"
      className="relative flex min-h-svh flex-col justify-center bg-ink py-[14vh]"
    >
      <div className="gutter mx-auto w-full max-w-[1400px]">
        <h2 id="ask-title" className="caption mb-8 flex items-center gap-4 md:mb-12">
          <span className="block h-2 w-2 bg-red" aria-hidden="true" />
          Ask the founder
        </h2>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
          className="group relative"
        >
          <label htmlFor="ask-input" className="sr-only">
            ask the founder anything
          </label>
          <div className="ask-rule flex items-end gap-4 pb-3">
            <input
              ref={inputRef}
              id="ask-input"
              name="q"
              autoComplete="off"
              enterKeyHint="send"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setValue("");
                  setState({ kind: "idle" });
                }
              }}
              placeholder={placeholder}
              className="ask-input serif min-w-0 flex-1 bg-transparent text-h2 md:text-h1 outline-none focus-visible:outline-none"
              style={{ lineHeight: 1.05 }}
            />
            <button
              type="submit"
              className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center bg-red text-paper transition-colors hover:bg-paper hover:text-ink active:bg-red-press md:h-16 md:w-16"
              aria-label="Ask"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </form>

        <div className="no-scrollbar -mx-[var(--gutter)] mt-6 flex gap-2 overflow-x-auto px-[var(--gutter)] md:mx-0 md:flex-wrap md:px-0">
          {chips.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={state.kind === "answer" && state.faq.id === f.id}
              onClick={() => {
                setValue("");
                show(f);
              }}
            >
              {f.question}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="mt-14 min-h-[40svh] md:mt-20">
          {state.kind === "answer" && (
            <AnswerCard
              key={state.faq.id + state.asked}
              faq={state.faq}
              asked={state.asked}
              related={related(state.faq, faqs)}
              onAsk={(f) => show(f)}
              onShare={() => share(state.faq)}
              copied={copied}
            />
          )}
          {state.kind === "miss" && (
            <NoMatch
              key={state.asked}
              asked={state.asked}
              sent={state.sent}
              onSent={() => setState({ ...state, sent: true })}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function AnswerCard({
  faq,
  asked,
  related,
  onAsk,
  onShare,
  copied,
}: {
  faq: Faq;
  asked: string;
  related: Faq[];
  onAsk: (f: Faq) => void;
  onShare: () => void;
  copied: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [done, setDone] = useState(false);
  const words = faq.answer.split(" ");

  useEffect(() => {
    if (!motionAllowed()) {
      setDone(true);
      return;
    }
    return withGsap(({ gsap }) => {
      const el = ref.current!;
      const ws = el.querySelectorAll("[data-w]");
      tl.current = gsap
        .timeline({ onComplete: () => setDone(true) })
        .fromTo(el.querySelector("[data-q]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(el.querySelector("[data-marker]"), { scaleY: 0 }, { scaleY: 1, duration: 0.6 }, 0.1)
        .fromTo(
          ws,
          { opacity: 0, y: 16, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: Math.min(0.09, 2.6 / ws.length) },
          0.25,
        );
      return () => {
        tl.current?.kill();
      };
    });
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-[2px_1fr] gap-x-5 md:gap-x-8">
      <span data-marker className="block origin-top bg-red" aria-hidden="true" />
      <div>
        <p data-q className="text-[15px] text-mute">
          {asked}
        </p>
        <p className="serif mt-5 max-w-[22ch] text-h2 md:max-w-[26ch]" style={{ lineHeight: 1.08 }}>
          {words.map((w, i) => (
            <span key={i} data-w className="inline-block">
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {!done && (
            <button
              type="button"
              className="caption link-line text-mute"
              onClick={() => {
                tl.current?.progress(1);
                setDone(true);
              }}
            >
              Skip
            </button>
          )}
          <button type="button" className="caption link-line" onClick={onShare}>
            {copied ? "link copied" : "Share this answer"}
          </button>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <p className="caption mb-3 text-mute">keep going</p>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <button key={r.id} type="button" className="chip" onClick={() => onAsk(r)}>
                  {r.question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoMatch({ asked, sent, onSent }: { asked: string; sent: boolean; onSent: () => void }) {
  return (
    <div className="grid grid-cols-[2px_1fr] gap-x-5 md:gap-x-8">
      <span className="block bg-hair" aria-hidden="true" />
      <div>
        <p className="text-[15px] text-mute">{asked}</p>
        <p className="serif mt-5 text-h2" style={{ lineHeight: 1.08 }}>
          i don&apos;t have that one yet.
        </p>
        {sent ? (
          <p className="mt-8 text-[15px]">got it. if it&apos;s a good one, you&apos;ll see it here.</p>
        ) : (
          <form
            className="mt-8 flex max-w-xl flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              // Dummy: nothing is sent yet. See README, unanswered questions.
              onSent();
            }}
          >
            <p className="text-[15px] text-mute">send it to me, the best ones get an answer here.</p>
            <label htmlFor="miss-email" className="caption mt-2 text-mute">
              Tell me when it&apos;s answered (optional)
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="miss-email"
                type="email"
                autoComplete="email"
                placeholder="your email"
                className="h-14 flex-1 border-b border-hair bg-transparent text-paper outline-none placeholder:text-[#4a4a4a] focus:border-paper"
              />
              <button type="submit" className="btn btn-primary">
                <span>Send it</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
