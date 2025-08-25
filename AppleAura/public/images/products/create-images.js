
const fs = require('fs');
const path = require('path');

// Create SVG placeholders for products
const products = [
  { name: 'iphone-15-pro.jpg', color: '#1d1d1f', text: 'iPhone 15 Pro' },
  { name: 'macbook-pro-14.jpg', color: '#313233', text: 'MacBook Pro 14"' },
  { name: 'ipad-pro-129.jpg', color: '#f5f5f7', text: 'iPad Pro 12.9"' },
  { name: 'airpods-pro.jpg', color: '#f5f5f7', text: 'AirPods Pro' },
  { name: 'apple-watch-s9.jpg', color: '#1d1d1f', text: 'Apple Watch S9' },
  { name: 'imac-24.jpg', color: '#0071e3', text: 'iMac 24"' },
];

products.forEach(product => {
  const textColor = product.color === '#f5f5f7' ? '#1d1d1f' : '#ffffff';
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="${product.color}"/>
    <text x="200" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
          text-anchor="middle" fill="${textColor}">${product.text}</text>
  </svg>`;
  
  fs.writeFileSync(path.join(__dirname, product.name.replace('.jpg', '.svg')), svg);
  console.log(`Created ${product.name.replace('.jpg', '.svg')}`);
});

console.log('All product images created successfully!');
