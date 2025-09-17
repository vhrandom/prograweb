// server/index.ts
import 'dotenv/config'; // carga variables de .env al arrancar

import express, { type Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { seedDatabase } from './seed';

// -----------------------------------------------------------------------------
// Configuración de HOST/PORT con fallback seguro para Windows
// -----------------------------------------------------------------------------
const HOST = process.env.HOST?.trim() || '127.0.0.1'; // evitar 0.0.0.0 en Windows
const PORT = Number(process.env.PORT || 5000);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
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

  // En desarrollo: Vite; en producción: estáticos
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ---------------------------------------------------------------------------
  // ¡IMPORTANTE! Escuchar en HOST/PORT (no usar 0.0.0.0 en Windows)
  // Node.js soporta server.listen(port, host, cb) de forma estándar.
  // ---------------------------------------------------------------------------
  server.listen(PORT, HOST, () => {
    log(`Servidor escuchando en http://${HOST}:${PORT}`);
  });
})();
