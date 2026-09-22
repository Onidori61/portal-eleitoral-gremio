import { getDb } from "./_lib/firebase.js";
import { json, method } from "./_lib/http.js";
import cargos from "../config/cargos.js";

const cleanText = (value, max) => String(value || "").trim().slice(0, max);
const validProposals = (proposals) => Array.isArray(proposals) && proposals.length > 0 && proposals.every((proposal) => cleanText(proposal.titulo, 120) && cleanText(proposal.descricao, 500));
const validMembers = (members) => Array.isArray(members) && members.length === cargos.length && cargos.every((cargo) => members.some((member) => cleanText(member.cargo, 100) === cargo)) && members.every((member) => cleanText(member.nome, 120) && cleanText(member.cargo, 100) && cleanText(member.turma, 40));
const validSocials = (socials) => !socials || (Array.isArray(socials) && socials.length <= 6 && socials.every((social) => cleanText(social.plataforma, 40) && /^https?:\/\/\S+$/i.test(String(social.url || ""))));

export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const body = req.body || {};
  const nome = cleanText(body.nome, 100);
  const apresentacao = cleanText(body.apresentacao, 1000);
  if (!nome || !apresentacao || !validMembers(body.integrantes) || !validProposals(body.propostas) || !validSocials(body.redes)) {
    return json(res, 400, { error: "Preencha os oito cargos, os integrantes, pelo menos uma proposta e as redes sociais válidas." });
  }
  try {
    const db = getDb();
    const record = await db.collection("slates").add({
      nome,
      apresentacao,
      integrantes: body.integrantes.map((member) => ({ nome: cleanText(member.nome, 120), cargo: cleanText(member.cargo, 100), turma: cleanText(member.turma, 40), apresentacao: cleanText(member.apresentacao, 300) })),
      propostas: body.propostas.map((proposal) => ({ titulo: cleanText(proposal.titulo, 120), categoria: cleanText(proposal.categoria, 60), descricao: cleanText(proposal.descricao, 500) })),
      redes: (body.redes || []).map((social) => ({ plataforma: cleanText(social.plataforma, 40), url: String(social.url).trim() })),
      imagemStatus: "pendente",
      status: "pendente",
      createdAt: new Date().toISOString()
    });
    return json(res, 201, { id: record.id });
  } catch (error) {
    console.error("Erro ao receber inscrição de chapa:", error);
    return json(res, 500, { error: "Não foi possível enviar a inscrição. Tente novamente." });
  }
}
