import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1F4D3A",
        borderRadius: "8px",
        color: "#C9A24B",
        fontSize: "20px",
        fontWeight: 700,
        fontFamily: "serif",
        border: "1px solid rgba(201, 162, 75, 0.4)",
      }}
    >
      T
    </div>,
    {
      ...size,
    }
  );
}
