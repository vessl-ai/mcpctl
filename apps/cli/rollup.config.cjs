const alias = require('@rollup/plugin-alias');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const path = require('path');

function shebangPlugin() {
  return {
    name: 'shebang',
    renderChunk(code) {
      return '#!/usr/bin/env node\n' + code;
    },
  };
}

module.exports = {
  input: 'src/main.ts',
  output: {
    file: 'dist/cli.bundle.js',
    format: 'cjs',
    banner: '', // handled by shebangPlugin
  },
  plugins: [
    alias({
      entries: [
        {
          find: /^@repo\/shared\/(.*)$/,
          replacement: path.resolve(__dirname, '../../packages/shared/src/$1'),
        },
        {
          find: '@repo/shared',
          replacement: path.resolve(__dirname, '../../packages/shared/src'),
        },
      ],
    }),
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    shebangPlugin(),
  ],
  external: [
    ...require('./package.json').dependencies
      ? Object.keys(require('./package.json').dependencies).filter(
          (dep) => !dep.startsWith('@repo/')
        )
      : [],
  ],
}; 