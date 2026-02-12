import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/EvaSudoku" : undefined,
  assetPrefix: isProd ? "/EvaSudoku/" : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/EvaSudoku" : "",
  },
};

export default nextConfig;
