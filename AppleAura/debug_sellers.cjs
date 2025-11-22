
const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://brandon7torress_db_user:Holakaselol13@cluster0.bodade8.mongodb.net/appleaura?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('appleaura');

        console.log("--- Sellers ---");
        const sellers = await db.collection('seller_profiles').find().toArray();
        sellers.forEach(s => console.log(`ID: ${s.id}, Name: ${s.displayName}, UserID: ${s.userId}`));

        console.log("\n--- Products (Sample) ---");
        const products = await db.collection('products').find().limit(5).toArray();
        products.forEach(p => console.log(`Product: ${p.title}, SellerID: ${p.sellerId}`));

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
