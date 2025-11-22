import "dotenv/config";
import { storage } from "./storage";

async function run() {
    try {
        console.log("--- DEBUGGING PRODUCT FIXES ---");

        // 1. Fetch all products to get a sample
        console.log("\n1. Fetching all products...");
        const products = await storage.getProducts({ limit: 5 });
        if (products.length === 0) {
            console.log("No products found.");
            process.exit(0);
        }
        const sampleProduct = products[0];
        console.log(`Sample Product: ${sampleProduct.title} (ID: ${sampleProduct.id})`);
        console.log(`Seller Name (Hydrated): ${sampleProduct.seller?.displayName}`);
        console.log(`Seller Name (Root): ${sampleProduct.sellerName}`);
        console.log(`Rating: ${sampleProduct.rating} (Type: ${typeof sampleProduct.rating})`);

        // 2. Test getProductById
        console.log(`\n2. Testing getProductById(${sampleProduct.id})...`);
        const productById = await storage.getProductById(sampleProduct.id);
        if (productById) {
            console.log("SUCCESS: Product found by ID.");
        } else {
            console.log("FAILURE: Product NOT found by ID.");
        }

        // 3. Test getProductBySlug
        if (sampleProduct.slug) {
            console.log(`\n3. Testing getProductBySlug(${sampleProduct.slug})...`);
            const productBySlug = await storage.getProductBySlug(sampleProduct.slug);
            if (productBySlug) {
                console.log("SUCCESS: Product found by Slug.");
            } else {
                console.log("FAILURE: Product NOT found by Slug.");
            }
        }

        // 4. Test Sorting (Price Desc)
        console.log("\n4. Testing Sort (price_desc)...");
        const sortedProducts = await storage.getProducts({ sort: 'price_desc', limit: 3 });
        sortedProducts.forEach(p => {
            console.log(`- ${p.title}: ${p.price} (PriceCents: ${p.priceCents})`);
        });

    } catch (e) {
        console.error("Error in debug script:", e);
    }
    process.exit(0);
}

run();
