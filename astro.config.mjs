// @ts-check
// @ts-ignore
import { defineConfig } from 'astro/config';
// @ts-ignore
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    envPrefix: ['DATABASE_'],
  },
  adapter: node({
    mode: 'standalone'
  }),

});