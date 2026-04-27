import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Static export — required for Capacitor to bundle the app as a local file package.
  // Disabled in dev mode because `output: "export"` is incompatible with Turbopack's
  // dev server and causes site-wide 500 errors on every route.
  ...(isDev ? {} : { output: "export" }),
  // Each route becomes its own directory/index.html so Capacitor's WKWebView
  // can resolve paths without a server rewrite rule.
  trailingSlash: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    // Pre-bundle these packages once at startup rather than compiling
    // them fresh each time a new page is first visited.
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "sonner",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "@radix-ui/react-dialog",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-sheet",
      "@radix-ui/react-slot",
    ],
  },
};

export default nextConfig;
