import { ImageResponse } from "next/og";
import { serifFont } from "@/lib/og";

export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Serif",
        fontSize: 150,
        lineHeight: 1,
        paddingTop: 10,
      }}
    >
      K
    </div>,
    { ...size, fonts: [{ name: "Serif", data: await serifFont(), style: "normal", weight: 400 }] },
  );
}
