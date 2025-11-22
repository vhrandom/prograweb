# Backend - Silicon Trail

Esta carpeta representa conceptualmente el backend del marketplace Silicon Trail.

## Ubicación Real de los Archivos

Debido a limitaciones de configuración del entorno Replit, los archivos del backend se encuentran físicamente en la carpeta `server/` en la raíz del proyecto.

### Estructura del Backend:
```
server/
├── index.ts           # Servidor principal Express
├── routes.ts          # Rutas de API
├── storage.ts         # Capa de acceso a datos
└── vite.ts           # Configuración desarrollo

```

### Esquemas de Base de Datos:
Los esquemas se encuentran en `shared/schema.ts` para ser compartidos entre frontend y backend.

### Tecnologías Utilizadas:
- **Node.js** con TypeScript
- **Express.js** para el servidor web
- **PostgreSQL** con **Drizzle ORM** 
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas

### Características del Backend:
- ✅ API RESTful completa
- ✅ Autenticación JWT con roles
- ✅ Gestión de usuarios, productos y órdenes
- ✅ Sistema de reseñas y calificaciones
- ✅ Dashboard administrativo con métricas
- ✅ Validación de datos con Zod

### Endpoints Principales:
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/products` - Lista de productos
- `POST /api/products` - Crear producto (vendedor)
- `POST /api/cart/add` - Agregar al carrito
- `POST /api/orders` - Crear orden
- `GET /api/admin/*` - Endpoints administrativos