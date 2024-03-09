/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/lib/**/*.js",
  ],
  theme: {
    extend: {
      keyframes: {
        "animate-in": {
          "0%": { opacity: 0, transform: "translateY(1rem)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        wiggle: {
          "0%": { transform: "rotate(-3deg) translateX(2px)" },
          "50%": {
            transform: "rotate(0deg) translateX(0px) translateY(-2px)",
          },
          "100%": { transform: "rotate(3deg) translateX(-2px)" },
        },
      },
      animation: {
        in: "animate-in 0.3s ease 0.15s both",
        wiggle: "wiggle 2s ease-in-out infinite both",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        btn: {
          background: "hsl(var(--btn-background))",
          "background-hover": "hsl(var(--btn-background-hover))",
        },
      },
    },
  },
  plugins: [require("flowbite/plugin"), require("@tailwindcss/forms")],
  safelist: [
    {
      pattern: /(bg|text)-(yellow|gray|blue)-(200|600)/,
    },
  ],
};
