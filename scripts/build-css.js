const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

async function buildCSS() {
  const inputPath = path.resolve(__dirname, '../src/app/globals.src.css');
  const outputPath = path.resolve(__dirname, '../src/app/globals.css');

  if (!fs.existsSync(inputPath)) {
    fs.copyFileSync(outputPath, inputPath);
  }

  const css = fs.readFileSync(inputPath, 'utf8');
  const baseDir = path.resolve(__dirname, '..');
  const result = await postcss([tailwind({ base: baseDir })]).process(css, {
    from: inputPath,
    to: outputPath,
  });

  fs.writeFileSync(outputPath, result.css);
  console.log(`[build-css] Generated globals.css (${(result.css.length / 1024).toFixed(1)} KB)`);
}

buildCSS().catch(err => {
  console.error('[build-css] Error:', err);
  process.exit(1);
});
