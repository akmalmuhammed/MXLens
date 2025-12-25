import { config } from "dotenv";
config();

console.log("🔍 Verifying Stripe Environment Variables...");

const requiredKeys = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PRICE_ID_PRO_MONTHLY",
    "STRIPE_WEBHOOK_SECRET"
];

let missing = false;

requiredKeys.forEach(key => {
    const val = process.env[key];
    if (!val) {
        console.error(`❌ Missing: ${key}`);
        missing = true;
    } else {
        const preview = val.length > 8 ? val.substring(0, 8) + "..." : "****";
        console.log(`✅ Found: ${key} (${preview})`);
    }
});

if (missing) {
    console.error("\n❌ Setup Incomplete. Please add the missing keys to your .env file.");
    process.exit(1);
} else {
    console.log("\n✅ Stripe Configuration looks good!");
}
