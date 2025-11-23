
import { MongoClient, ObjectId } from "mongodb";

async function checkReviews() {
    const uri = "mongodb+srv://brandon7torress_db_user:Holakaselol13@cluster0.bodade8.mongodb.net/appleaura?retryWrites=true&w=majority&appName=Cluster0";

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const productId = "691e66d3c2eff0f57040997b";
        console.log(`Checking reviews for productId: ${productId}`);

        // List all reviews
        const allReviews = await db.collection("reviews").find({}).limit(10).toArray();
        console.log(`Total reviews in DB (limit 10): ${allReviews.length}`);
        console.log(JSON.stringify(allReviews, null, 2));

        // Check if product exists
        let product = null;
        if (ObjectId.isValid(productId)) {
            product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
        }

        if (!product) {
            product = await db.collection("products").findOne({ id: productId });
        }

        console.log(`Product found: ${!!product}`);
        if (product) {
            console.log(`Product ID (string): ${product.id}`);
            console.log(`Product _id (ObjectId): ${product._id}`);
            console.log(`Product Title: ${product.title}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

checkReviews();
