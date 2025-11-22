
import 'dotenv/config'; // carga variables de .env al arrancar

import express, { type Request, Response, NextFunction } from 'express';
// Trigger reload
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
// Configuración de HOST/PORT
// -----------------------------------------------------------------------------
const HOST = process.env.HOST?.trim() || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
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
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    return originalJson.call(this, body);
  };
  next();
});

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

  // Montar admin UI de forma robusta usando la ruta del fichero actual
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const adminBuildPath = path.join(__dirname, "../client/dist");

  if (fs.existsSync(adminBuildPath)) {
    app.use("/admin", express.static(adminBuildPath));
    app.get("/admin/*", (_req, res) => {
      res.sendFile(path.join(adminBuildPath, "index.html"));
    });
    log(`Admin UI servida en /admin desde ${adminBuildPath}`);
  } else {
    log(`Advertencia: La carpeta de build del admin UI no se encontró en ${adminBuildPath}. Asegúrate de ejecutar 'pnpm run build' en client/`);
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
// Force restart
