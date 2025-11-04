import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { User, InsertUser, SellerProfile, InsertSellerProfile, Category, Product, InsertProduct, ProductVariant, InsertProductVariant, Order, InsertOrder, OrderItem, Review, InsertReview, CartItem } from "../shared/schema";
import { connectMongo } from "./mongo-connection";

// Define un tipo base que esperamos de Mongo
type MongoDoc = { id?: string, _id?: ObjectId };

export class DatabaseStorage implements IStorage {

  /**
   * Normaliza un documento de Mongo para asegurar que tenga un campo 'id' (string)
   * compatible con la app, usando '_id' como fallback si 'id' falta.
   */
  private _normalize<T extends MongoDoc>(doc: T | null | undefined): T | undefined {
    if (doc && !doc.id && doc._id) {
      doc.id = doc._id.toString();
    }
    return doc ?? undefined;
  }

  /**
   * Normaliza un array de documentos.
   */
  private _normalizeArray<T extends MongoDoc>(docs: T[]): T[] {
    return docs.map(doc => this._normalize(doc)).filter(Boolean) as T[];
  }

  /**
   * Helper privado para buscar por 'id' (string) o '_id' (ObjectId)
   * y normalizar la salida.
   */
  private async _findById<T extends MongoDoc>(
    collection: Collection<T>,
    id: string
  ): Promise<T | undefined> {
    if (!id || typeof id !== 'string') return undefined;

    // 1. Intentar buscar por el 'id' string (preferido por la app)
    let doc = await collection.findOne({ id: id } as any);

    // 2. Fallback: Si no se encuentra Y el 'id' es un ObjectId válido, búscalo por '_id'.
    if (!doc && ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) } as any);
    }

    // 3. Normalizar el documento (asegura que doc.id exista)
    return this._normalize(doc);
  }

  // USERS
  async getUser(id: string): Promise<User | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<User>("users"), id);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await connectMongo();
    const user = await db.collection<User>("users").findOne({ email });
    return this._normalize(user);
  }
  async createUser(user: InsertUser): Promise<User> {
    const db = await connectMongo();
    const doc = { ...user, id: user.id || new ObjectId().toString() };
    await db.collection<User>("users").insertOne(doc);
    return doc as User;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const db = await connectMongo();
    const collection = db.collection<User>("users");
    // Usamos el helper para encontrar el doc por cualquier ID
    const doc = await this._findById(collection, id);
    if (!doc) return undefined;
    
    // Usamos el _id real para la actualización
    await collection.updateOne({ _id: doc._id }, { $set: updates });
    return this._findById(collection, id);
  }

  // SELLER PROFILES
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const db = await connectMongo();
    const profile = await db.collection<SellerProfile>("seller_profiles").findOne({ userId });
    return this._normalize(profile);
  }
  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const db = await connectMongo();
    const doc = { ...profile, id: profile.id || new ObjectId().toString() };
    await db.collection<SellerProfile>("seller_profiles").insertOne(doc);
    return doc as SellerProfile;
  }
  // (updateSellerProfile se omitió por brevedad, aplicar misma lógica de updateUser)

  

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    const db = await connectMongo();
    const categories = await db.collection<Category>("categories").find().toArray();
    return this._normalizeArray(categories);
  }
  async getCategoryById(id: string): Promise<Category | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<Category>("categories"), id);
  }
  async createCategory(category: { name: string; description?: string; icon?: string; parentId?: string }): Promise<Category> {
    const db = await connectMongo();
    const doc = { ...category, id: new ObjectId().toString() };
    await db.collection<Category>("categories").insertOne(doc);
    return doc as Category;
  }

  // PRODUCTS
  async getProducts(filters?: any): Promise<Product[]> {
    const db = await connectMongo();
    const collection = db.collection<Product>("products");
    
    const query: any = {};
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
    if (filters?.category) {
      query.categoryId = filters.category;
    }
    if (filters?.sellerId) {
      query.sellerId = filters.sellerId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const products = await collection.aggregate([
      { $match: query }, 
      {
        $lookup: { 
          from: "product_variants", 
          localField: "id",          
          foreignField: "productId", 
          as: "variants"           
        }
      },
      {
        $addFields: {
          firstVariant: { $first: "$variants" }, 
        }
      },
      {
        $addFields: {
          // --- ¡AQUÍ ESTÁ LA NUEVA LÍNEA! ---
          variantId: "$firstVariant.id", // <-- Promueve el ID de la variante
          price: "$firstVariant.priceCents", 
          stock: "$firstVariant.stock",
          sku: "$firstVariant.sku"
        }
      },
      {
        $project: {
          variants: 0,
          firstVariant: 0
        }
      }
    ]).toArray();

    return this._normalizeArray(products as Product[]);
  }
  async getProductById(id: string): Promise<Product | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<Product>("products"), id);
  }
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const db = await connectMongo();
    const product = await db.collection<Product>("products").findOne({ slug });
    return this._normalize(product);
  }
  async createProduct(
    productData: InsertProduct, 
    variantData: { priceCents: number, sku: string, stock: number }
  ): Promise<Product> {
    
    const db = await connectMongo();
    
    // 1. Crear el documento base del Producto
    const productDoc = { 
      ...productData, 
      id: productData.id || new ObjectId().toString() 
    };
    await db.collection<Product>("products").insertOne(productDoc);

    // 2. Crear la primera Variante usando el ID del producto
    //    (Asumimos una moneda por defecto, ajústala si es necesario)
    const newVariant: InsertProductVariant = {
      productId: productDoc.id, // <-- Enlaza al producto
      priceCents: variantData.priceCents,
      sku: variantData.sku,
      stock: variantData.stock,
      currency: "CLP", // O tómalo del frontend si es variable
      attributesJson: {}
    };

    // 3. Llama a tu función createVariant existente
    await this.createVariant(newVariant);

    // 4. Devuelve el Producto principal que se creó
    return productDoc as Product;
  }


  

  // updateProduct 
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const db = await connectMongo();
    const collection = db.collection<Product>("products");
    
    // 1. Encontrar el documento usando tu helper
    const doc = await this._findById(collection, id);
    if (!doc) return undefined;

    // 2. Quitar 'id' y '_id' de los updates por si acaso
    delete updates.id;
    delete (updates as any)._id;
    
    // 3. Usar el _id real para la actualización
    await collection.updateOne({ _id: doc._id }, { $set: updates });

    // 4. Devolver el documento actualizado y normalizado
    return this._findById(collection, id);
  } 

  async deleteProduct(id: string): Promise<void> {
    const db = await connectMongo();
    // (Esta lógica está bien, asume 'id' string)
    await db.collection("product_variants").deleteMany({ productId: id });
    await db.collection("products").deleteOne({ id });
  }

  // PRODUCT VARIANTS
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const db = await connectMongo();
    const variants = await db.collection<ProductVariant>("product_variants").find({ productId }).toArray();
    return this._normalizeArray(variants);
  }
  async getVariantById(id: string): Promise<ProductVariant | undefined> {
    const db = await connectMongo();
    return this._findById(db.collection<ProductVariant>("product_variants"), id);
  }
  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const db = await connectMongo();
    const doc = { ...variant, id: variant.id || new ObjectId().toString() };
    await db.collection<ProductVariant>("product_variants").insertOne(doc);
    return doc as ProductVariant;
  }





  async getSellerStats(sellerId: string): Promise<any> {
    const db = await connectMongo();
    const productCollection = db.collection<Product>("products");
    const orderCollection = db.collection<Order>("orders");

    // Hacemos las 4 consultas en paralelo para mayor eficiencia
    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      revenueResult
    ] = await Promise.all([

      // 1. Total Productos
      productCollection.countDocuments({ sellerId }),

      // 2. Órdenes Totales
      orderCollection.countDocuments({ sellerId }),

      // 3. Órdenes Pendientes
      // (Asumimos que el estado se llama 'pending')
      orderCollection.countDocuments({ sellerId, status: "pending" }),

      // 4. Ingresos Totales (Usando un pipeline de agregación)
      // (Asumimos que solo contamos órdenes 'delivered' y el campo es 'total')
      orderCollection.aggregate([
        { 
          $match: { 
            sellerId: sellerId,
            status: "delivered" 
          } 
        },
        { 
          $group: { 
            _id: null, // Agrupar todos los resultados
            totalRevenue: { $sum: "$total" } // Sumar el campo 'total'
          } 
        }
      ]).toArray()
      
    ]);

    // Extraemos el valor de la agregación (viene en un array)
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue 
    };
  }



  // (Orders y Reviews omitidos por brevedad)
  async getOrdersBySellerId(sellerId: string): Promise<Order[]> {
    const db = await connectMongo();
    // Asumimos que la colección 'orders' tiene un campo 'sellerId'
    const orders = await db.collection<Order>("orders").find({ sellerId }).sort({ createdAt: -1 }).toArray();
    return this._normalizeArray(orders);
  }

  // CART (La parte más importante)
  async getCartByUserId(userId: string): Promise<CartItem[]> {
    const db = await connectMongo();
    const cartItems = await db.collection<CartItem>("cart_items").find({ userId }).toArray();

    // Enriquecer los datos
    const enrichedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        
        // --- INICIO DE LA CORRECCIÓN ---
        // Ahora usamos las funciones del storage (que tienen el fallback)
        const variant = await this.getVariantById(item.variantId);
        const product = variant ? await this.getProductById(variant.productId) : null;
        // --- FIN DE LA CORRECCIÓN ---

        const sku = variant?.sku || item.variantId;
        const productName = product?.title || `Producto ${item.variantId.substring(0, 8)}`;

        return {
          ...item,
          // Normalizamos los datos que vio el frontend
          productName: productName,
          sku: sku,
          productPrice: variant ? variant.priceCents : 0,
          productCurrency: variant?.currency || "USD",
          productImage: product?.images?.[0] || "placeholder.jpg",
        };
      })
    );

    return enrichedCartItems;
  }
  
  // (Resto de funciones del carrito omitidas)
  async addToCart(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne(
      { userId, variantId },
      { $inc: { quantity } },
      { upsert: true }
    );
  }
  async updateCartItem(userId: string, variantId: string, quantity: number): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").updateOne(
      { userId, variantId },
      { $set: { quantity } }
    );
  }
  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteOne({ userId, variantId });
  }
  async clearCart(userId: string): Promise<void> {
    const db = await connectMongo();
    await db.collection<CartItem>("cart_items").deleteMany({ userId });
  }
}

export const storage = new DatabaseStorage();