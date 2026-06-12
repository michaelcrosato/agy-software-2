import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma's generated client lives outside node_modules (prisma/generated);
  // ensure Next's standalone file-tracing bundles it into the container.
  outputFileTracingIncludes: {
    "/api/health": ["./prisma/generated/**"],
  },
};

export default nextConfig;
