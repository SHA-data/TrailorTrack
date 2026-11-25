import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1F4D3A",
        borderRadius: "36px",
        color: "#C9A24B",
        border: "3px solid rgba(201, 162, 75, 0.4)",
      }}
    >
      <div
        style={{
          fontSize: "96px",
          fontWeight: 700,
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        T
      </div>
    </div>,
    {
      ...size,
    }
  );
}
