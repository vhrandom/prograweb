import "dotenv/config";
import { storage } from "./storage";
import { connectMongo } from "./mongo-connection";
import { ObjectId } from "mongodb";

async function run() {
    try {
        const productId = "6922009e03602c77fd7eb3aa"; // ID provided by user
        console.log(`Inspecting product: ${productId}`);

        const db = await connectMongo();
        // Try finding by ObjectId first, then by string id
        let product = null;
        try {
            product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
        } catch (e) {
            // Ignore invalid object id error if any
        }

        if (!product) {
            product = await db.collection("products").findOne({ id: productId });
        }

        if (!product) {
            console.log("Product NOT found in DB directly.");
            console.log("Listing first 5 products to verify IDs:");
            const allProducts = await db.collection("products").find({}).limit(5).toArray();
            allProducts.forEach(p => console.log(`- ID: ${p._id} (type: ${typeof p._id}), StringID: ${p.id}`));
            return;
        }

        console.log("Product found:", JSON.stringify(product, null, 2));
        console.log(`Product SellerID: ${product.sellerId}`);

        console.log("--- Testing getSellerProfileById ---");
        const seller = await storage.getSellerProfileById(product.sellerId);
        console.log("getSellerProfileById result:", seller);

        if (!seller) {
            console.log("--- Inspecting SellerProfiles directly ---");
            const profiles = await db.collection("seller_profiles").find({}).toArray();
            console.log(`Found ${profiles.length} profiles.`);
            const matchId = profiles.find(p => p.id === product.sellerId);
            const matchUnderscoreId = profiles.find(p => p._id.toString() === product.sellerId);

            console.log("Match by id:", matchId);
            console.log("Match by _id:", matchUnderscoreId);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

run();
