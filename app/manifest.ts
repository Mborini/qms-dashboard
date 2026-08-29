import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Matrix Ops",
    short_name: "Matrix Ops",
    description: "Matrix Ops is a powerful web application for managing and monitoring operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}