import { dirname, join } from "path";
import { fileURLToPath } from "url";
import withBundleAnalyzer from "@next/bundle-analyzer";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: join(__dirname, "../.."),
  },
};

const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default analyzed;
