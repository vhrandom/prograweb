
import { MongoClient } from "mongodb";

async function testConnection() {
    const uri = "mongodb://localhost:27017";
    console.log(`Testing connection to ${uri}...`);

    try {
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        console.log("Successfully connected to MongoDB!");
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
}

testConnection();
