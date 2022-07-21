import { nodeResolve } from '@rollup/plugin-node-resolve'
const htmlTemplate = require('rollup-plugin-generate-html-template')

import babel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'
import copy from 'rollup-plugin-copy'

const serve = require('rollup-plugin-serve')
const livereload = require('rollup-plugin-livereload')

const { terser } = require('rollup-plugin-terser')

let extensions = ['.ts', '.tsx']
export default args => {
  let prod = args['config-prod']
  return {
    input: 'src/main.ts',
    output: {
      format: 'iife', 
      name: 'Space',
      dir: 'dist',
      ...(prod ? {
        entryFileNames: '[name].min.js',
        plugins: [terser()]
      } : {
        sourcemap: true
      })
    },
    watch: {
      clearScreen: false
    },
    plugins: [
      nodeResolve({ extensions, browser: true }),
      babel({ extensions, babelHelpers: 'bundled' }),
      copy({
        targets: [
          { src: 'assets/vsound.min.js', dest: 'dist' }
        ]
      }),
      url({ limit: 1000 }),
      htmlTemplate({
        template: 'src/index.html',
        target: 'index.html'
      }),
      ...(prod ? [] : [
        serve({ contentBase: 'dist', port: 3000 }),
        livereload({ watch: 'dist', port: 8080 })
      ])
    ]
  }
}
