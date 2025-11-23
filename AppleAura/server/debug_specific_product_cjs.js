const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL || "");
    try {
        await client.connect();
        const db = client.db();

        const productId = "692248082f3955f5552261a1";
        console.log(`Checking product: ${productId}`);

        // Check Product
        const product = await db.collection("products").findOne({ $or: [{ id: productId }, { _id: new ObjectId(productId) }] });
        console.log("Product found:", product ? "YES" : "NO");
        if (product) {
            console.log("Product ID (string):", product.id);
            console.log("Product _id (obj):", product._id);
        }

        // Check Variants
        const variants = await db.collection("product_variants").find({ productId: productId }).toArray();
        console.log("Variants found:", variants.length);
        variants.forEach(v => console.log(`- Variant: ${v.id}, Price: ${v.priceCents}, Stock: ${v.stock}`));

        // Check Reviews
        const reviews = await db.collection("reviews").find({ productId: productId }).toArray();
        console.log("Reviews found:", reviews.length);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
