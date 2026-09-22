export const json = (res, status, body) => res.status(status).json(body);
export const method = (req, res, expected) => { if (req.method !== expected) { json(res, 405, { error: "Método não permitido." }); return false; } return true; };
export const requireCommission = (req, res) => { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ""); if (!process.env.COMMISSION_API_TOKEN || token !== process.env.COMMISSION_API_TOKEN) { json(res, 401, { error: "Autenticação da Comissão necessária." }); return false; } return true; };
