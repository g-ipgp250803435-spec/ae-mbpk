import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        account: resolve(process.cwd(), 'account.html'),
        misiBerdikari: resolve(process.cwd(), 'misi-berdikari.html'),
        accessibility: resolve(process.cwd(), 'accessibility.html'),
        braille: resolve(process.cwd(), 'braille.html'),
        communicationBoard: resolve(process.cwd(), 'communication-board.html'),
        learningCenter: resolve(process.cwd(), 'learning-center.html'),
        kataQuest: resolve(process.cwd(), 'kataquest.html'),
        nomborNinja: resolve(process.cwd(), 'nombor-ninja.html'),
        duniaEmosi: resolve(process.cwd(), 'dunia-emosi.html'),
        langkahDemiLangkah: resolve(process.cwd(), 'langkah-demi-langkah.html'),
        tanganBerbicara: resolve(process.cwd(), 'tangan-berbicara.html')
      }
    }
  }
});
