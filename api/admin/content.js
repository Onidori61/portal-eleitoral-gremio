import { getDb } from "../_lib/firebase.js";
import { json, requireCommission } from "../_lib/http.js";

const text = (value, max) => String(value || "").trim().slice(0, max);

export default async function handler(req, res) {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) return json(res, 405, { error: "Método não permitido." });
  if (!requireCommission(req, res)) return;
  try {
    const db = getDb();
    if (req.method === "GET") {
      const [documents, announcements] = await Promise.all([
        db.collection("documents").get(),
        db.collection("announcements").get()
      ]);
      return json(res, 200, {
        documents: documents.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        announcements: announcements.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      });
    }

    const body = req.body || {};
    if (req.method === "DELETE") {
      const collection = body.tipo === "documento" ? "documents" : body.tipo === "comunicado" ? "announcements" : "";
      if (!collection || !body.id) return json(res, 400, { error: "Item inválido." });
      await db.collection(collection).doc(String(body.id)).delete();
      return json(res, 200, { deleted: true });
    }

    if (req.method === "PATCH") {
      const collection = body.tipo === "documento" ? "documents" : body.tipo === "comunicado" ? "announcements" : "";
      if (!collection || !body.id) return json(res, 400, { error: "Item inválido." });
      const data = { atualizadoEm: new Date().toISOString() };
      if (collection === "documents") {
        data.titulo = text(body.titulo, 120);
        data.arquivo = text(body.arquivo, 1000);
        data.categoria = text(body.categoria, 80);
        data.publicado = Boolean(body.publicado);
      } else {
        data.titulo = text(body.titulo, 120);
        data.texto = text(body.texto, 2000);
        data.publicado = Boolean(body.publicado);
      }
      if (!data.titulo || (collection === "documents" && !/^https?:\/\/\S+$/i.test(data.arquivo)) || (collection === "announcements" && !data.texto)) return json(res, 400, { error: "Preencha os campos obrigatórios." });
      await db.collection(collection).doc(String(body.id)).update(data);
      return json(res, 200, { updated: true });
    }

    const collection = body.tipo === "documento" ? "documents" : body.tipo === "comunicado" ? "announcements" : "";
    if (!collection) return json(res, 400, { error: "Tipo de conteúdo inválido." });
    const data = collection === "documents"
      ? { titulo: text(body.titulo, 120), arquivo: text(body.arquivo, 1000), categoria: text(body.categoria, 80), publicado: Boolean(body.publicado), createdAt: new Date().toISOString() }
      : { titulo: text(body.titulo, 120), texto: text(body.texto, 2000), publicado: Boolean(body.publicado), createdAt: new Date().toISOString() };
    if (!data.titulo || (collection === "documents" && !/^https?:\/\/\S+$/i.test(data.arquivo)) || (collection === "announcements" && !data.texto)) return json(res, 400, { error: "Preencha os campos obrigatórios." });
    const record = await db.collection(collection).add(data);
    return json(res, 201, { id: record.id });
  } catch (error) {
    console.error("Erro ao administrar conteúdo:", error);
    return json(res, 500, { error: "Não foi possível atualizar o conteúdo." });
  }
}
