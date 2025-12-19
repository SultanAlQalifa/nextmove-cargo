
const URL = "https://dkbnmnpxoesvkbnwuyle.supabase.co/rest/v1/rpc/get_dashboard_stats";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYm5tbnB4b2Vzdmtibnd1eWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjczNTgsImV4cCI6MjA3OTM0MzM1OH0.SG55XueWugfWVPwDC337KnmV_ARTcJijysab6n4_vS8";

async function testRpc() {
    console.log("Calling get_dashboard_stats...");
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "apikey": KEY,
                "Authorization": `Bearer ${KEY}`,
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testRpc();
