const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  try {
    // CLI 번들링
    await esbuild.build({
      entryPoints: ['src/client/cli/cli.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: 'dist/mcpctl.js',
      format: 'cjs',
      sourcemap: true,
      minify: true,
      banner: {
        js: '#!/usr/bin/env node\n',
      },
    });

    // 데몬 번들링
    await esbuild.build({
      entryPoints: ['src/daemon/main.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: 'dist/mcpctld.js',
      format: 'cjs',
      sourcemap: true,
      minify: true,
      banner: {
        js: '#!/usr/bin/env node\n',
      },
    });

    // service-templates 번들링
    await esbuild.build({
      entryPoints: ['src/client/core/lib/service-templates/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: 'dist/service-templates.js',
      format: 'cjs',
      sourcemap: true,
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