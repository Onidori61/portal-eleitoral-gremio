import { getDb } from "../_lib/firebase.js";
import { json, method, requireCommission } from "../_lib/http.js";
import { normalizeRa, raDigest } from "../_lib/ra.js";

class ValidationError extends Error {}

const chunk = (items, size) => {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
};

const parse = (csv) => {
  const rows = String(csv || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const header = (rows[0] || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toUpperCase();

  if (rows.length < 2 || header !== "RA") {
    throw new ValidationError("O CSV deve ter cabeçalho RA e ao menos um registro.");
  }

  const ras = rows.slice(1).map(normalizeRa);
  if (ras.some((ra) => !/^\d{1,20}$/.test(ra))) {
    throw new ValidationError("Todos os RAs devem conter somente números.");
  }
  if (new Set(ras).size !== ras.length) {
    throw new ValidationError("O CSV contém RAs duplicados.");
  }

  return ras;
};

export default async function handler(req, res) {
  if (!method(req, res, "POST") || !requireCommission(req, res)) return;

  let ras;
  try {
    ras = parse(req.body?.csv);
  } catch (error) {
    if (error instanceof ValidationError) {
      return json(res, 400, { error: error.message });
    }
    console.error("Erro ao validar eleitores:", error);
    return json(res, 500, { error: "Não foi possível validar os eleitores." });
  }

  try {
    const db = getDb();
    const importedAt = new Date().toISOString();

    for (const group of chunk(ras, 500)) {
      const batch = db.batch();

      for (const ra of group) {
        batch.set(
          db.collection("eligibleVoters").doc(raDigest(ra)),
          { importedAt }
        );
      }

      await batch.commit();
    }

    return json(res, 201, { imported: ras.length });
  } catch (error) {
    console.error("Erro ao importar eleitores:", error);
    return json(res, 500, { error: "Não foi possível importar os eleitores." });
  }
}
