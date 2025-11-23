
import { MongoClient } from "mongodb";

async function inspectReviews() {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/appleaura");
    try {
        await client.connect();
        const db = client.db();
        const reviews = await db.collection("reviews").find({}).toArray();
        console.log("Total reviews:", reviews.length);
        reviews.forEach(r => {
            console.log(`Review ID: ${r._id}, ProductID: ${r.productId} (Type: ${typeof r.productId})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

inspectReviews();
