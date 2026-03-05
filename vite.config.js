import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        contact: resolve(__dirname, "contact.html"),
        chatbot: resolve(__dirname, "chatbot.html"),
        voip: resolve(__dirname, "voip-office.html"),
        wayne: resolve(__dirname, "wayne-state.html"),
        migop: resolve(__dirname, "michigan-gop.html"),
      },
    },
  },
});