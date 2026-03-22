/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT: Since Vercel "Root Directory" is set to 'frontend', 
  // these paths must be relative to the frontend folder.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Add this if you use a src folder
  ],
  theme: {
    extend: {
      fontFamily: {
        // This matches the variables in your layout.jsx
        sans: ["var(--font-inter)"],
        space: ["var(--font-space)"],
      },
    },
  },
  plugins: [],
};
