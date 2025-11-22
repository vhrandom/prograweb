// setup-database.js (Node >= 18, ESM-friendly)

// Usamos las APIs nativas de Node con import ESM
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.join(__dirname, '.env');

function upsertEnvVar(content, key, value) {
  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
  const line = `${key}=${value}`;
  if (idx === -1) {
    lines.push(line);
  } else {
    lines[idx] = line;
  }
  // asegura salto final de línea
  return lines.filter(Boolean).join('\n') + '\n';
}

function writeEnv(updates) {
  let current = '';
  if (fs.existsSync(ENV_PATH)) {
    current = fs.readFileSync(ENV_PATH, 'utf8');
  }
  let next = current;
  for (const [k, v] of Object.entries(updates)) {
    next = upsertEnvVar(next, k, v);
  }
  fs.writeFileSync(ENV_PATH, next, 'utf8');
}

function printNextSteps() {
  console.log('\n✅ Listo. Pasos siguientes:');
  console.log('1) Inicia el backend:   npx tsx server/index.ts');
  console.log('2) En otra terminal:    cd client && npm install && npm run dev');
  console.log('3) Abre el frontend en: http://localhost:5000/\n');
}

async function main() {
  const rl = createInterface({ input, output });

  console.log('🗄️  Configurador de Base de Datos para AppleAura');
  console.log('================================================\n');
  console.log('Opciones disponibles:');
  console.log('1) Usar Neon (PostgreSQL en la nube)');
  console.log('2) Usar Railway (PostgreSQL en la nube)');
  console.log('3) Ingresar DATABASE_URL manualmente');
  console.log('4) Usar SQLite local (recomendado para desarrollo rápido)');
  console.log('');

  try {
    const answer = await rl.question('¿Qué opción prefieres? (1/2/3/4): ');

    if (answer === '1') {
      console.log('\n🚀 Neon (https://neon.tech)');
      console.log('Crea un proyecto y copia tu Database URL (postgresql://...)\n');
      const url = await rl.question('Pega tu DATABASE_URL de Neon: ');
      if (!url.trim()) {
        console.log('❌ No se recibió URL. Cancelado.');
      } else {
        writeEnv({ DATABASE_URL: url.trim() });
        console.log('✅ DATABASE_URL guardada en .env');
      }
      printNextSteps();
    } else if (answer === '2') {
      console.log('\n🚂 Railway (https://railway.app)');
      console.log('Crea un proyecto con PostgreSQL y copia tu Database URL (postgresql://...)\n');
      const url = await rl.question('Pega tu DATABASE_URL de Railway: ');
      if (!url.trim()) {
        console.log('❌ No se recibió URL. Cancelado.');
      } else {
        writeEnv({ DATABASE_URL: url.trim() });
        console.log('✅ DATABASE_URL guardada en .env');
      }
      printNextSteps();
    } else if (answer === '3') {
      const url = await rl.question('Ingresa tu DATABASE_URL (postgresql://... o sqlite:...): ');
      if (!url.trim()) {
        console.log('❌ No se recibió URL. Cancelado.');
      } else {
        writeEnv({ DATABASE_URL: url.trim() });
        console.log('✅ DATABASE_URL guardada en .env');
      }
      printNextSteps();
    } else if (answer === '4') {
      // Usa el archivo SQLite que ya está en el repo
      const sqlitePath = path.join(__dirname, 'database.sqlite');
      const url = `sqlite:${sqlitePath}`;
      writeEnv({ DATABASE_URL: url, HOST: '127.0.0.1', PORT: '5000' });
      console.log(`\n🧩 Usando SQLite local: ${sqlitePath}`);
      console.log('✅ DATABASE_URL, HOST y PORT guardados en .env');
      printNextSteps();
    } else {
      console.log('❌ Opción no válida.');
    }
  } catch (err) {
    console.error('⚠️  Error:', err);
  } finally {
    rl.close();
  }
}

main();
