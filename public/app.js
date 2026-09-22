const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const api = async (path, options) => {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
};
const formatDate = (value) => {
  if (!value) return "A definir";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "A definir" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(date);
};
const dateKey = (key) => ({ inscricoesInicio: "Início das inscrições", inscricoesFim: "Fim das inscrições", campanhaInicio: "Início da campanha", campanhaFim: "Fim da campanha", votacaoInicio: "Início da votação", votacaoFim: "Fim da votação", apuracao: "Apuração" }[key] || key);
const renderSlates = (slates) => {
  if (!slates.length) return '<p class="empty-state">Nenhuma chapa foi publicada ainda.</p>';
  return slates.map((slate) => { const president = (slate.integrantes || []).find((member) => /presid|coordenação geral/i.test(member.cargo)); const vice = (slate.integrantes || []).find((member) => /vice/i.test(member.cargo)); return `<article class="slate-card">${slate.imagemUrl ? `<img class="slate-image" src="${escapeHtml(slate.imagemUrl)}" alt="Imagem da ${escapeHtml(slate.nome)}">` : ""}<span class="slate-number">Chapa ${escapeHtml(String(slate.numero))}</span><h3>${escapeHtml(slate.nome)}</h3><p class="slate-summary">${escapeHtml(slate.apresentacao || "Informações públicas da chapa ainda não foram adicionadas.")}</p><div class="slate-leaders"><span><small>Presidência</small><strong>${escapeHtml(president?.nome || "A informar")}</strong></span><span><small>Vice-presidência</small><strong>${escapeHtml(vice?.nome || "A informar")}</strong></span></div><a class="slate-more" href="/chapa?id=${encodeURIComponent(slate.id)}">Ver informações completas <span aria-hidden="true">→</span></a></article>`; }).join("");
};
const renderRules = (texts) => [texts.eleicao.quemPodeVotar, texts.eleicao.quemPodeSerCandidato, texts.eleicao.comoVotar, texts.eleicao.comoRaEUsado, texts.eleicao.apuracao].map((text, index) => `<article class="rule-card"><span class="rule-index">0${index + 1}</span><h3>${["Quem pode votar", "Quem pode ser candidato", "Como é o voto", "Como o RA é usado", "Apuração"][index]}</h3><p>${escapeHtml(text)}</p></article>`).join("");
const renderCalendar = (dates) => Object.entries(dates).map(([key, value]) => `<article class="timeline-item ${value ? "is-defined" : ""}"><time>${escapeHtml(formatDate(value))}</time><strong>${escapeHtml(dateKey(key))}</strong><span>${value ? "Data oficial cadastrada" : "Data a definir pela Comissão"}</span></article>`).join("");
const renderDocuments = (documents) => documents.length ? documents.map((doc) => `<a class="document-item" href="${escapeHtml(doc.arquivo)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(doc.titulo)}</strong><span>${escapeHtml(doc.categoria || "Abrir")} ↗</span></a>`).join("") : '<p class="empty-state">Nenhum documento publicado ainda.</p>';
const renderAnnouncements = (items) => items.length ? items.map((item) => `<article class="announcement-card"><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(item.texto)}</p></article>`).join("") : '<p class="empty-state">Nenhum comunicado publicado.</p>';
const renderBallot = (slates) => {
  const choices = slates.map((slate) => `<label><input type="radio" name="choice" value="${escapeHtml(String(slate.id))}" required><span>Chapa ${escapeHtml(String(slate.numero))} — ${escapeHtml(slate.nome)}</span></label>`);
  if (window.electionConfig.votacao.permiteBranco) choices.push('<label><input type="radio" name="choice" value="branco"><span>Voto em branco</span></label>');
  if (window.electionConfig.votacao.permiteNulo) choices.push('<label><input type="radio" name="choice" value="nulo"><span>Voto nulo</span></label>');
  $("ballot").innerHTML = choices.join("");
};
const render = (data) => {
  const school = data.school;
  const election = data.election;
  const texts = data.content.textos;
  window.electionConfig = election;
  const schoolName = `${school.nome} — ${school.cidade}/${school.estado}`;
  if ($("school")) $("school").textContent = schoolName;
  $("school-location").textContent = `${school.cidade}/${school.estado}`;
  $("school-type").textContent = school.tipo || "Informação oficial da escola";
  $("brand-school").textContent = school.nome;
  $("footer-school").textContent = school.nome;
  $("footer-year").textContent = election.ano;
  $("election-year").textContent = election.ano;
  $("title").textContent = texts.inicio.titulo;
  $("subtitle").textContent = texts.inicio.subtitulo;
  $("about").textContent = texts.inicio.sobre;
  $("chapas-title").textContent = texts.chapas.titulo;
  $("chapas-description").textContent = texts.chapas.descricao;
  $("status").textContent = election.statusPublico || "Informações em atualização";
  $("status-chip").textContent = election.status && election.status !== "configuracao" ? "EM ANDAMENTO" : "AGUARDANDO CONFIGURAÇÃO";
  $("voting-date").textContent = election.datas?.votacaoInicio ? `${formatDate(election.datas.votacaoInicio)}${election.datas?.votacaoFim ? ` até ${formatDate(election.datas.votacaoFim)}` : ""}` : "A definir";
  $("counting-date").textContent = formatDate(election.datas?.apuracao);
  $("slates").innerHTML = renderSlates(data.slates || []);
  $("rules").innerHTML = renderRules(texts);
  $("calendar").innerHTML = renderCalendar(election.datas);
  $("documents").innerHTML = renderDocuments(data.content.documentos);
  $("announcements").innerHTML = renderAnnouncements(data.announcements || []);
  if (election.status === "votacao") {
    $("vote-form").hidden = false;
    $("vote-help").textContent = "A votação está aberta. Informe seu RA e escolha uma opção.";
    renderBallot(data.slates || []);
  }
};
try {
  render(await api("/api/public"));
} catch (error) {
  console.error("Falha ao carregar o portal:", error);
  $("status").textContent = "Não foi possível carregar o status agora.";
  $("slates").innerHTML = '<p class="empty-state">Tente novamente em alguns instantes.</p>';
}
$("vote-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const choice = document.querySelector('input[name="choice"]:checked')?.value;
  const message = $("vote-message");
  message.textContent = "Registrando seu voto...";
  try {
    const result = await api("/api/voting", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ra: $("ra").value, choice }) });
    message.textContent = result.message;
    event.target.reset();
  } catch (error) { message.textContent = error.message; }
});
$("menu-toggle").addEventListener("click", () => {
  const isOpen = $("main-nav").classList.toggle("open");
  $("menu-toggle").setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll("#main-nav a").forEach((link) => link.addEventListener("click", () => $("main-nav").classList.remove("open")));
