import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iayush.com',
  output: 'static',
  vite: {
    build: { target: 'es2022' },
  },
});
