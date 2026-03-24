import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core blacks
        cyber: {
          black: "#000000",
          void: "#030303",
          deep: "#0a0a0f",
          dark: "#0d0d1a",
          surface: "#111128",
          elevated: "#16163a",
          hover: "#1a1a4e",
        },
        // Neon palette
        neon: {
          cyan: "#00FFFF",
          green: "#00FF41",
          magenta: "#FF00FF",
          pink: "#FF2D95",
          blue: "#4361EE",
          orange: "#FF6B00",
          yellow: "#FFE500",
          red: "#FF0040",
          purple: "#BF00FF",
        },
        // Muted versions for backgrounds
        glow: {
          cyan: "rgba(0, 255, 255, 0.08)",
          green: "rgba(0, 255, 65, 0.08)",
          magenta: "rgba(255, 0, 255, 0.08)",
          pink: "rgba(255, 45, 149, 0.08)",
          blue: "rgba(67, 97, 238, 0.08)",
          red: "rgba(255, 0, 64, 0.08)",
        },
        // Border colors
        grid: {
          dim: "rgba(0, 255, 255, 0.06)",
          line: "rgba(0, 255, 255, 0.12)",
          bright: "rgba(0, 255, 255, 0.25)",
          solid: "rgba(0, 255, 255, 0.4)",
        },
        // Text
        hud: {
          text: "#E0F7FA",
          muted: "#4A9BA8",
          dim: "#1E4D56",
        },
      },
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          "monospace",
        ],
        display: [
          '"Orbitron"',
          '"Rajdhani"',
          "sans-serif",
        ],
        body: [
          '"Rajdhani"',
          '"Share Tech"',
          "sans-serif",
        ],
      },
      boxShadow: {
        "neon-cyan":
          "0 0 5px rgba(0,255,255,0.3), 0 0 20px rgba(0,255,255,0.1), inset 0 0 5px rgba(0,255,255,0.05)",
        "neon-cyan-lg":
          "0 0 10px rgba(0,255,255,0.4), 0 0 40px rgba(0,255,255,0.15), 0 0 80px rgba(0,255,255,0.05)",
        "neon-green":
          "0 0 5px rgba(0,255,65,0.3), 0 0 20px rgba(0,255,65,0.1)",
        "neon-green-lg":
          "0 0 10px rgba(0,255,65,0.4), 0 0 40px rgba(0,255,65,0.15)",
        "neon-magenta":
          "0 0 5px rgba(255,0,255,0.3), 0 0 20px rgba(255,0,255,0.1)",
        "neon-magenta-lg":
          "0 0 10px rgba(255,0,255,0.4), 0 0 40px rgba(255,0,255,0.15)",
        "neon-red":
          "0 0 5px rgba(255,0,64,0.3), 0 0 20px rgba(255,0,64,0.1)",
        "neon-orange":
          "0 0 5px rgba(255,107,0,0.3), 0 0 20px rgba(255,107,0,0.1)",
        hologram:
          "0 0 15px rgba(0,255,255,0.2), 0 0 30px rgba(0,255,255,0.1), inset 0 1px 0 rgba(0,255,255,0.1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)",
        "grid-pattern-dense":
          "linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)",
        "scan-gradient":
          "linear-gradient(180deg, transparent, rgba(0,255,255,0.03), transparent)",
        "cyber-gradient":
          "linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,255,0.05), rgba(0,255,65,0.05))",
        "tron-border":
          "linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)",
      },
      backgroundSize: {
        "grid-sm": "20px 20px",
        "grid-md": "40px 40px",
        "grid-lg": "80px 80px",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": {
            transform: "translate(-2px, -2px)",
          },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": {
            transform: "translate(2px, -2px)",
          },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.3" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.7" },
          "97%": { opacity: "1" },
        },
        "data-stream": {
          "0%": {
            transform: "translateY(0)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
        },
        "matrix-rain": {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": {
            transform: "translateY(100%)",
            opacity: "0",
          },
        },
        "tron-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 5px rgba(0,255,255,0.3), 0 0 10px rgba(0,255,255,0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 10px rgba(0,255,255,0.5), 0 0 30px rgba(0,255,255,0.2), 0 0 60px rgba(0,255,255,0.1)",
          },
        },
      },
      animation: {
        "scan-line": "scan-line 8s linear infinite",
        "glow-pulse":
          "glow-pulse 2s ease-in-out infinite",
        "border-flow": "border-flow 3s ease infinite",
        glitch: "glitch 0.3s ease-in-out",
        flicker: "flicker 4s linear infinite",
        "data-stream":
          "data-stream 1s ease-in-out infinite",
        "matrix-rain":
          "matrix-rain 3s linear infinite",
        "tron-glow":
          "tron-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}

export default config
