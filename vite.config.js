// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',            // we serve from /src
  appType: 'mpa',         // multi-page (multiple index.html files)
  base: '',               // make built asset paths relative
  publicDir: 'public',    // src/public
  build: {
    outDir: '../dist',    // put build at repo root /dist
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'src/index.html'),//npm run dev
        compound: resolve(__dirname, 'src/compound_visualiser/index.html'), //npm run dev:compound
        franking: resolve(__dirname, 'src/franking_credit/index.html'), //npm run dev:franking
        // add more apps later:
        // inflation: resolve(__dirname, 'src/inflation_visualiser/index.html'),
        // dca: resolve(__dirname, 'src/dca_planner/index.html'),
      },
    },
  },
  server: {
    open: '/index.html',
  },
});
