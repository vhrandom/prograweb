import { storage } from "./storage";
import bcrypt from "bcrypt";
import { InsertProduct } from "../shared/schema"; // Importar el tipo

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
    // 1. Crear categorías - idempotente
    console.log("📱 Creando categorías (si no existen)...");
    const existingCategories = await storage.getCategories();

    const desired = [
      { name: "Smartphones", description: "Teléfonos inteligentes de última generación", icon: "📱" },
      { name: "Laptops", description: "Computadoras portátiles", icon: "💻" },
      { name: "Tablets", description: "Tabletas y iPads", icon: "📱" },
      { name: "Audio", description: "Audífonos y accesorios de audio", icon: "🎧" },
      { name: "Smartwatch", description: "Relojes inteligentes", icon: "⌚" },
    ];

    const categories: any[] = [];
    for (const item of desired) {
      const found = existingCategories.find((c) => c.name.toLowerCase() === item.name.toLowerCase());
      if (found) {
        categories.push(found);
      } else {
        const created = await storage.createCategory({ name: item.name, description: item.description, icon: item.icon });
        categories.push(created);
      }
    }

    // 2. Crear usuarios de prueba (idempotente)
    let buyer = await storage.getUserByEmail("comprador@appleaura.com");
    if (!buyer) {
      buyer = await storage.createUser({
        email: "comprador@appleaura.com",
        passwordHash: await bcrypt.hash("Buyer2024!", 10),
        name: "María González",
        role: "buyer"
      });
    }

    let seller = await storage.getUserByEmail("vendedor@appleaura.com");
    if (!seller) {
      seller = await storage.createUser({
        email: "vendedor@appleaura.com",
        passwordHash: await bcrypt.hash("Seller2024!", 10),
        name: "Carlos Mendoza",
        role: "seller"
      });
    }

    let admin = await storage.getUserByEmail("admin@appleaura.com");
    if (!admin) {
      admin = await storage.createUser({
        email: "admin@appleaura.com",
        passwordHash: await bcrypt.hash("Admin2024!", 10),
        name: "Ana Rodríguez",
        role: "admin"
      });
    }

    // 3. Crear perfil de vendedor (idempotente)
    console.log("🏪 Creando perfil de vendedor...");
    let sellerProfile = await storage.getSellerProfile(seller.id);
    if (!sellerProfile) {
      sellerProfile = await storage.createSellerProfile({
        userId: seller.id,
        displayName: "TechStore Chile",
        description: "Tu tienda de confianza para productos Apple y tecnología de calidad",
        status: "verified"
      });
    }

    // 4. Crear productos de ejemplo
    console.log("📦 Creando productos de ejemplo...");
    const products = [
      {
        title: "MacBook Pro 14 pulgadas",
        description: "La laptop más potente de Apple con chip M3 Pro para profesionales creativos",
        categoryId: categories[1].id, // Laptops
        images: [SAMPLE_IMAGES[0]],
        status: "active" as const,
        specsJson: { processor: "M3 Pro", memory: "18GB", storage: "512GB SSD" }
      },
      {
        title: "iPhone 15 Pro Max",
        description: "El iPhone más avanzado con cámara de 48MP y titanio aeroespacial",
        categoryId: categories[0].id, // Smartphones
        images: [SAMPLE_IMAGES[1]],
        status: "active" as const,
        specsJson: { storage: "256GB", camera: "48MP", material: "Titanio" }
      },
      {
        title: "iPad Pro 12.9 pulgadas",
        description: "La tablet más poderosa con chip M2 y pantalla Liquid Retina XDR",
        categoryId: categories[2].id, // Tablets
        images: [SAMPLE_IMAGES[2]],
        status: "active" as const,
        specsJson: { processor: "M2", screen: "12.9 Liquid Retina XDR", storage: "128GB" }
      },
      {
        title: "AirPods Pro (2da generación)",
        description: "Audífonos premium con cancelación activa de ruido y audio espacial",
        categoryId: categories[3].id, // Audio
        images: [SAMPLE_IMAGES[3]],
        status: "active" as const,
        specsJson: { battery: "6 horas", features: "Cancelación de ruido, Audio espacial" }
      },
      {
        title: "Apple Watch Series 9",
        description: "El reloj inteligente más avanzado con GPS y monitoreo de salud",
        categoryId: categories[4].id, // Smartwatch
        images: [SAMPLE_IMAGES[4]],
        status: "active" as const,
        specsJson: { size: "45mm", connectivity: "GPS + Cellular", battery: "18 horas" }
      }
    ];

    const createdProducts = [];
    
    // --- BUCLE CORREGIDO ---
    for (const productBaseData of products) {
      const slug = productBaseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let product = await storage.getProductBySlug(slug);

      if (!product) {
        
        // 1. Prepara los datos del PRODUCTO (lo que va en la colección 'products')
        const productData: InsertProduct = {
          ...productBaseData,
          sellerId: sellerProfile.id, // Añade el sellerId
          slug: slug
        };

        // 2. Prepara los datos de la VARIANTE (lo que va en 'product_variants')
        const variantData = {
          sku: `${slug.substring(0, 10).toUpperCase()}-DEF`, // Un SKU de ejemplo
          priceCents: Math.floor(Math.random() * 2000000) + 500000, // Precio aleatorio
          stock: Math.floor(Math.random() * 50) + 10 // Stock aleatorio
        };

        // 3. Llama a 'createProduct' con AMBOS argumentos
        product = await storage.createProduct(productData, variantData);
        createdProducts.push(product);
        
      } else {
        createdProducts.push(product);
      }

      // 4. El bloque 'createVariant' que tenías aquí
      //    ya no es necesario, porque 'createProduct' lo hace por ti.
    }
    // --- FIN DEL BUCLE CORREGIDO ---

    console.log(`✅ Base de datos poblada exitosamente:`);
    console.log(`   👥 ${3} usuarios creados`);
    console.log(`   📁 ${categories.length} categorías creadas`);
    console.log(`   🏪 ${1} perfil de vendedor creado`);
    console.log(`   📦 ${createdProducts.length} productos creados (con sus variantes)`);
    console.log(`\n🔑 Credenciales de acceso creadas en credentials.md`);

  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error);
  }
}

// Esta parte no cambia
if (import.meta.url === `file://${process.argv[1]}`) {
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