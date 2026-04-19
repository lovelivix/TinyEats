// Vercel serverless function — runs server-side, never exposed to browser
// Deletes all user data from Supabase then removes the auth account entirely.
// Requires SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables (no VITE_ prefix).

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the user's JWT from the Authorization header
  const authHeader = req.headers.authorization || "";
  const userToken = authHeader.replace("Bearer ", "").trim();
  if (!userToken) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    // 1. Verify the token and get the user's ID
    const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${userToken}`,
      },
    });
    const me = await meRes.json();
    if (!me.id) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = me.id;

    const adminHeaders = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    };

    // 2. Delete baby_profiles rows (cascade from babies if FK exists, but belt-and-braces)
    await fetch(
      `${SUPABASE_URL}/rest/v1/baby_profiles?user_id=eq.${userId}`,
      { method: "DELETE", headers: adminHeaders }
    );

    // 3. Delete babies rows
    await fetch(
      `${SUPABASE_URL}/rest/v1/babies?user_id=eq.${userId}`,
      { method: "DELETE", headers: adminHeaders }
    );

    // 4. Delete the auth account itself
    await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      { method: "DELETE", headers: adminHeaders }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("delete-account error:", err);
    return res.status(500).json({ error: "Deletion failed" });
  }
}
