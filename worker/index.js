export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const initData = url.searchParams.get("initData");

    if (!initData) {
      return json({ error: "missing initData" }, 400);
    }

    if (!env.TELEGRAM_BOT_TOKEN) {
      // مقداردهی env.TELEGRAM_BOT_TOKEN در ورکر الزامی است.
      return json({ error: "bot token not configured" }, 500);
    }

    if (!env.SESSION_TOKEN_SECRET) {
      // مقداردهی env.SESSION_TOKEN_SECRET در ورکر الزامی است.
      return json({ error: "session secret not configured" }, 500);
    }

    const parsed = await verifyInitData(initData, env.TELEGRAM_BOT_TOKEN);
    if (!parsed.valid) {
      return json({ error: "invalid initData" }, 401);
    }

    const ttlMinutes = Number(env.SESSION_TOKEN_TTL_MINUTES || "15");
    const payload = buildSessionPayload(parsed.user, ttlMinutes);
    const sessionToken = await signSessionToken(
      payload,
      env.SESSION_TOKEN_SECRET
    );

    return json(
      {
        sessionToken,
        backend: "trusted via worker",
        exp: payload.exp,
      },
      200
    );
  },
};

async function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false };

  // data_check_string: sorted key=value (excluding hash) joined by '\n'
  const entries = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    entries.push(`${key}=${value}`);
  }
  entries.sort();
  const dataCheckString = entries.join("\n");

  const secret = await sha256(`WebAppData${botToken}`);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(dataCheckString)
  );
  const expectedHash = toHex(signatureBuffer);

  if (expectedHash !== hash) {
    return { valid: false };
  }

  let user = {};
  const userStr = params.get("user");
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (err) {
      return { valid: false };
    }
  }

  return { valid: true, user };
}

function buildSessionPayload(user, ttlMinutes) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = nowSeconds + ttlMinutes * 60;
  return {
    tg_id: user?.id ?? null,
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    username: user?.username ?? "",
    exp,
  };
}

async function signSessionToken(payload, secret) {
  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = toBase64Url(encoder.encode(payloadJson));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const sigB64 = toBase64Url(new Uint8Array(signatureBuffer));
  return `${payloadB64}.${sigB64}`;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data);
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(uint8arr) {
  let binary = "";
  const bytes = uint8arr instanceof Uint8Array ? uint8arr : new Uint8Array(uint8arr);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
