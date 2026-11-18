import { dirname, join } from "path";
import { fileURLToPath } from "url";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // The app has two root layouts ((public) and (app)); unknown URLs get
    // app/global-not-found.tsx.
    globalNotFound: true,
  },
  async redirects() {
    // The install guide lives at /install; send likely guesses there.
    return [
      { source: "/install-guide", destination: "/install", permanent: true },
      {
        source: "/dashboard/install-guide",
        destination: "/install",
        permanent: true,
      },
      {
        source: "/dashboard/install",
        destination: "/install",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The service worker must never be cached, or app updates stall.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store" }],
      },
    ];
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(withNextIntl(nextConfig));

export default analyzed;
