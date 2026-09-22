import escola from "../config/escola.js";
import eleicao from "../config/eleicao.js";
import textos from "../content/textos.js";
import documentos from "../content/documentos.js";
import cargos from "../config/cargos.js";
import turmas from "../config/turmas.js";
import { firebaseConfigured, getDb } from "./_lib/firebase.js";
import { json, method } from "./_lib/http.js";
export default async function handler(req, res) {
  if (!method(req, res, "GET")) return;
  try {
    const result = {
      school: escola,
      election: { ...eleicao, status: "configuracao", statusPublico: "configuração" },
      content: { textos, documentos, cargos, turmas },
      slates: [],
      announcements: []
    };
    if (firebaseConfigured) {
      try {
        const db = getDb();
        const [electionDoc, slates, announcements, firestoreDocuments] = await Promise.all([db.collection("config").doc("election").get(), db.collection("slates").get(), db.collection("announcements").get(), db.collection("documents").get()]);
        if (electionDoc.exists) result.election = { ...result.election, ...electionDoc.data() };
        result.slates = slates.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((slate) => slate.status === "habilitada").sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0));
        result.announcements = announcements.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((item) => item.publicado).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
        result.content.documentos = [...result.content.documentos, ...firestoreDocuments.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((item) => item.publicado).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))];
      } catch (error) {
        console.error("Erro ao carregar dados públicos do Firestore:", error);
      }
    }
    return json(res, 200, result);
  } catch (error) {
    console.error("Erro ao carregar conteúdo público:", error);
    return json(res, 500, { error: "Não foi possível carregar o conteúdo público." });
  }
}
