import { ImageResponse } from "next/og";
import { serifFont } from "@/lib/og";

export const alt = "KTAMIZEN. Powered by God.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Black card, white wordmark, one red rule. No photo.
export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: "#fff", fontFamily: "Serif", fontSize: 200, letterSpacing: -12, lineHeight: 1 }}>
        KTAMIZEN
      </div>
      <div style={{ width: 180, height: 3, background: "#D30000", marginTop: 36 }} />
      <div style={{ color: "#8A8A8A", fontSize: 22, letterSpacing: 6, marginTop: 36 }}>POWERED BY GOD</div>
    </div>,
    { ...size, fonts: [{ name: "Serif", data: await serifFont(), style: "normal", weight: 400 }] },
  );
}
