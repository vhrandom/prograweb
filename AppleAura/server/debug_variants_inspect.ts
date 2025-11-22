import "dotenv/config";
import { connectMongo } from "./mongo-connection";

async function run() {
    try {
        console.log("--- DEBUGGING VARIANTS ---");
        const db = await connectMongo();
        const variants = await db.collection("product_variants").find({}).limit(5).toArray();
        console.log("Variants found:", variants.length);
        variants.forEach(v => {
            console.log("Variant:", JSON.stringify(v, null, 2));
        });
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

run();
