
import { storage } from "./storage";
import bcrypt from "bcrypt";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // MacBook
  "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // iPhone
  "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // iPad
  "https://images.unsplash.com/photo-1625842268584-8f3296236761?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // AirPods
  "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // Apple Watch
  "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // MacBook Pro
  "https://images.unsplash.com/photo-1585060544812-6b45742d762f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // iPhone 12
  "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", // iMac
];

async function seedDatabase() {
  console.log("🌱 Iniciando proceso de poblado de base de datos...");

  try {
    // 1. Crear categorías
    console.log("📱 Creando categorías...");
    const categories = await Promise.all([
      storage.createCategory({ name: "Smartphones", description: "Teléfonos inteligentes de última generación", icon: "📱" }),
      storage.createCategory({ name: "Laptops", description: "Computadoras portátiles", icon: "💻" }),
      storage.createCategory({ name: "Tablets", description: "Tabletas y iPads", icon: "📱" }),
      storage.createCategory({ name: "Audio", description: "Audífonos y accesorios de audio", icon: "🎧" }),
      storage.createCategory({ name: "Smartwatch", description: "Relojes inteligentes", icon: "⌚" }),
    ]);

    // 2. Crear usuarios de prueba
    console.log("👤 Creando usuarios de prueba...");
    
    // Comprador
    const buyer = await storage.createUser({
      email: "comprador@silicontrail.com",
      passwordHash: await bcrypt.hash("comprador123", 10),
      name: "María González",
      role: "buyer"
    });

    // Vendedor
    const seller = await storage.createUser({
      email: "vendedor@silicontrail.com",
      passwordHash: await bcrypt.hash("vendedor123", 10),
      name: "Carlos Mendoza",
      role: "seller"
    });

    // Administrador
    const admin = await storage.createUser({
      email: "admin@silicontrail.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Ana Rodríguez",
      role: "admin"
    });

    // 3. Crear perfil de vendedor
    console.log("🏪 Creando perfil de vendedor...");
    const sellerProfile = await storage.createSellerProfile({
      userId: seller.id,
      displayName: "TechStore Chile",
      description: "Tu tienda de confianza para productos Apple y tecnología de calidad",
      status: "verified"
    });

    // 4. Crear productos de ejemplo
    console.log("📦 Creando productos de ejemplo...");
    const products = [
      {
        title: "iPhone 15 Pro Max",
        description: "El iPhone más avanzado hasta ahora. Con chip A17 Pro, sistema de cámaras Pro y diseño en titanio.",
        categoryId: categories[0].id,
        images: [SAMPLE_IMAGES[1], SAMPLE_IMAGES[6]],
        price: 1299990,
        sku: "IPH15PM-256-TB"
      },
      {
        title: "MacBook Pro 14\" M3",
        description: "Portátil profesional con chip M3, pantalla Liquid Retina XDR y hasta 22 horas de batería.",
        categoryId: categories[1].id,
        images: [SAMPLE_IMAGES[0], SAMPLE_IMAGES[5]],
        price: 2199990,
        sku: "MBP14-M3-512-SG"
      },
      {
        title: "iPad Pro 12.9\" M2",
        description: "La experiencia iPad definitiva con chip M2, pantalla Liquid Retina XDR y compatibilidad con Apple Pencil.",
        categoryId: categories[2].id,
        images: [SAMPLE_IMAGES[2]],
        price: 1349990,
        sku: "IPD129-M2-256-SG"
      },
      {
        title: "AirPods Pro (3ª generación)",
        description: "Cancelación activa de ruido, audio espacial personalizado y hasta 6 horas de reproducción.",
        categoryId: categories[3].id,
        images: [SAMPLE_IMAGES[3]],
        price: 279990,
        sku: "APP3-WHT"
      },
      {
        title: "Apple Watch Series 9",
        description: "El smartwatch más avanzado de Apple con chip S9, pantalla Always-On más brillante.",
        categoryId: categories[4].id,
        images: [SAMPLE_IMAGES[4]],
        price: 449990,
        sku: "AWS9-45-GPS-MN"
      },
      {
        title: "iMac 24\" M3",
        description: "Todo en uno elegante con chip M3, pantalla 4.5K Retina y diseño ultradelgado.",
        categoryId: categories[1].id,
        images: [SAMPLE_IMAGES[7]],
        price: 1799990,
        sku: "IMC24-M3-256-BL"
      }
    ];

    for (const productData of products) {
      const product = await storage.createProduct({
        sellerId: sellerProfile.id,
        categoryId: productData.categoryId,
        title: productData.title,
        description: productData.description,
        images: productData.images,
        status: "active"
      });

      // Crear variante del producto
      await storage.createProductVariant({
        productId: product.id,
        sku: productData.sku,
        priceCents: productData.price,
        currency: "CLP",
        attributesJson: { color: "Default", storage: "256GB" }
      });
    }

    // 5. Crear algunas reseñas de ejemplo
    console.log("⭐ Creando reseñas de ejemplo...");
    const allProducts = await storage.getProducts({});
    for (const product of allProducts.slice(0, 3)) {
      await storage.createReview({
        userId: buyer.id,
        productId: product.id,
        rating: 5,
        comment: "Excelente producto, muy recomendado. Llegó en perfectas condiciones y funciona increíble."
      });
    }

    console.log("✅ ¡Base de datos poblada exitosamente!");
    console.log("\n🔑 CREDENCIALES DE ACCESO:");
    console.log("==========================================");
    console.log("👤 COMPRADOR:");
    console.log("   Email: comprador@silicontrail.com");
    console.log("   Contraseña: comprador123");
    console.log("\n🏪 VENDEDOR:");
    console.log("   Email: vendedor@silicontrail.com");
    console.log("   Contraseña: vendedor123");
    console.log("\n👑 ADMINISTRADOR:");
    console.log("   Email: admin@silicontrail.com");
    console.log("   Contraseña: admin123");
    console.log("==========================================");

  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
