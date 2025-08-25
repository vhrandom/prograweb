# Silicon Trail - Marketplace Tecnológico

## Descripción del Proyecto
Silicon Trail es un marketplace vertical de tecnología con diseño inspirado en Apple Human Interface Guidelines, que ofrece una experiencia unificada para compradores, vendedores y administradores.

## Características Principales
- **Autenticación Unificada Multi-Rol**: Registro/login único con selección de rol (comprador/vendedor)
- **Tres Vistas Principales**: Comprador (default), Vendedor, Administrador
- **Diseño Apple HIG**: Claridad, deferencia, profundidad
- **Modo Oscuro**: Opcional, siguiendo patrones de Apple
- **Arquitectura Separada**: Frontend y Backend en carpetas independientes

## Arquitectura del Proyecto
```
/
├── client/            # Frontend - React/TypeScript/Tailwind
├── server/            # Backend - Express/PostgreSQL/Drizzle
├── shared/            # Esquemas compartidos entre frontend y backend
├── frontend/          # Documentación organizacional del frontend
└── backend/           # Documentación organizacional del backend
```

### Estructura Física vs Conceptual
- **Frontend**: Archivos físicos en `client/` (limitación de configuración Replit)
- **Backend**: Archivos físicos en `server/` (limitación de configuración Replit)  
- **Carpetas `frontend/` y `backend/`**: Documentación organizacional conceptual

## Especificaciones Técnicas

### Ficha de Producto
- Foto del producto
- Nombre del producto
- Precio
- Estado de stock (en stock/pocos disponibles/agotado)
- Ciudad del vendedor (Chile)
- Envío gratis (si aplica)
- Nombre del vendedor
- Calificación por estrellas basada en reseñas

### Roles de Usuario
1. **Comprador** (vista por defecto)
   - Explorar catálogo
   - Gestionar carrito
   - Realizar compras
   - Escribir reseñas

2. **Vendedor**
   - Gestionar productos
   - Ver órdenes
   - Métricas de ventas
   - Gestión de stock

3. **Administrador**
   - Gestión de categorías
   - Moderación
   - Reportes y métricas
   - Gestión de usuarios

## Preferencias del Usuario
- Marketplace enfocado en Chile
- Información detallada en fichas de producto
- Interface limpia siguiendo Apple HIG
- Estructura modular y mantenible

## Cambios Recientes
- Creación inicial del proyecto (Agosto 19, 2025)
- Definición de arquitectura separada frontend/backend
- Especificaciones de ficha de producto detalladas