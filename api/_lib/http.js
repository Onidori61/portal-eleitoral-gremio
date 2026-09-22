export const json = (res, status, body) => res.status(status).json(body);
export const method = (req, res, expected) => { if (req.method !== expected) { json(res, 405, { error: "Método não permitido." }); return false; } return true; };
export const requireCommission = (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
  const configuredToken = process.env.COMMISSION_API_TOKEN?.trim();
  if (!configuredToken) {
    json(res, 503, { error: "O token da Comissão não está configurado neste ambiente." });
    return false;
  }
  if (!token || token !== configuredToken) {
    json(res, 401, { error: "Token da Comissão inválido." });
    return false;
  }
  return true;
};
