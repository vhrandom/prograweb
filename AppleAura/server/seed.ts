import { storage } from "./storage";
import bcrypt from "bcrypt";

const SAMPLE_IMAGES = [
  "/images/products/macbook-pro-14.svg", // MacBook
  "/images/products/iphone-15-pro-max.svg", // iPhone
  "/images/products/ipad-pro-129.svg", // iPad
  "/images/products/airpods-pro.svg", // AirPods
  "/images/products/apple-watch-s9.svg", // Apple Watch
  "/images/products/macbook-pro-14.svg", // MacBook Pro
  "/images/products/iphone-15-pro-max.svg", // iPhone 12
  "/images/products/imac-24.svg", // iMac
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

    // 2. Crear usuarios de prueba con credenciales específicas
    const buyer = await storage.createUser({
      email: "comprador@appleaura.com",
      passwordHash: await bcrypt.hash("Buyer2024!", 10),
      name: "María González",
      role: "buyer"
    });

    // Vendedor
    const seller = await storage.createUser({
      email: "vendedor@appleaura.com",
      passwordHash: await bcrypt.hash("Seller2024!", 10),
      name: "Carlos Mendoza",
      role: "seller"
    });

    // Administrador
    const admin = await storage.createUser({
      email: "admin@appleaura.com",
      passwordHash: await bcrypt.hash("Admin2024!", 10),
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
        title: "MacBook Pro 14 pulgadas",
        description: "La laptop más potente de Apple con chip M3 Pro para profesionales creativos",
        categoryId: categories[1].id, // Laptops
        sellerId: sellerProfile.id,
        images: [SAMPLE_IMAGES[0]],
        status: "active" as const,
        specsJson: { processor: "M3 Pro", memory: "18GB", storage: "512GB SSD" }
      },
      {
        title: "iPhone 15 Pro Max",
        description: "El iPhone más avanzado con cámara de 48MP y titanio aeroespacial",
        categoryId: categories[0].id, // Smartphones
        sellerId: sellerProfile.id,
        images: [SAMPLE_IMAGES[1]],
        status: "active" as const,
        specsJson: { storage: "256GB", camera: "48MP", material: "Titanio" }
      },
      {
        title: "iPad Pro 12.9 pulgadas",
        description: "La tablet más poderosa con chip M2 y pantalla Liquid Retina XDR",
        categoryId: categories[2].id, // Tablets
        sellerId: sellerProfile.id,
        images: [SAMPLE_IMAGES[2]],
        status: "active" as const,
        specsJson: { processor: "M2", screen: "12.9 Liquid Retina XDR", storage: "128GB" }
      },
      {
        title: "AirPods Pro (2da generación)",
        description: "Audífonos premium con cancelación activa de ruido y audio espacial",
        categoryId: categories[3].id, // Audio
        sellerId: sellerProfile.id,
        images: [SAMPLE_IMAGES[3]],
        status: "active" as const,
        specsJson: { battery: "6 horas", features: "Cancelación de ruido, Audio espacial" }
      },
      {
        title: "Apple Watch Series 9",
        description: "El reloj inteligente más avanzado con GPS y monitoreo de salud",
        categoryId: categories[4].id, // Smartwatch
        sellerId: sellerProfile.id,
        images: [SAMPLE_IMAGES[4]],
        status: "active" as const,
        specsJson: { size: "45mm", connectivity: "GPS + Cellular", battery: "18 horas" }
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await storage.createProduct(productData);
      createdProducts.push(product);
      
      // Crear variante para cada producto
      await storage.createVariant({
        productId: product.id,
        sku: `${product.id}-DEFAULT`,
        priceCents: Math.floor(Math.random() * 2000000) + 500000, // Entre $500k y $2.5M CLP
        currency: "CLP",
        attributesJson: { color: "Space Gray", size: "Standard" }
      });
    }

    console.log(`✅ Base de datos poblada exitosamente:`);
    console.log(`   👥 ${3} usuarios creados`);
    console.log(`   📁 ${categories.length} categorías creadas`);
    console.log(`   🏪 ${1} perfil de vendedor creado`);
    console.log(`   📦 ${createdProducts.length} productos creados`);
    console.log(`   💰 ${createdProducts.length} variantes de precio creadas`);
    console.log(`\n🔑 Credenciales de acceso creadas en credentials.md`);
    
  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🌱 Proceso de poblado completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error durante el poblado:", error);
      process.exit(1);
    });
}",
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
    console.log("- 3 usuarios creados");
    console.log(`- ${products.length} productos creados`);

    console.log("\n🔐 CREDENCIALES DE LOGIN:");
    console.log("👑 ADMINISTRADOR:");
    console.log("   Email: admin@appleaura.com");
    console.log("   Password: Admin2024!");
    console.log("\n💼 VENDEDOR:");
    console.log("   Email: vendedor@appleaura.com");
    console.log("   Password: Seller2024!");
    console.log("\n🛍️ COMPRADOR:");
    console.log("   Email: comprador@appleaura.com");
    console.log("   Password: Buyer2024!");
    console.log("\n🚀 Para iniciar la app, ejecuta: npm run dev");

  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };