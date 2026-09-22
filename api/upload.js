import { json, method, requireCommission } from "./_lib/http.js";
import { uploadToImgBB } from "./_lib/imgbb.js";
export default async function handler(req, res) {
  if (!method(req, res, "POST") || !requireCommission(req, res)) return;
  try { const { image, name, expiration } = req.body || {}; if (typeof image !== "string" || !image || image.length > 32 * 1024 * 1024) return json(res, 400, { error: "Imagem ausente ou maior que 32 MB." }); return json(res, 201, await uploadToImgBB({ image, name, expiration })); }
  catch (error) { console.error("Erro no upload de imagem:", error); return json(res, 502, { error: "Não foi possível enviar a imagem." }); }
}
