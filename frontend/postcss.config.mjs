// ─── PostCSS config for frontend (Vite + @tailwindcss/vite) ─────────────────
// @tailwindcss/vite handles Tailwind CSS v4 natively as a Vite plugin.
// This empty PostCSS config prevents the root postcss.config.mjs from being
// picked up and causing "Invalid PostCSS Plugin" errors.
export default {
  plugins: {},
};
