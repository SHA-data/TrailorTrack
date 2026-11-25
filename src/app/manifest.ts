import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TailorTrack — Digital Tailoring Passport",
    short_name: "TailorTrack",
    description: "Customer-owned digital tailoring passport made for Pakistan",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F1E3",
    theme_color: "#1F4D3A",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
