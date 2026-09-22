import eleicao from "../config/eleicao.js";
import { getDb } from "./_lib/firebase.js";
import { json, method } from "./_lib/http.js";
import { normalizeRa, raDigest } from "./_lib/ra.js";
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  try {
    const ra = normalizeRa(req.body?.ra), choice = String(req.body?.choice || "");
    if (!/^\d{1,20}$/.test(ra) || !choice) return json(res, 400, { error: "Informe um RA válido e uma opção." });
    const db = getDb(), election = (await db.collection("config").doc("election").get()).data() || eleicao;
    const now = Date.now(), start = Date.parse(election.datas?.votacaoInicio || ""), end = Date.parse(election.datas?.votacaoFim || "");
    const withinVotingWindow = Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
    if (election.status !== "votacao" || election.votingEnabled !== true || (election.votingTestMode !== true && !withinVotingWindow)) return json(res, 403, { error: "A votação não está aberta neste momento." });
    const [voterRef, eligibleRef, voteRef] = [db.collection("voterParticipation").doc(raDigest(ra)), db.collection("eligibleVoters").doc(raDigest(ra)), db.collection("votes").doc()];
    const allowed = new Set(["branco", "nulo"]);
    (await db.collection("slates").where("status", "==", "habilitada").get()).forEach((doc) => allowed.add(doc.id));
    if (!allowed.has(choice)) return json(res, 400, { error: "A opção de voto não é válida." });
    await db.runTransaction(async (transaction) => {
      const [voter, eligible] = await Promise.all([transaction.get(voterRef), transaction.get(eligibleRef)]);
      if (!eligible.exists) throw new Error("Este RA não está habilitado para votar.");
      if (voter.exists) throw new Error("Este RA já consta como participante da votação.");
      transaction.create(voterRef, { createdAt: new Date().toISOString() });
      transaction.create(voteRef, { choice, createdAt: new Date().toISOString() });
    });
    return json(res, 201, { message: "Seu voto foi registrado com sucesso." });
  } catch (error) {
    const status = error.message.includes("já consta") ? 409 : error.message.includes("não está habilitado") ? 403 : 500;
    return json(res, status, { error: error.message });
  }
}
