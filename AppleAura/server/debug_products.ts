import "dotenv/config";
import { storage } from "./storage";

async function run() {
    try {
        console.log("Calling storage.getProducts with full filters...");
        const filters = {
            categoryId: undefined,
            search: undefined,
            sellerId: undefined,
            status: undefined,
            limit: 20,
            offset: 0,
            minPrice: undefined,
            maxPrice: undefined,
            hasDiscount: false,
            brand: undefined,
            sort: undefined,
            priceRange: undefined,
        };
        const products = await storage.getProducts(filters);
        console.log("Products found:", products.length);
        if (products.length > 0) {
            console.log("First product:", JSON.stringify(products[0], null, 2));
        }
    } catch (e) {
        console.error("Error in getProducts:");
        console.error(e);
    }
    process.exit(0);
}

run();
