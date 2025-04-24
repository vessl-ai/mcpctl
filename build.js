import esbuild from 'esbuild';
import fs from 'fs';
import { resolve } from 'path';

// Native node modules plugin to handle .node files
const nativeNodeModulesPlugin = {
  name: 'native-node-modules',
  setup(build) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve 
    // it to an absolute path and put it into the "node-file" virtual namespace.
    build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
      path: resolve(args.resolveDir, args.path),
      namespace: 'node-file',
    }))

    // Files in the "node-file" virtual namespace use dynamic import
    build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
      contents: `
        const path = ${JSON.stringify(args.path)};
        let mod;
        try { 
          mod = await import(path);
        } catch {}
        if (mod) {
          Object.assign(exports, mod);
        }
      `,
    }))

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, args => ({
      path: args.path,
      namespace: 'file',
    }))

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    let opts = build.initialOptions
    opts.loader = opts.loader || {}
    opts.loader['.node'] = 'file'
  },
};

async function build() {
  try {
    // Common build options
    const commonOptions = {
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      sourcemap: true,
      plugins: [nativeNodeModulesPlugin],
      external: ['readline/promises', 'keytar'],
      mainFields: ['module', 'main'],
    };

    // CLI 번들링
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/cli/cli.ts'],
      outfile: 'dist/mcpctl.js',
      minify: true,
      banner: {
        js: '#!/usr/bin/env node\n',
      },
    });

    // 데몬 번들링
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/daemon/main.ts'],
      outfile: 'dist/mcpctld.js',
      minify: true,
      banner: {
        js: '#!/usr/bin/env node\n',
      },
    });

    // service-templates 번들링
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/core/lib/service-templates/index.ts'],
      outfile: 'dist/service-templates.js',
    });
    
    // Make files executable
    fs.chmodSync('dist/mcpctl.js', '755');
    fs.chmodSync('dist/mcpctld.js', '755');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 