import escola from "../config/escola.js";
import eleicao from "../config/eleicao.js";
import cargos from "../config/cargos.js";
import textos from "../content/textos.js";
import documentos from "../content/documentos.js";

const $ = (id) => document.getElementById(id);
const api = async (path, options) => {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
};
const formatDate = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "A definir pela Comissão";
const render = (data) => {
  $("school").textContent = `${escola.nome} — ${escola.cidade}/${escola.estado}`;
  $("footer-school").textContent = escola.nome;
  $("title").textContent = textos.inicio.titulo;
  $("subtitle").textContent = textos.inicio.subtitulo;
  $("about").textContent = textos.inicio.sobre;
  $("chapas-title").textContent = textos.chapas.titulo;
  $("chapas-description").textContent = textos.chapas.descricao;
  $("status").textContent = `Status da eleição: ${data.election?.statusPublico || "informações em atualização"}.`;
  $("slates").innerHTML = (data.slates || []).map((slate) => `<article class="card"><h3>${escapeHtml(slate.nome)}</h3><p>Chapa ${escapeHtml(String(slate.numero))}</p><p>${escapeHtml(slate.apresentacao || "")}</p></article>`).join("") || "<p>Nenhuma chapa habilitada foi publicada.</p>";
  $("rules").innerHTML = [textos.eleicao.introducao, textos.eleicao.quemPodeVotar, textos.eleicao.quemPodeSerCandidato, textos.eleicao.comoVotar, textos.eleicao.comoRaEUsado, textos.eleicao.apuracao].map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  $("calendar").innerHTML = Object.entries(eleicao.datas).map(([key, value]) => `<article><time>${escapeHtml(key)}</time><div>${formatDate(value)}</div></article>`).join("");
  $("documents").innerHTML = documentos.map((doc) => `<article class="card"><h3>${escapeHtml(doc.titulo)}</h3><a href="${escapeAttr(doc.arquivo)}">Abrir documento</a></article>`).join("") || "<p>A Comissão ainda não publicou documentos.</p>";
  $("announcements").innerHTML = (data.announcements || []).map((item) => `<article class="card"><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(item.texto)}</p></article>`).join("") || "<p>Nenhum comunicado publicado.</p>";
  if (data.election?.status === "votacao") { $("vote-form").hidden = false; $("vote-help").textContent = "Informe seu RA e escolha uma opção. O voto é secreto."; renderBallot(data.slates || []); }
};
const renderBallot = (slates) => { $("ballot").innerHTML = [...slates.map((s) => `<label><input type="radio" name="choice" value="${escapeAttr(String(s.id))}" required> Chapa ${escapeHtml(String(s.numero))} — ${escapeHtml(s.nome)}</label>`), eleicao.votacao.permiteBranco ? '<label><input type="radio" name="choice" value="branco"> Voto em branco</label>' : "", eleicao.votacao.permiteNulo ? '<label><input type="radio" name="choice" value="nulo"> Voto nulo</label>' : ""].join(""); };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const escapeAttr = escapeHtml;
try { render(await api("/api/public")); } catch (error) { $("status").textContent = error.message; }
$("vote-form").addEventListener("submit", async (event) => { event.preventDefault(); const choice = document.querySelector('input[name="choice"]:checked')?.value; try { const result = await api("/api/voting", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ra: $("ra").value, choice }) }); $("vote-message").textContent = result.message; event.target.reset(); } catch (error) { $("vote-message").textContent = error.message; } });
