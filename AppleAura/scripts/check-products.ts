
import { MongoClient } from "mongodb";

async function checkProducts() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/appleaura";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const count = await db.collection("products").countDocuments();
        console.log(`Total products in DB: ${count}`);

        if (count > 0) {
            const products = await db.collection("products").find().limit(3).toArray();
            console.log("Sample products:", JSON.stringify(products, null, 2));
        }
    } catch (error) {
        console.error("Error connecting to DB:", error);
    } finally {
        await client.close();
    }
}

checkProducts();
