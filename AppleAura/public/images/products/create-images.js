
// Script para generar imágenes SVG de productos Apple
const fs = require('fs');
const path = require('path');

const createSVG = (name, color = '#000000', bgColor = '#f5f5f7') => {
  let svg = '';
  
  switch (name) {
    case 'iphone-15-pro-max':
      svg = `
        <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="300" fill="${bgColor}" rx="20"/>
          <rect x="20" y="30" width="160" height="240" fill="${color}" rx="25"/>
          <rect x="30" y="40" width="140" height="220" fill="#1a1a1a" rx="15"/>
          <circle cx="100" cy="60" r="8" fill="#333"/>
          <rect x="60" y="45" width="80" height="30" fill="#333" rx="15"/>
          <circle cx="100" cy="270" r="15" fill="#666"/>
        </svg>
      `;
      break;
    case 'macbook-pro-14':
      svg = `
        <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="200" fill="${bgColor}"/>
          <rect x="30" y="30" width="240" height="140" fill="${color}" rx="8"/>
          <rect x="40" y="40" width="220" height="120" fill="#1a1a1a" rx="4"/>
          <rect x="20" y="170" width="260" height="20" fill="${color}" rx="10"/>
          <rect x="140" y="175" width="20" height="10" fill="#666" rx="5"/>
        </svg>
      `;
      break;
    case 'ipad-pro-129':
      svg = `
        <svg viewBox="0 0 250 320" xmlns="http://www.w3.org/2000/svg">
          <rect width="250" height="320" fill="${bgColor}" rx="15"/>
          <rect x="20" y="20" width="210" height="280" fill="${color}" rx="12"/>
          <rect x="30" y="30" width="190" height="260" fill="#1a1a1a" rx="8"/>
          <circle cx="125" cy="310" r="8" fill="#666"/>
        </svg>
      `;
      break;
    case 'airpods-pro':
      svg = `
        <svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="250" fill="${bgColor}"/>
          <rect x="50" y="50" width="100" height="150" fill="${color}" rx="50"/>
          <circle cx="70" cy="180" r="20" fill="${color}"/>
          <circle cx="130" cy="180" r="20" fill="${color}"/>
          <rect x="65" y="195" width="10" height="30" fill="${color}" rx="5"/>
          <rect x="125" y="195" width="10" height="30" fill="${color}" rx="5"/>
        </svg>
      `;
      break;
    case 'apple-watch-s9':
      svg = `
        <svg viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="220" fill="${bgColor}"/>
          <rect x="40" y="60" width="100" height="120" fill="${color}" rx="25"/>
          <rect x="50" y="70" width="80" height="100" fill="#1a1a1a" rx="15"/>
          <rect x="70" y="40" width="40" height="20" fill="${color}" rx="10"/>
          <rect x="70" y="180" width="40" height="20" fill="${color}" rx="10"/>
          <circle cx="90" cy="120" r="25" fill="#333"/>
          <circle cx="90" cy="120" r="15" fill="#666"/>
        </svg>
      `;
      break;
    case 'imac-24':
      svg = `
        <svg viewBox="0 0 300 280" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="280" fill="${bgColor}"/>
          <rect x="30" y="30" width="240" height="180" fill="${color}" rx="12"/>
          <rect x="40" y="40" width="220" height="160" fill="#1a1a1a" rx="8"/>
          <polygon points="140,210 160,210 170,250 130,250" fill="${color}"/>
          <rect x="80" y="250" width="140" height="15" fill="${color}" rx="7"/>
        </svg>
      `;
      break;
    default:
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="${bgColor}"/>
          <rect x="50" y="50" width="100" height="100" fill="${color}" rx="10"/>
        </svg>
      `;
  }
  
  return svg;
};

// Crear directorio si no existe
const dir = path.dirname(__filename);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Generar imágenes
const products = [
  { name: 'iphone-15-pro-max', color: '#4a4a4a' },
  { name: 'macbook-pro-14', color: '#8e8e93' },
  { name: 'ipad-pro-129', color: '#6c6c70' },
  { name: 'airpods-pro', color: '#ffffff' },
  { name: 'apple-watch-s9', color: '#1d1d1f' },
  { name: 'imac-24', color: '#007aff' },
];

products.forEach(product => {
  const svg = createSVG(product.name, product.color);
  const filename = path.join(dir, `${product.name}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: ${filename}`);
});

console.log('All product images created successfully!');
