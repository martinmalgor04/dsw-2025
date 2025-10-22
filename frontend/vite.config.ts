
// CONFIGURACIONES ALTERNATIVAS A VITE

// =============================================================================
// 1. WEBPACK CONFIG (webpack.config.js)
// =============================================================================
/*
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  devServer: {
    port: 3000,
    open: true,
    hot: true,
  },
};
*/

// =============================================================================
// 2. PARCEL CONFIG (package.json)
// =============================================================================
/*
"scripts": {
  "dev": "parcel index.html",
  "build": "parcel build index.html"
},
"browserslist": [
  "last 2 versions",
  "> 1%",
  "not dead"
]
*/

// =============================================================================
// 3. ROLLUP CONFIG (rollup.config.js)
// =============================================================================
/*
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

export default {
  input: 'src/main.tsx',
  output: {
    dir: 'build',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs(),
    typescript(),
    serve({
      open: true,
      port: 3000,
    }),
    livereload(),
    terser(),
  ],
};
*/

// =============================================================================
// 4. ESBUILD CONFIG (esbuild.config.js)
// =============================================================================
/*
const esbuild = require('esbuild');
const { htmlPlugin } = require('@craftamap/esbuild-plugin-html');

esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'build',
  format: 'esm',
  target: 'esnext',
  sourcemap: true,
  minify: true,
  plugins: [
    htmlPlugin({
      files: [
        {
          entryPoints: ['src/main.tsx'],
          filename: 'index.html',
          htmlTemplate: './index.html',
        },
      ],
    }),
  ],
  watch: process.argv.includes('--watch'),
  serve: {
    servedir: 'build',
    port: 3000,
  },
}).catch(() => process.exit(1));
*/

// =============================================================================
// 5. RSPACK CONFIG (rspack.config.js)
// =============================================================================
/*
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'builtin:swc-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  devServer: {
    port: 3000,
    open: true,
    hot: true,
  },
};
*/

// LogiX - Frontend de Gestión Logística
// Configuración Vite para aplicación frontend-only

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});