import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "process-bot-js",
        closeBundle() {
          const src = path.resolve(__dirname, "public/bot.js");
          const dest = path.resolve(__dirname, "dist/bot.js");
          if (fs.existsSync(src)) {
            let content = fs.readFileSync(src, "utf-8");
            content = content.replace(
              "__WEBHOOK_URL__",
              env.VITE_WEBHOOK_URL || ""
            );
            fs.writeFileSync(dest, content);
          }
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
