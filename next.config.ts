import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@asharibook/shared"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The app shell is client-rendered and loads its data in the browser, so
  // implicit instant-navigation validation cannot see the rendered UI.
  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  // The floating dev badge sits on top of the mobile bottom navigation.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
