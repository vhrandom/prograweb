
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando configuración automática de AppleAura...\n');

try {
  // 1. Verificar que estamos en el directorio correcto
  if (!fs.existsSync('./package.json')) {
    console.error('❌ Error: Ejecuta este script desde el directorio AppleAura');
    process.exit(1);
  }

  // 2. Crear directorios necesarios
  console.log('📁 Creando directorios necesarios...');
  const dirs = ['./data', './public/images/products', './migrations'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Creado: ${dir}`);
    }
  });

  // 3. Generar imágenes SVG
  console.log('\n🎨 Generando imágenes de productos...');
  try {
    execSync('cd public/images/products && node create-images.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Advertencia: No se pudieron generar las imágenes');
  }

  // 4. Inicializar base de datos
  console.log('\n🗄️ Configurando base de datos...');
  if (fs.existsSync('./database.sqlite')) {
    fs.unlinkSync('./database.sqlite');
    console.log('🗑️ Base de datos anterior eliminada');
  }

  // 5. Poblar base de datos
  console.log('\n🌱 Poblando base de datos con datos de ejemplo...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('\n✅ ¡Configuración completada exitosamente!');
  console.log('\n🔐 CREDENCIALES DE PRUEBA:');
  console.log('👑 ADMINISTRADOR: admin@appleaura.com / Admin2024!');
  console.log('💼 VENDEDOR: vendedor@appleaura.com / Seller2024!');
  console.log('🛍️ COMPRADOR: comprador@appleaura.com / Buyer2024!');
  console.log('\n🚀 Para iniciar la aplicación: npm run dev');

} catch (error) {
  console.error('❌ Error durante la configuración:', error.message);
  process.exit(1);
}
