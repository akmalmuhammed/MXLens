import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://mx-lens.vercel.app";
    return ["", "/docs", "/about"].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
