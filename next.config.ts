import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.89"],
};

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})(nextConfig);