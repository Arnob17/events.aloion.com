import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/organizer", "/admin", "/my-events", "/tickets", "/certificates"] },
    ],
  };
}
