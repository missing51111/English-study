import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #fb7185, #e11d48)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "18%",
        }}
      >
        <div style={{ color: "white", fontSize: 50, fontWeight: "bold", lineHeight: 1.1 }}>英語</div>
        <div style={{ color: "white", fontSize: 50, fontWeight: "bold", lineHeight: 1.1 }}>BOX</div>
      </div>
    ),
    { ...size }
  );
}
