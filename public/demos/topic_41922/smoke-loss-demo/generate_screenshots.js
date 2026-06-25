/**
 * Screenshot Generator Script
 * Creates placeholder screenshots for SmokeLoss demo
 * Run with: node generate_screenshots.js
 */

const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG (base64)
const createPlaceholderPng = (width, height, color) => {
  // Create a simple placeholder with HTML canvas-like approach
  // For simplicity, we'll create a minimal valid PNG with a colored background
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  return pngHeader;
};

// Create assets directory if not exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate screenshots using text-based approach
const screenshots = [
  { name: 'welcome.png', title: 'Welcome', subtitle: 'Start Screen' },
  { name: 'stats.png', title: 'Today\'s Loss', subtitle: 'Cost Statistics' },
  { name: 'poster.png', title: 'Share Poster', subtitle: 'Share Card' }
];

screenshots.forEach(({ name }) => {
  const filePath = path.join(assetsDir, name);
  const pngData = createPlaceholderPng(390, 844, '#FAF7F2');
  fs.writeFileSync(filePath, pngData);
  console.log(`Created: ${filePath}`);
});

console.log('\nScreenshots generated successfully!');
