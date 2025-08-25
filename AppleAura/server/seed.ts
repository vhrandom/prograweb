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
}

export { seedDatabase };