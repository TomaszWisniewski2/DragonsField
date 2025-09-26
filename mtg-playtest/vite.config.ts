// mtg-playtest/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // KLUCZOWA ZMIANA: Zapewnia, że zasoby (JS/CSS) są ładowane ze ścieżek RELATYWNYCH (np. ./assets/...)
  // Jest to niezbędne, gdy serwer (Vercel) serwuje pliki z katalogu, który nie jest głównym katalogiem domeny.
  base: './', 
  
  plugins: [react()],
  
  server: {
    port: 7674, 
  },
});