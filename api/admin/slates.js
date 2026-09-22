import { getDb } from "../_lib/firebase.js";
import { json, method, requireCommission } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) {
    return json(res, 405, { error: "Método não permitido." });
  }
  if (!requireCommission(req, res)) return;
  try {
    const db = getDb();
    if (req.method === "GET") {
      const snapshot = await db.collection("slates").orderBy("createdAt", "desc").get();
      return json(res, 200, { slates: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
    }
    const id = String(req.body?.id || "");
    if (req.method === "DELETE") {
      if (!id) return json(res, 400, { error: "Informe a chapa que será apagada." });
      const slate = await db.collection("slates").doc(id).get();
      if (!slate.exists) return json(res, 404, { error: "Chapa não encontrada." });
      await db.collection("slates").doc(id).delete();
      return json(res, 200, { deleted: true });
    }
    const status = String(req.body?.status || "");
    if (!id || !["habilitada", "indeferida", "pendente"].includes(status)) return json(res, 400, { error: "Chapa ou status inválido." });
    const data = { status, updatedAt: new Date().toISOString() };
    if (typeof req.body?.nome === "string") data.nome = req.body.nome.trim().slice(0, 100);
    if (typeof req.body?.apresentacao === "string") data.apresentacao = req.body.apresentacao.trim().slice(0, 1000);
    if (req.body?.imageUrl) {
      if (!/^https?:\/\/\S+$/i.test(String(req.body.imageUrl))) return json(res, 400, { error: "URL de imagem inválida." });
      data.imagemUrl = String(req.body.imageUrl).slice(0, 1000);
    }
    if (status === "habilitada") {
      const number = Number(req.body?.numero);
      if (!Number.isInteger(number) || number < 1) return json(res, 400, { error: "Informe um número de chapa válido." });
      data.numero = number;
    }
    await db.collection("slates").doc(id).update(data);
    return json(res, 200, { updated: true });
  } catch (error) {
    console.error("Erro ao administrar chapas:", error);
    return json(res, 500, { error: "Não foi possível atualizar as chapas." });
  }
}
