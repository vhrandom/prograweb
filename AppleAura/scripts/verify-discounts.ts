
import { storage } from "../server/storage";
import { connectMongo } from "../server/mongo-connection";

async function verifyDiscounts() {
    try {
        console.log("Connecting to DB...");
        await connectMongo();

        // 1. Create a dummy seller profile if needed (or use existing)
        // For simplicity, we'll just use a dummy ID
        const sellerId = "dummy-seller-123";

        // 2. Create a product WITH discount
        console.log("Creating product with discount...");
        const productWithDiscount = await storage.createProduct({
            sellerId,
            categoryId: "test-category",
            title: "Discounted Product",
            slug: "discounted-product-" + Date.now(),
            description: "This product has a discount",
            images: [],
            status: "active"
        }, {
            priceCents: 10000,
            sku: "DISC-001",
            stock: 10,
            discountPercentage: 20 // 20% OFF
        });
        console.log("Created product:", productWithDiscount.id);

        // 3. Create a product WITHOUT discount
        console.log("Creating product without discount...");
        const productNoDiscount = await storage.createProduct({
            sellerId,
            categoryId: "test-category",
            title: "Regular Product",
            slug: "regular-product-" + Date.now(),
            description: "This product has NO discount",
            images: [],
            status: "active"
        }, {
            priceCents: 10000,
            sku: "REG-001",
            stock: 10
        });
        console.log("Created product:", productNoDiscount.id);

        // 4. Fetch products with hasDiscount=true
        console.log("Fetching products with hasDiscount=true...");
        const discountedProducts = await storage.getProducts({ hasDiscount: true });
        console.log("Found discounted products:", discountedProducts.length);

        const foundDiscounted = discountedProducts.find(p => p.id === productWithDiscount.id);
        const foundRegular = discountedProducts.find(p => p.id === productNoDiscount.id);

        if (foundDiscounted && !foundRegular) {
            console.log("SUCCESS: Filter correctly returned discounted product and excluded regular one.");
        } else {
            console.error("FAILURE: Filter returned unexpected results.");
            console.log("Discounted found:", !!foundDiscounted);
            console.log("Regular found:", !!foundRegular);
        }

        // Cleanup
        console.log("Cleaning up...");
        await storage.deleteProduct(productWithDiscount.id);
        await storage.deleteProduct(productNoDiscount.id);

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        process.exit(0);
    }
}

verifyDiscounts();
