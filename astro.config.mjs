import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Monochrome code theme to match the silver site: tone, not colour, carries the syntax. */
const silver = {
  name: 'silver',
  type: 'dark',
  colors: { 'editor.background': '#0d0d10', 'editor.foreground': '#c9ccd4' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5c5f68', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control'], settings: { foreground: '#ffffff' } },
    { scope: ['string', 'constant.character'], settings: { foreground: '#a8acb6' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#e2e4ea' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#f2f3f6' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.struct'], settings: { foreground: '#d6d8de', fontStyle: 'italic' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#c9ccd4' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#7d808a' } },
  ],
};

export default defineConfig({
  site: 'https://iayush.com',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: silver },
  },
  vite: {
    build: { target: 'es2022' },
  },
});
