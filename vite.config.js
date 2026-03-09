import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        voipOffice: resolve(__dirname, 'voip-office.html'),
        wayneState: resolve(__dirname, 'wayne-state.html'),
        michiganGop: resolve(__dirname, 'michigan-gop.html'),
        news: resolve(__dirname, 'news.html'),
        contact: resolve(__dirname, 'contact.html'),
        chatbot: resolve(__dirname, 'chatbot.html')
      }
    }
  }
})