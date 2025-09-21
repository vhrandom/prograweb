// server/index.ts
import 'dotenv/config'; // carga variables de .env al arrancar

import express, { type Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { registerRoutes } from './routes';
import { log } from './vite';
import { seedDatabase } from './seed';

// -----------------------------------------------------------------------------
// Configuración de HOST/PORT con fallback seguro para Windows
// -----------------------------------------------------------------------------
const HOST = process.env.HOST?.trim() || '127.0.0.1'; // evitar 0.0.0.0 en Windows
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5000;

const app = express();
// During development allow any localhost origin to avoid port mismatches (Vite may pick an alternate port)
const allowedOrigins = process.env.NODE_ENV !== 'production'
  ? [/^http:\/\/localhost(?::\d+)?$/]
  : [`http://localhost:${FRONTEND_PORT}`];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// (La lógica de montaje de /admin se realiza más abajo en la fase de bootstrap)

// -----------------------------------------------------------------------------
// Logger simple para /api con captura de res.json
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    // @ts-expect-error - mantener la firma original de express
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          // ignora si no se puede serializar
        }
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + '…';
      log(logLine);
    }
  });

  next();
});

// -----------------------------------------------------------------------------
// Swagger UI
// -----------------------------------------------------------------------------
// Swagger UI: evitar mismatch de tipos entre distintas copias de @types/express casteando
app.use(
  '/api-docs',
  (swaggerUi as any).serve,
  (swaggerUi as any).setup(swaggerSpec, {
    customSiteTitle: 'AppleAura API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  })
);

// JSON de la especificación
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// -----------------------------------------------------------------------------
// Bootstrap asíncrono
// -----------------------------------------------------------------------------
(async () => {
  // Poblar base de datos si se indica
  if (process.env.SEED_DB === 'true') {
    await seedDatabase();
  }

  // Registra rutas de API (debe devolver un http.Server o similar)
  const server = await registerRoutes(app);

  // Manejo centralizado de errores después de montar rutas
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || 'Internal Server Error';
    res.status(status).json({ message });
    // Re-emite para que se vea en consola durante desarrollo
    if (app.get('env') === 'development') {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });

  // En desarrollo: solo API; en producción: estáticos
  // En producción podrías servir estáticos aquí si lo necesitas
  // Montar admin UI de forma robusta usando la ruta del fichero actual
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const candidates = [
      path.resolve(process.cwd(), 'server', 'admin'),
      path.resolve(process.cwd(), 'admin'),
      path.resolve(__dirname, 'admin'),
      path.resolve(__dirname, '..', 'server', 'admin'),
      path.resolve(__dirname, '..', 'admin'),
    ];

    let adminPath: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        adminPath = c;
        break;
      }
    }

    if (adminPath) {
      app.use('/admin', express.static(adminPath));
      app.get('/admin', (_req, res) => res.sendFile(path.join(adminPath!, 'index.html')));
      log(`Admin UI servida en /admin desde ${adminPath}`);
    } else {
      log('Admin UI no encontrada. Rutas comprobadas:\n' + candidates.join('\n'));
    }
  } catch (e) {
    log('Error montando /admin: ' + String(e));
  }

  // ---------------------------------------------------------------------------
  // ¡IMPORTANTE! Escuchar en HOST/PORT (no usar 0.0.0.0 en Windows)
  // Node.js soporta server.listen(port, host, cb) de forma estándar.
  // ---------------------------------------------------------------------------
  // Manejar errores de bind (p. ej. EADDRINUSE) para dar instrucciones al desarrollador
  server.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE') {
      log(`ERROR: puerto ${PORT} ya está en uso (EADDRINUSE).`);
      log(`Sugerencia: encuentra y mata el proceso o usa 'npx kill-port ${PORT}' o cambia PORT en .env`);
      // Salir con código distinto a 0 para indicar fallo de inicio
      process.exit(1);
    }
    // Si es otro error, loguearlo y salir
    log('Error del servidor: ' + String(err));
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    log(`Servidor escuchando en http://${HOST}:${PORT}`);
  });
})();
