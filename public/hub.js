const $ = (id) => document.getElementById(id);
const authHeaders = (json = false) => ({ ...(json ? { "content-type": "application/json" } : {}), authorization: "Bearer " + $("token").value });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const message = (id, text, type = "") => { const element = $(id); element.textContent = text; element.className = "form-message " + type; };
const readJson = async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Falha na operação."); return data; };
const formatDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";
const setSummary = (id, value) => { const element = $(id); if (element) element.textContent = String(value); };
const contentRequest = (body, method = "POST") => readJson(fetch("/api/admin/content", { method, headers: authHeaders(true), body: JSON.stringify(body) }));
const footerFields = ["titulo", "subtitulo", "descricao", "endereco", "telefone", "email", "comissaoTitulo", "comissaoTexto"];
const setFooterEditor = (footer = {}) => {
  footerFields.forEach((field) => { const element = document.querySelector(`[data-footer-field="${field}"]`); if (element) element.textContent = footer[field] || ""; });
};
const loadFooter = async () => {
  const data = await readJson(await fetch("/api/admin/content", { headers: authHeaders() }));
  setFooterEditor(data.footer || {});
  $("footer-editor").hidden = false;
};
const saveFooter = async () => {
  const body = { tipo: "footer" };
  footerFields.forEach((field) => { body[field] = document.querySelector(`[data-footer-field="${field}"]`)?.textContent.trim() || ""; });
  try { await contentRequest(body, "PATCH"); message("footer-message", "Footer salvo. A página pública usará o novo conteúdo.", "success"); } catch (error) { message("footer-message", error.message, "error"); }
};

const loadElection = async () => {
  const data = await readJson(await fetch("/api/admin/election", { headers: authHeaders() }));
  const election = data.election;
  $("election-status").value = election.status || "configuracao";
  $("status-publico").value = election.statusPublico || "";
  ["inscricoesInicio", "inscricoesFim", "campanhaInicio", "campanhaFim", "votacaoInicio", "votacaoFim", "apuracao"].forEach((field) => { $(field).value = formatDateTime(election.datas?.[field]); });
  message("election-message", "Configuração carregada.", "success");
};

const loadSlates = async () => {
  const data = await readJson(await fetch("/api/admin/slates", { headers: authHeaders() }));
  setSummary("summary-slates", data.slates.length);
  setSummary("summary-approved", data.slates.filter((slate) => slate.status === "habilitada").length);
  $("pending-slates").innerHTML = data.slates.length ? data.slates.map((slate) => `<article class="pending-slate"><div class="pending-slate-content"><span class="slate-number">${escapeHtml(slate.status)} · ${escapeHtml(slate.id)}</span><label>Nome da chapa<input data-name="${escapeHtml(slate.id)}" value="${escapeHtml(slate.nome || "")}" maxlength="100"></label><label>Apresentação<textarea data-presentation="${escapeHtml(slate.id)}" rows="3" maxlength="1000">${escapeHtml(slate.apresentacao || "")}</textarea></label><details><summary>Ver composição e propostas</summary><p><strong>Integrantes:</strong> ${(slate.integrantes || []).map((member) => `${escapeHtml(member.nome)} — ${escapeHtml(member.cargo)} (${escapeHtml(member.turma)})`).join("; ")}</p><p><strong>Propostas:</strong> ${(slate.propostas || []).map((proposal) => `${escapeHtml(proposal.titulo)}: ${escapeHtml(proposal.descricao)}`).join("; ")}</p></details></div><div class="review-actions"><label>Número<input data-number="${escapeHtml(slate.id)}" type="number" min="1" value="${escapeHtml(slate.numero || "")}"></label><button class="button button-primary" data-save="${escapeHtml(slate.id)}" type="button">Salvar edição</button>${slate.status === "pendente" ? `<button class="button button-primary" data-approve="${escapeHtml(slate.id)}" type="button">Habilitar</button><button class="button danger-button" data-reject="${escapeHtml(slate.id)}" type="button">Indeferir</button>` : `<button class="button danger-button" data-pend="${escapeHtml(slate.id)}" type="button">Voltar para pendente</button>`}<p class="form-message" data-slate-message="${escapeHtml(slate.id)}" role="status"></p></div></article>`).join("") : '<p class="empty-state">Nenhuma chapa cadastrada.</p>';
  document.querySelectorAll("[data-save]").forEach((button) => button.addEventListener("click", () => updateSlate(button.dataset.save, "editar")));
  document.querySelectorAll("[data-approve]").forEach((button) => button.addEventListener("click", () => updateSlate(button.dataset.approve, "habilitada")));
  document.querySelectorAll("[data-reject]").forEach((button) => button.addEventListener("click", () => updateSlate(button.dataset.reject, "indeferida")));
  document.querySelectorAll("[data-pend]").forEach((button) => button.addEventListener("click", () => updateSlate(button.dataset.pend, "pendente")));
};

const updateSlate = async (id, status) => {
  const body = { id, status, numero: document.querySelector(`[data-number="${id}"]`)?.value, nome: document.querySelector(`[data-name="${id}"]`)?.value, apresentacao: document.querySelector(`[data-presentation="${id}"]`)?.value };
  try { await readJson(await fetch("/api/admin/slates", { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(body) })); await loadSlates(); }
  catch (error) { const target = document.querySelector(`[data-slate-message="${id}"]`); target.textContent = error.message; target.className = "form-message error"; }
};

