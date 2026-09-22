const $ = (id) => document.getElementById(id);
const members = [];
const proposals = [];
const socials = [];
let cargos = [];
let turmas = [];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const renderMembers = () => {
  $("members").innerHTML = members.map((member, index) => `<div class="member-card"><div class="member-role">${String(index + 1).padStart(2, "0")} · ${escapeHtml(member.cargo)}</div><div class="repeatable-fields"><label>Nome completo<input data-member-name="${index}" value="${escapeHtml(member.nome)}" maxlength="120" required placeholder="Nome do integrante"></label><label>Turma / série<select data-member-class="${index}" required><option value="">Escolha a turma</option>${turmas.map((turma) => `<option value="${escapeHtml(turma)}" ${turma === member.turma ? "selected" : ""}>${escapeHtml(turma)}</option>`).join("")}</select></label><label>Apresentação (opcional)<input data-member-bio="${index}" value="${escapeHtml(member.apresentacao)}" maxlength="300" placeholder="Breve apresentação"></label></div></div>`).join("");
};
const renderProposals = () => {
  $("proposals").innerHTML = proposals.map((proposal, index) => `<div class="repeatable-row"><div class="repeatable-fields"><label>Título<input data-proposal-title="${index}" value="${escapeHtml(proposal.titulo)}" maxlength="120" required></label><label>Categoria<input data-proposal-category="${index}" value="${escapeHtml(proposal.categoria)}" maxlength="60" placeholder="Ex.: Cultura, esporte, convivência"></label><label>Descrição<textarea data-proposal-description="${index}" rows="2" maxlength="500" required>${escapeHtml(proposal.descricao)}</textarea></label></div><button class="remove-button" type="button" data-remove-proposal="${index}" aria-label="Remover proposta">×</button></div>`).join("");
  document.querySelectorAll("[data-remove-proposal]").forEach((button) => button.addEventListener("click", () => { sync(); proposals.splice(Number(button.dataset.removeProposal), 1); renderProposals(); }));
};
const renderSocials = () => {
  $("socials").innerHTML = socials.map((social, index) => `<div class="repeatable-row"><div class="repeatable-fields social-fields"><label>Plataforma<input data-social-platform="${index}" value="${escapeHtml(social.plataforma)}" maxlength="40" placeholder="Instagram"></label><label>Link<input data-social-url="${index}" type="url" value="${escapeHtml(social.url)}" placeholder="https://..."></label></div><button class="remove-button" type="button" data-remove-social="${index}" aria-label="Remover rede social">×</button></div>`).join("");
  document.querySelectorAll("[data-remove-social]").forEach((button) => button.addEventListener("click", () => { sync(); socials.splice(Number(button.dataset.removeSocial), 1); renderSocials(); }));
};
const sync = () => {
  document.querySelectorAll("[data-member-name]").forEach((input) => { members[Number(input.dataset.memberName)].nome = input.value; });
  document.querySelectorAll("[data-member-class]").forEach((input) => { members[Number(input.dataset.memberClass)].turma = input.value; });
  document.querySelectorAll("[data-member-bio]").forEach((input) => { members[Number(input.dataset.memberBio)].apresentacao = input.value; });
  document.querySelectorAll("[data-proposal-title]").forEach((input) => { proposals[Number(input.dataset.proposalTitle)].titulo = input.value; });
  document.querySelectorAll("[data-proposal-category]").forEach((input) => { proposals[Number(input.dataset.proposalCategory)].categoria = input.value; });
  document.querySelectorAll("[data-proposal-description]").forEach((input) => { proposals[Number(input.dataset.proposalDescription)].descricao = input.value; });
  document.querySelectorAll("[data-social-platform]").forEach((input) => { socials[Number(input.dataset.socialPlatform)].plataforma = input.value; });
  document.querySelectorAll("[data-social-url]").forEach((input) => { socials[Number(input.dataset.socialUrl)].url = input.value; });
};
const addProposal = () => { sync(); proposals.push({ titulo: "", categoria: "", descricao: "" }); renderProposals(); };
const addSocial = () => { sync(); socials.push({ plataforma: "", url: "" }); renderSocials(); };
$("add-proposal").addEventListener("click", addProposal);
$("add-social").addEventListener("click", addSocial);
const initialize = async () => {
  try {
    const response = await fetch("/api/public");
    const data = await response.json();
    cargos = data.content?.cargos || [];
    turmas = data.content?.turmas || [];
  } catch {
    $("registration-message").textContent = "Não foi possível carregar os cargos configurados.";
    $("registration-message").className = "form-message error";
  }
  if (cargos.length !== 8) {
    $("registration-message").textContent = "A configuração dos oito cargos ainda não está disponível.";
    $("registration-message").className = "form-message error";
    return;
  }
  cargos.forEach((cargo) => members.push({ cargo, nome: "", turma: "", apresentacao: "" }));
  renderMembers();
  addProposal();
};
initialize();
$("registration-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  sync();
  const message = $("registration-message");
  const proposalFields = [...document.querySelectorAll("[data-proposal-title]")];
  const descriptionFields = [...document.querySelectorAll("[data-proposal-description]")];
  if (members.some((member) => !member.nome || !member.turma) || proposalFields.length === 0 || proposalFields.some((field, index) => !field.value.trim() || !descriptionFields[index]?.value.trim())) {
    message.textContent = "Preencha os oito integrantes e pelo menos uma proposta com título e descrição.";
    message.className = "form-message error";
    return;
  }
  const formData = new FormData(event.currentTarget);
  message.textContent = "Enviando inscrição...";
  try {
    const response = await fetch("/api/inscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nome: formData.get("name"), apresentacao: formData.get("presentation"), integrantes: members, propostas: proposals, redes: socials }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Não foi possível enviar a inscrição.");
    message.textContent = `Inscrição enviada para análise. Protocolo: ${body.id}`;
    message.className = "form-message success";
    event.target.reset();
  } catch (error) { message.textContent = error.message; message.className = "form-message error"; }
});
