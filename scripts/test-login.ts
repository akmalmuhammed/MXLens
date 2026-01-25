async function testLogin() {
    const email = "admin@mxlens.com";
    const password = "admin";

    console.log(`Testing Admin Login for: ${email}`);

    try {
        const response = await fetch("http://localhost:3000/api/admin/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log("Response Body:", data);

        const cookies = response.headers.get("set-cookie");
        if (cookies) {
            console.log("✅ Set-Cookie header received:");
            console.log(cookies);
        } else {
            console.log("❌ NO Set-Cookie header received!");
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testLogin();
