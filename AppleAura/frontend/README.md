# Frontend - Silicon Trail

Esta carpeta representa conceptualmente el frontend del marketplace Silicon Trail. 

## Ubicación Real de los Archivos

Debido a limitaciones de configuración del entorno Replit, los archivos del frontend se encuentran físicamente en la carpeta `client/` en la raíz del proyecto.

### Estructura del Frontend:
```
client/
├── src/
│   ├── components/     # Componentes React reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── hooks/         # Hooks personalizados
│   ├── lib/           # Utilidades y configuración
│   ├── App.tsx        # Componente principal
│   ├── main.tsx       # Punto de entrada
│   └── index.css      # Estilos globales
├── index.html         # Template HTML
└── ...

```

### Tecnologías Utilizadas:
- **React 18** con TypeScript
- **Wouter** para routing
- **Tailwind CSS** + **shadcn/ui** para estilos
- **TanStack Query** para manejo de estado servidor
- **Apple Human Interface Guidelines** como base del diseño

### Características del Frontend:
- ✅ Diseño Apple HIG con modo oscuro
- ✅ Autenticación unificada multi-rol
- ✅ Catálogo de productos con filtros
- ✅ Carrito de compras funcional
- ✅ Dashboard para vendedores
- ✅ Panel administrativo
- ✅ Responsive design