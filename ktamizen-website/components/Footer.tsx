import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-hair bg-ink">
      <div className="gutter mx-auto max-w-[1600px] pb-10 pt-[12vh]">
        <p
          className="serif select-none text-paper"
          style={{ fontSize: "clamp(4rem, 19.5vw, 22rem)", lineHeight: 0.8, marginLeft: "-0.04em" }}
          aria-label="KTAMIZEN"
        >
          KTAMIZEN
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <p className="caption text-mute">Follow</p>
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-line self-start">
              Instagram
            </a>
            <a href={site.xUrl} target="_blank" rel="noopener noreferrer" className="link-line self-start">
              X
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="caption text-mute">Contact</p>
            <a href={`mailto:${site.email}`} className="link-line self-start">
              {site.email}
            </a>
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <p className="caption text-mute">Small print</p>
            <p className="max-w-[52ch] text-[14px] text-mute">
              no cookies. no tracking you. if you send a question or your email, it only reaches me.
            </p>
            <p className="max-w-[52ch] text-[14px] text-mute">
              digital products are for personal use. no refunds, except if i made a mistake.
            </p>
          </div>
        </div>

        <div className="mt-20 flex items-center justify-between border-t border-hair pt-6">
          <p className="caption text-mute">powered by God.</p>
          <a href="#top" className="caption link-line text-mute">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
