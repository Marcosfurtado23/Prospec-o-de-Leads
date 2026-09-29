import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const rawKey = 
      process.env.GEMINI_API_KEY || 
      process.env.API_KEY || 
      process.env.VITE_GEMINI_API_KEY ||
      env.GEMINI_API_KEY || 
      env.API_KEY || 
      env.VITE_GEMINI_API_KEY || 
      '';
    const apiKey = rawKey !== 'PLACEHOLDER_API_KEY' ? rawKey : '';

    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env': JSON.stringify({
          API_KEY: apiKey,
          GEMINI_API_KEY: apiKey,
          VITE_GEMINI_API_KEY: apiKey,
          NODE_ENV: mode,
        }),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
