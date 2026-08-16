import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f6ecff" },
          100: { value: "#e9d3ff" },
          200: { value: "#d3a8ff" },
          300: { value: "#bd7dff" },
          400: { value: "#a855f7" },
          500: { value: "#a855f7" },
          600: { value: "#8644c5" },
          700: { value: "#653494" },
          800: { value: "#432362" },
          900: { value: "#221131" },
        },
      },
      fonts: {
        heading: { value: "'Anta', sans-serif" },
        body: { value: "'Anta', sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        "bg.canvas": { value: "#000000" },
        "fg.default": { value: "#e6e6e6" },
        "fg.muted": { value: "#a3a3a3" },
      },
    },
  },
  globalCss: {
    "html, body": {
      background: "bg.canvas",
      color: "fg.default",
      lineHeight: 1.5,
    },
    "h1, h2, h3": {
      textTransform: "uppercase",
    },
  },
});

export const system = createSystem(defaultConfig, config);
