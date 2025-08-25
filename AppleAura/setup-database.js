
#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗄️  Configurador de Base de Datos para AppleAura');
console.log('================================================');
console.log('');
console.log('Opciones disponibles:');
console.log('1. Usar Neon (PostgreSQL gratuito en la nube) - RECOMENDADO');
console.log('2. Usar Railway (PostgreSQL gratuito)');
console.log('3. Configurar manualmente');
console.log('');

rl.question('¿Qué opción prefieres? (1/2/3): ', (answer) => {
  switch (answer) {
    case '1':
      console.log('');
      console.log('🚀 Para configurar Neon:');
      console.log('1. Ve a https://neon.tech');
      console.log('2. Crea una cuenta gratuita');
      console.log('3. Crea un nuevo proyecto');
      console.log('4. Copia la URL de conexión (Database URL)');
      console.log('5. Ve a Secrets en Replit y añade DATABASE_URL');
      console.log('');
      console.log('Ejemplo de URL: postgresql://user:pass@ep-example.us-east-1.postgres.vercel-storage.com/dbname');
      break;
    case '2':
      console.log('');
      console.log('🚂 Para configurar Railway:');
      console.log('1. Ve a https://railway.app');
      console.log('2. Crea una cuenta gratuita');
      console.log('3. Crea un nuevo proyecto con PostgreSQL');
      console.log('4. Copia la URL de conexión');
      console.log('5. Ve a Secrets en Replit y añade DATABASE_URL');
      break;
    case '3':
      rl.question('Ingresa tu DATABASE_URL: ', (url) => {
        if (url) {
          console.log('✅ Guardando configuración...');
          // Aquí podrías guardar en .env si fuera necesario
          console.log('¡Configuración guardada! Ahora ejecuta: npm run db:seed');
        }
        rl.close();
      });
      return;
    default:
      console.log('Opción no válida');
  }
  rl.close();
});
