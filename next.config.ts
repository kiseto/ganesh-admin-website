import type { NextConfig } from "next";

const mediaOrigin = process.env.CMS_MEDIA_ORIGIN;
const mediaUrl = mediaOrigin ? new URL(mediaOrigin) : null;

const nextConfig: NextConfig = {
  distDir: process.env.GANESH_BUILD_DIR ?? ".next",
  outputFileTracingExcludes: { "/*": ["./.env*", "./.local-setup/**/*", "./.visual-qa/**/*", "./var/**/*"] },
  images: {
    remotePatterns: mediaUrl ? [{ protocol: mediaUrl.protocol.replace(":", "") as "http" | "https", hostname: mediaUrl.hostname, port: mediaUrl.port, pathname: "/media/content/**", search: "" }] : [],
    maximumRedirects: 0,
    dangerouslyAllowLocalIP: process.env.CMS_ALLOW_LOCAL_MEDIA === "true" && Boolean(mediaUrl && ["localhost", "127.0.0.1"].includes(mediaUrl.hostname)),
  },
};

export default nextConfig;
