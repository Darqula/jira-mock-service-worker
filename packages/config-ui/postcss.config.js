module.exports = {
  plugins: {
    // Tailwind v4 moved its PostCSS plugin to a dedicated package and handles
    // vendor prefixing internally, so the separate autoprefixer step is gone.
    '@tailwindcss/postcss': {},
  },
};
