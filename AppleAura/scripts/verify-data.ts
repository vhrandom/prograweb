
import { MongoClient } from "mongodb";
import 'dotenv/config';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/appleaura";

async function check() {
    console.log("Connecting to:", uri);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const count = await db.collection("products").countDocuments();
        console.log(`Products count: ${count}`);
        const categories = await db.collection("categories").countDocuments();
        console.log(`Categories count: ${categories}`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

check();
