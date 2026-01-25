
const BASE_URL = "http://localhost:3000";

async function audit() {
    console.log("🚀 Starting Admin Protocol Audit...");

    // 1. Authenticate
    console.log("🔐 Authenticating...");
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@mxlens.com", password: "admin" })
    });

    if (!loginRes.ok) {
        console.error(`❌ Login Failed! Status: ${loginRes.status} ${loginRes.statusText}`);
        const text = await loginRes.text();
        console.error(`Response Body: ${text}`);
        process.exit(1);
    }

    const setCookie = loginRes.headers.get("set-cookie");
    if (!setCookie) {
        console.error("❌ No Session Cookie received!");
        process.exit(1);
    }

    // Extract token for manual use if needed, but fetch automatically handles cookies? 
    // No, node-fetch doesn't persist cookies automatically between info. 
    // We must parse and send it back.
    const cookie = setCookie.split(';')[0];
    console.log("✅ Authenticated. Token acquired.");

    const headers = {
        "Cookie": cookie
    };

    const routes = [
        // API Routes
        { method: "GET", path: "/api/admin/auth/me", type: "api" },
        { method: "GET", path: "/api/admin/users", type: "api" },
        { method: "GET", path: "/api/admin/organizations", type: "api" },
        { method: "GET", path: "/api/admin/dashboard/stats", type: "api" },
        { method: "GET", path: "/api/admin/dashboard/trends", type: "api" },

        // Page Routes (Next.js returns HTML)
        { method: "GET", path: "/admin", type: "page" },
        { method: "GET", path: "/admin/users", type: "page" },
        { method: "GET", path: "/admin/organizations", type: "page" },
        { method: "GET", path: "/admin/settings", type: "page" }, // Might be 404 if not exists?
    ];

    console.log("\n📡 Scanning Routes...");
    let passed = 0;
    let failed = 0;

    for (const route of routes) {
        try {
            const res = await fetch(`${BASE_URL}${route.path}`, { headers });

            const status = res.status;
            let icon = "✅";

            // Pages might redirect if auth fails (307)
            if (status === 200) {
                // Success
            } else if (status === 404) {
                icon = "⚠️ (404)";
                failed++; // Treat 404 as potential broken link? or just missing feature
            } else if (status === 401 || status === 403) {
                icon = "❌ (Auth Fail)";
                failed++;
            } else if (status === 500) {
                icon = "🔥 (Server Error)";
                failed++;
            } else if (status >= 300 && status < 400) {
                icon = `↩️ (${status})`;
                if (route.type === "page" && res.headers.get("location")?.includes("signin")) {
                    icon = "❌ (Redirect to Login)";
                    failed++;
                }
            }

            console.log(`${icon} [${status}] ${route.path}`);
            if (status === 200) passed++;

        } catch (e) {
            console.log(`💥 [ERR] ${route.path} - Network Error`);
            failed++;
        }
    }

    console.log(`\n📊 Audit Complete: ${passed} Passed, ${failed} Failed.`);

    if (failed > 0) {
        console.log("⚠️ Some routes require attention.");
    } else {
        console.log("✨ All Systems Operational.");
    }
}

audit();
