const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  try {
    // Common build options
    const commonOptions = {
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      sourcemap: true,
      external: ['readline/promises'],
    };

    // CLI 번들링
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/client/cli/cli.ts'],
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
      entryPoints: ['src/client/core/lib/service-templates/index.ts'],
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