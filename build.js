const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/client/cli/cli.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: 'dist/mcpctl.js',
      format: 'cjs',
      sourcemap: true,
      minify: true,
    });
    
    // Add shebang line after build
    const fileContent = fs.readFileSync('dist/mcpctl.js', 'utf8');
    fs.writeFileSync('dist/mcpctl.js', '#!/usr/bin/env node\n' + fileContent);
    
    // Make the file executable
    fs.chmodSync('dist/mcpctl.js', '755');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 