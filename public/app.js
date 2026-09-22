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
  return Number.isNaN(date.getTime()) ? "A definir" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
};
const formatDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).reduce((result, part) => { result[part.type] = part.value; return result; }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const dateKey = (key) => ({ inscricoesInicio: "Início das inscrições", inscricoesFim: "Fim das inscrições", campanhaInicio: "Início da campanha", campanhaFim: "Fim da campanha", votacaoInicio: "Início da votação", votacaoFim: "Fim da votação", apuracao: "Apuração" }[key] || key);
const renderSlates = (slates) => {
  if (!slates.length) return '<p class="empty-state">Nenhuma chapa foi publicada ainda.</p>';
  return slates.map((slate) => { const president = (slate.integrantes || []).find((member) => /presid|coordenação geral/i.test(member.cargo)); const vice = (slate.integrantes || []).find((member) => /vice/i.test(member.cargo)); const image = slate.imagemUrl ? `<img class="slate-image" src="${escapeHtml(slate.imagemUrl)}" alt="Imagem da ${escapeHtml(slate.nome)}">` : '<div class="slate-image slate-image-placeholder" aria-hidden="true"></div>'; return `<article class="slate-card">${image}<span class="slate-number">Chapa ${escapeHtml(String(slate.numero))}</span><h3>${escapeHtml(slate.nome)}</h3><p class="slate-summary">${escapeHtml(slate.apresentacao || "Informações públicas da chapa ainda não foram adicionadas.")}</p><div class="slate-leaders"><span><small>Presidência</small><strong>${escapeHtml(president?.nome || "A informar")}</strong></span><span><small>Vice-presidência</small><strong>${escapeHtml(vice?.nome || "A informar")}</strong></span></div><a class="slate-more" href="/chapa?id=${encodeURIComponent(slate.id)}">Ver informações completas <span aria-hidden="true">→</span></a></article>`; }).join("");
};
const renderRules = (texts) => [texts.eleicao.quemPodeVotar, texts.eleicao.quemPodeSerCandidato, texts.eleicao.comoVotar, texts.eleicao.comoRaEUsado, texts.eleicao.apuracao].map((text, index) => `<article class="rule-card"><span class="rule-index">0${index + 1}</span><h3>${["Quem pode votar", "Quem pode ser candidato", "Como é o voto", "Como o RA é usado", "Apuração"][index]}</h3><p>${escapeHtml(text)}</p></article>`).join("");
const renderCalendar = (dates) => Object.entries(dates).map(([key, value]) => `<article class="timeline-item ${value ? "is-defined" : ""}"><time>${escapeHtml(formatDate(value))}</time><strong>${escapeHtml(dateKey(key))}</strong></article>`).join("");
const statuteUrl = "https://docs.google.com/document/d/154zRk2niV64O-Lacm4dVLfmr7R5ySSsX/edit?usp=sharing&ouid=114036570556280466312&rtpof=true&sd=true";
const renderDocuments = (documents) => [`<a class="document-item document-item-featured" href="${statuteUrl}" target="_blank" rel="noopener noreferrer"><span class="document-icon material-symbols-outlined">picture_as_pdf</span><strong>Estatuto completo do Grêmio</strong><span>Consultar ↗</span></a>`, ...(documents || []).map((doc) => `<a class="document-item" href="${escapeHtml(doc.arquivo)}" target="_blank" rel="noopener noreferrer"><span class="document-icon material-symbols-outlined">picture_as_pdf</span><strong>${escapeHtml(doc.titulo)}</strong><span>${escapeHtml(doc.categoria || "Abrir")} ↗</span></a>`)].join("");
const renderAnnouncements = (items) => items.length ? items.map((item) => `<article class="announcement-card"><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(item.texto)}</p></article>`).join("") : '<p class="empty-state">Nenhum comunicado publicado.</p>';
const renderFooter = (footer, school) => {
  const data = footer || {};
  $("footer-school").textContent = data.titulo || school.nome;
  $("footer-subtitle").textContent = data.subtitulo || "Portal eleitoral";
  $("footer-description").textContent = data.descricao || "";
  $("footer-address").textContent = data.endereco || "";
  $("footer-phone").textContent = data.telefone || "";
  $("footer-email").textContent = data.email ? ` · ${data.email}` : "";
  $("footer-credit").textContent = data.credito || "Ação da Chapa Revolução";
  $("footer-commission-title").textContent = data.comissaoTitulo || "Comissão Eleitoral";
  $("footer-commission-text").textContent = data.comissaoTexto || "";
  $("footer-school-bottom").textContent = data.titulo || school.nome;
};
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
  renderFooter(data.footer, school);
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
  const start = Date.parse(election.datas?.votacaoInicio || ""), end = Date.parse(election.datas?.votacaoFim || ""), withinWindow = Number.isFinite(start) && Number.isFinite(end) && Date.now() >= start && Date.now() <= end;
  const votingOpen = election.votingEnabled === true && (election.votingTestMode === true || withinWindow);
  const votingEnded = election.datas?.votacaoFim && Date.now() > Date.parse(election.datas.votacaoFim);
  $("votar").classList.toggle("official-vote-locked", !votingOpen);
  $("vote-form").hidden = !votingOpen;
  $("vote-locked-message").hidden = votingOpen;
  $("vote-locked-message").textContent = votingEnded || election.status === "encerrada" ? "A votação foi encerrada. Consulte o calendário e os comunicados para acompanhar a apuração." : "A votação não está aberta. Consulte o calendário para saber quando ela estará disponível.";
  $("vote-help").textContent = votingOpen ? "A votação está aberta. Informe seu RA e escolha uma opção." : "A votação só fica disponível durante o período oficial.";
  if (votingOpen) {
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
$("votar").addEventListener("click", (event) => {
  if (!$("votar").classList.contains("official-vote-locked")) return;
  event.preventDefault();
  event.stopPropagation();
  const notice = document.createElement("div");
  notice.className = "vote-click-notice";
  notice.textContent = "A votação ainda não está disponível. Verifique o calendário.";
  notice.style.left = `${Math.min(event.clientX, window.innerWidth - 290)}px`;
  notice.style.top = `${Math.min(event.clientY, window.innerHeight - 80)}px`;
  document.body.append(notice);
  window.setTimeout(() => { notice.remove(); document.querySelector("#calendario")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 4000);
});
$("menu-toggle").addEventListener("click", () => {
  const isOpen = $("main-nav").classList.toggle("open");
  $("menu-toggle").setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll("#main-nav a").forEach((link) => link.addEventListener("click", () => $("main-nav").classList.remove("open")));
