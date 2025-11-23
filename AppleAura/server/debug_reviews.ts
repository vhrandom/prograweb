
import { storage } from "./storage";

async function debugReviews() {
    const productId = "691e5ea120a26e2a123267d5";
    console.log(`Testing getReviewsByProductId for ${productId}`);
    const reviews = await storage.getReviewsByProductId(productId);
    console.log("Result:", JSON.stringify(reviews, null, 2));
}

debugReviews();
