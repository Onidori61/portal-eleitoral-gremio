import escola from "../config/escola.js";
import eleicao from "../config/eleicao.js";
import textos from "../content/textos.js";
import documentos from "../content/documentos.js";
import cargos from "../config/cargos.js";
import { firebaseConfigured, getDb } from "./_lib/firebase.js";
import { json, method } from "./_lib/http.js";
export default async function handler(req, res) {
  if (!method(req, res, "GET")) return;
  try {
    const result = {
      school: escola,
      election: { ...eleicao, status: "configuracao", statusPublico: "configuração" },
      content: { textos, documentos, cargos },
      slates: [],
      announcements: []
    };
    if (firebaseConfigured) {
      try {
        const db = getDb();
        const [electionDoc, slates, announcements] = await Promise.all([db.collection("config").doc("election").get(), db.collection("slates").where("status", "==", "habilitada").orderBy("numero").get(), db.collection("announcements").where("publicado", "==", true).orderBy("createdAt", "desc").get()]);
        if (electionDoc.exists) result.election = { ...result.election, ...electionDoc.data() };
        result.slates = slates.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        result.announcements = announcements.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
