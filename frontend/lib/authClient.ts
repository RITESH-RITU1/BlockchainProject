export async function getOrRequestAuthToken(
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>
): Promise<string | null> {
  const normalizedAddress = address.toLowerCase();
  const cacheKey = `clearescrow_token_${normalizedAddress}`;

  // Check if we already have a cached token in sessionStorage
  if (typeof window !== "undefined") {
    const cachedToken = sessionStorage.getItem(cacheKey);
    if (cachedToken) {
      // Validate token structure
      try {
        const payloadB64 = cachedToken.split(".")[0];
        const payload = JSON.parse(window.atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.address === normalizedAddress && payload.exp > Date.now() + 60000) {
          return cachedToken;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  // Otherwise, request a new challenge nonce from the server
  try {
    const nonceRes = await fetch(`/api/auth/nonce?address=${normalizedAddress}`);
    if (!nonceRes.ok) throw new Error("Failed to fetch challenge nonce");
    const { nonce, message } = await nonceRes.json();

    // Request wallet signature
    const signature = await signMessageAsync({ message });

    // Verify signature with server
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: normalizedAddress,
        signature,
        nonce,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || "Wallet signature verification failed");
    }

    const { token } = await verifyRes.json();
    if (typeof window !== "undefined" && token) {
      sessionStorage.setItem(cacheKey, token);
    }

    return token;
  } catch (err) {
    console.error("Authentication flow error:", err);
    throw err;
  }
}