const loadContent = async () => {
  const data = await readJson(await fetch("/api/admin/content", { headers: authHeaders() }));
  $("documents-admin").innerHTML = data.documents.map((item) => `<p class="admin-content-row"><strong>${escapeHtml(item.titulo)}</strong><small>${item.publicado ? "Publicado" : "Rascunho"}</small><button type="button" data-delete-content="documento" data-content-id="${escapeHtml(item.id)}">Excluir</button></p>`).join("") || '<p class="muted">Nenhum documento cadastrado.</p>';
  $("announcements-admin").innerHTML = data.announcements.map((item) => `<p class="admin-content-row"><strong>${escapeHtml(item.titulo)}</strong><small>${item.publicado ? "Publicado" : "Rascunho"}</small><button type="button" data-delete-content="comunicado" data-content-id="${escapeHtml(item.id)}">Excluir</button></p>`).join("") || '<p class="muted">Nenhum comunicado cadastrado.</p>';
  setSummary("summary-documents", data.documents.filter((item) => item.publicado).length);
  setSummary("summary-announcements", data.announcements.filter((item) => item.publicado).length);
  document.querySelectorAll("[data-delete-content]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("Excluir este item?")) return;
    try { await contentRequest({ tipo: button.dataset.deleteContent, id: button.dataset.contentId }, "DELETE"); await loadContent(); } catch (error) { window.alert(error.message); }
  }));
};

const authenticate = async () => {
  if ($("token").value.length < 10) {
    $("token-state").textContent = "Cole um token válido para continuar.";
    $("token-state").classList.remove("ready");
    return;
  }
  $("token-state").textContent = "Carregando dados...";
  try {
    await Promise.all([loadElection(), loadSlates(), loadContent(), loadFooter()]);
    $("token-state").textContent = "Acesso confirmado nesta sessão.";
    $("token-state").classList.add("ready");
  } catch (error) {
    $("token-state").textContent = error.message;
    $("token-state").classList.remove("ready");
  }
};

const readImage = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = () => reject(new Error("Não foi possível ler a imagem.")); reader.readAsDataURL(file); });
const uploadImage = async (file) => {
  if (!file || file.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use JPG, PNG ou WEBP de até 4 MB.");
  return readJson(await fetch("/api/upload", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ image: await readImage(file), name: file.name }) }));
};

$("token").addEventListener("input", () => { $("token-state").textContent = $("token").value ? "Clique em entrar para carregar os dados." : "Aguardando autenticação"; $("token-state").classList.remove("ready"); });
$("authenticate").addEventListener("click", authenticate);
$("save-footer").addEventListener("click", saveFooter);
$("csv").addEventListener("change", (event) => { $("csv-label").textContent = event.target.files[0]?.name || "Escolher arquivo CSV"; });
$("image").addEventListener("change", (event) => { $("image-label").textContent = event.target.files[0]?.name || "Escolher imagem"; });
$("import").addEventListener("click", async () => {
  try {
    const file = $("csv").files[0];
    if (!file) throw new Error("Selecione um arquivo CSV.");
    const data = await readJson(await fetch("/api/admin/import-voters", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ csv: await file.text() }) }));
    message("import-message", `${data.imported} eleitores importados.`, "success");
  } catch (error) { message("import-message", error.message, "error"); }
});
$("upload").addEventListener("click", async () => {
  try {
    const data = await uploadImage($("image").files[0]);
    message("upload-message", `Imagem enviada: ${data.url}`, "success");
  } catch (error) { message("upload-message", error.message, "error"); }
});
$("load-election").addEventListener("click", async () => { try { await loadElection(); } catch (error) { message("election-message", error.message, "error"); } });
$("load-slates").addEventListener("click", async () => { try { await loadSlates(); } catch (error) { $("pending-slates").innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`; } });
$("election-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const dates = {};
  ["inscricoesInicio", "inscricoesFim", "campanhaInicio", "campanhaFim", "votacaoInicio", "votacaoFim", "apuracao"].forEach((field) => { dates[field] = $(field).value ? new Date($(field).value).toISOString() : ""; });
  try { await readJson(await fetch("/api/admin/election", { method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ status: $("election-status").value, statusPublico: $("status-publico").value, datas: dates }) })); message("election-message", "Controle da eleição salvo.", "success"); } catch (error) { message("election-message", error.message, "error"); }
});
$("document-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await contentRequest({ tipo: "documento", titulo: $("document-title").value, categoria: $("document-category").value, arquivo: $("document-url").value, publicado: $("document-published").checked }); event.target.reset(); $("document-published").checked = true; message("document-message", "Documento salvo.", "success"); await loadContent(); } catch (error) { message("document-message", error.message, "error"); }
});
$("announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await contentRequest({ tipo: "comunicado", titulo: $("announcement-title").value, texto: $("announcement-text").value, publicado: $("announcement-published").checked }); event.target.reset(); $("announcement-published").checked = true; message("announcement-message", "Comunicado salvo.", "success"); await loadContent(); } catch (error) { message("announcement-message", error.message, "error"); }
});
