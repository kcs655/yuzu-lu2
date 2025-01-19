import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: { domains: ["zunlkvwfvyydilbzwunh.supabase.co"] },
};
// next.config.js
module.exports = {
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};
export default nextConfig;
