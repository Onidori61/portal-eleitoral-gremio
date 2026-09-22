import eleicao from "../../config/eleicao.js";
import { getDb } from "../_lib/firebase.js";
import { json, requireCommission } from "../_lib/http.js";

const statuses = new Set(["configuracao", "inscricoes", "campanha", "votacao", "apuracao", "encerrada"]);
const dateFields = ["inscricoesInicio", "inscricoesFim", "campanhaInicio", "campanhaFim", "votacaoInicio", "votacaoFim", "apuracao"];

const validateDates = (dates) => {
  const result = {};
  for (const field of dateFields) {
    const value = dates?.[field] || "";
    if (value && !Number.isFinite(Date.parse(value))) throw new Error(`Data inválida: ${field}.`);
    result[field] = value;
  }
  return result;
};

export default async function handler(req, res) {
  if (!["GET", "PATCH"].includes(req.method)) return json(res, 405, { error: "Método não permitido." });
  if (!requireCommission(req, res)) return;
  try {
    const db = getDb();
    const ref = db.collection("config").doc("election");
    if (req.method === "GET") {
      const snapshot = await ref.get();
      return json(res, 200, { election: snapshot.exists ? { ...eleicao, ...snapshot.data() } : { ...eleicao, status: "configuracao", statusPublico: "configuração" } });
    }
    const body = req.body || {};
    const status = String(body.status || "");
    if (!statuses.has(status)) return json(res, 400, { error: "Status de eleição inválido." });
    const current = (await ref.get()).data() || {};
    const dates = validateDates({ ...(current.datas || {}), ...(body.datas || {}) });
    if (status === "votacao" && (!dates.votacaoInicio || !dates.votacaoFim)) return json(res, 400, { error: "Defina o início e o fim da votação antes de abrir o período." });
    if (dates.votacaoInicio && dates.votacaoFim && Date.parse(dates.votacaoFim) <= Date.parse(dates.votacaoInicio)) return json(res, 400, { error: "O fim da votação deve ser posterior ao início." });
    await ref.set({ status, statusPublico: String(body.statusPublico || status), votingEnabled: Boolean(body.votingEnabled), votingTestMode: Boolean(body.votingTestMode), datas: dates, updatedAt: new Date().toISOString() }, { merge: true });
    return json(res, 200, { updated: true });
  } catch (error) {
    console.error("Erro ao atualizar configuração da eleição:", error);
    return json(res, 500, { error: "Não foi possível atualizar a eleição." });
  }
}
