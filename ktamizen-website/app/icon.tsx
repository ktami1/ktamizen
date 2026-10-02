import { ImageResponse } from "next/og";
import { serifFont } from "@/lib/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
        fontSize: 420,
        lineHeight: 1,
        paddingTop: 30,
      }}
    >
      K
    </div>,
    { ...size, fonts: [{ name: "Serif", data: await serifFont(), style: "normal", weight: 400 }] },
  );
}
