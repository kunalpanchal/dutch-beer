import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dutch.beer",
    short_name: "Dutch.beer",
    description: "A community-kept directory of Dutch breweries and beers.",
    start_url: "/en",
    display: "standalone",
    background_color: "#24150f",
    theme_color: "#d97820",
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
