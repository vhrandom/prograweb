
const fs = require('fs');
const path = require('path');

// Crear SVGs simples para productos Apple
const products = [
  { name: 'iphone-15-pro', color: '#1d1d1f', product: 'iPhone 15 Pro' },
  { name: 'macbook-pro', color: '#86868b', product: 'MacBook Pro' },
  { name: 'ipad-air', color: '#007aff', product: 'iPad Air' },
  { name: 'apple-watch', color: '#000000', product: 'Apple Watch' },
  { name: 'airpods-pro', color: '#ffffff', product: 'AirPods Pro' },
  { name: 'mac-mini', color: '#86868b', product: 'Mac mini' },
  { name: 'studio-display', color: '#1d1d1f', product: 'Studio Display' },
  { name: 'magic-keyboard', color: '#ffffff', product: 'Magic Keyboard' }
];

products.forEach(({ name, color, product }) => {
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="#f5f5f7"/>
    <rect x="50" y="100" width="300" height="200" rx="20" fill="${color}" stroke="#d2d2d7" stroke-width="2"/>
    <text x="200" y="220" text-anchor="middle" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" fill="${color === '#ffffff' ? '#1d1d1f' : '#ffffff'}">${product}</text>
    <circle cx="350" cy="50" r="15" fill="#ff3b30"/>
    <text x="350" y="55" text-anchor="middle" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="white">🍎</text>
  </svg>`;
  
  fs.writeFileSync(`${name}.svg`, svg);
  console.log(`Generated ${name}.svg`);
});

console.log('All product images generated successfully!');
