import crypto from "node:crypto";
export const normalizeRa = (value) => String(value || "").replace(/\D/g, "");
export const raDigest = (ra) => { if (!process.env.RA_HMAC_SECRET) throw new Error("RA_HMAC_SECRET não configurado."); return crypto.createHmac("sha256", process.env.RA_HMAC_SECRET).update(ra).digest("hex"); };
