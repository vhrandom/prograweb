
import { storage } from "../server/storage";

async function checkUsers() {
    try {
        const users = await storage.getAllUsers();
        console.log("Existing Users:");
        users.forEach(u => {
            console.log(`- ${u.username} (${u.email}) Role: ${u.role}`);
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

checkUsers();
