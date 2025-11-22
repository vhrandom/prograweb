import "dotenv/config";
import { storage } from "./storage";

async function run() {
    try {
        console.log("Calling storage.getProducts...");
        const products = await storage.getProducts({ limit: 1 });
        if (products.length > 0) {
            const p = products[0];
            console.log("Product found:", p.title);
            if (p.variants && p.variants.length > 0) {
                console.log("Variants found:", p.variants.length);
                console.log("First variant price:", p.variants[0].priceCents);
            } else {
                console.log("NO VARIANTS FOUND!");
            }
        } else {
            console.log("No products found.");
        }
    } catch (e) {
        console.error("Error in getProducts:");
        console.error(e);
    }
    process.exit(0);
}

run();
