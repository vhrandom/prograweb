import "dotenv/config";
import { storage } from "./storage";
import { connectMongo } from "./mongo-connection";

async function run() {
    try {
        console.log("--- DEBUGGING FINAL FIXES ---");

        // 1. Check Seller Stats
        // We need a valid seller ID. Let's pick one from a product.
        const products = await storage.getProducts({ limit: 1 });
        if (products.length > 0) {
            const sellerId = products[0].sellerId;
            console.log(`\n1. Testing getSellerStats for sellerId: ${sellerId}`);
            const stats = await storage.getSellerStats(sellerId);
            console.log("Stats:", stats);
            if (stats.totalProducts !== undefined) {
                console.log("SUCCESS: totalProducts field is present.");
            } else {
                console.log("FAILURE: totalProducts field is MISSING.");
            }
        } else {
            console.log("\n1. No products found to test stats.");
        }

        // 2. Check Shipping Field
        console.log("\n2. Checking 'freeShipping' field in products...");
        if (products.length > 0) {
            const p = products[0] as any;
            console.log(`Product: ${p.title}`);
            console.log(`- freeShipping: ${p['freeShipping']}`);
            console.log(`- isFreeShipping: ${p['isFreeShipping']}`);
            console.log(`- shippingCost: ${p['shippingCost']}`);
            console.log(`- shippingCostCents: ${p['shippingCostCents']}`);
        }

        // 3. Check Review Ratings
        console.log("\n3. Checking Review Ratings types in MongoDB...");
        const db = await connectMongo();
        const reviews = await db.collection("reviews").find({}).limit(5).toArray();
        reviews.forEach(r => {
            console.log(`Review ID: ${r._id}, Rating: ${r.rating} (Type: ${typeof r.rating})`);
        });

    } catch (e) {
        console.error("Error in debug script:", e);
    }
    process.exit(0);
}

run();
