const alias = require('@rollup/plugin-alias');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const path = require('path');

module.exports = {
  input: 'src/main.ts',
  output: {
    file: 'dist/control-plane.bundle.js',
    format: 'esm',
  },
  plugins: [
    alias({
      entries: [
        {
          find: /^@vessl-ai\/mcpctl-shared\/(.*)$/,
          replacement: path.resolve(__dirname, '../../packages/shared/$1'),
        },
        {
          find: '@vessl-ai/mcpctl-shared',
          replacement: path.resolve(__dirname, '../../packages/shared'),
        },
      ],
    }),
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.rollup.json' }),
  ],
  external: [
    ...require('./package.json').dependencies
      ? Object.keys(require('./package.json').dependencies).filter(
          (dep) => !dep.startsWith('@vessl-ai/')
        )
      : [],
  ],
}; 