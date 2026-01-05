// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactStrictMode: true,
// };

// export default nextConfig;


// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // istersen dev'de false yapıp test edebilirsin
  sw: "sw.js", // public/sw.js dosyamız
});

module.exports = withPWA({
  reactStrictMode: true,
});
