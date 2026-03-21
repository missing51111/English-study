import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
          gap: 0,
        }}
      >
        <div style={{ color: "white", fontSize: 52, fontWeight: "bold", lineHeight: 1.1 }}>英語</div>
        <div style={{ color: "white", fontSize: 52, fontWeight: "bold", lineHeight: 1.1 }}>BOX</div>
      </div>
    ),
    { ...size }
  );
}
