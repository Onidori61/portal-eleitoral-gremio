import escola from "../config/escola.js";
import eleicao from "../config/eleicao.js";
import cargos from "../config/cargos.js";
if (!escola.nome || !escola.cidade || !Number.isInteger(eleicao.ano) || cargos.length !== 8) throw new Error("Configuração inválida: confira escola, ano e os oito cargos.");
console.log("Configuração válida.");
