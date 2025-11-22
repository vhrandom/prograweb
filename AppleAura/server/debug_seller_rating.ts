import "dotenv/config";
import { storage } from "./storage";
import { connectMongo } from "./mongo-connection";

async function run() {
    try {
        console.log("Calling storage.getProducts...");
        const products = await storage.getProducts({ limit: 5 });

        for (const p of products) {
            console.log("---------------------------------------------------");
            console.log(`Product: ${p.title} (ID: ${p.id})`);
            console.log(`Seller ID: ${p.sellerId}`);
            console.log("Seller Object:", JSON.stringify(p.seller, null, 2));

            console.log(`Review Count: ${p.reviewCount}`);
            console.log(`Rating: ${p.rating}`);

            // Inspect raw reviews from DB to check data types
            const db = await connectMongo();
            const reviews = await db.collection("reviews").find({ productId: p.id }).toArray();
            console.log(`Raw Reviews found: ${reviews.length}`);
            if (reviews.length > 0) {
                console.log("First Review Sample:", JSON.stringify(reviews[0], null, 2));
                console.log("Rating Type:", typeof reviews[0].rating);
            }
        }
    } catch (e) {
        console.error("Error in debug script:");
        console.error(e);
    }
    process.exit(0);
}

run();
