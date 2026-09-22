const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const root = document.getElementById("slate-detail");
const render = (slate) => {
  const members = slate.integrantes || [];
  root.innerHTML = `<section class="slate-detail-card">${slate.imagemUrl ? `<img class="slate-detail-image" src="${escapeHtml(slate.imagemUrl)}" alt="Imagem da ${escapeHtml(slate.nome)}">` : ""}<span class="slate-number">Chapa ${escapeHtml(slate.numero)}</span><h1>${escapeHtml(slate.nome)}</h1><p class="slate-detail-presentation">${escapeHtml(slate.apresentacao)}</p><div class="detail-block"><h2>Integrantes</h2><div class="detail-members">${members.map((member) => `<article><strong>${escapeHtml(member.nome)}</strong><span>${escapeHtml(member.cargo)} · ${escapeHtml(member.turma)}</span>${member.apresentacao ? `<p>${escapeHtml(member.apresentacao)}</p>` : ""}</article>`).join("")}</div></div><div class="detail-block"><h2>Propostas</h2><div class="detail-proposals">${(slate.propostas || []).map((proposal) => `<article><h3>${escapeHtml(proposal.titulo)}</h3><p>${escapeHtml(proposal.descricao)}</p></article>`).join("") || "<p>Esta chapa ainda não publicou propostas.</p>"}</div></div>${(slate.redes || []).length ? `<div class="detail-block"><h2>Redes sociais</h2><div class="detail-links">${slate.redes.map((social) => `<a href="${escapeHtml(social.url)}" target="_blank" rel="noreferrer">${escapeHtml(social.plataforma)} ↗</a>`).join("")}</div></div>` : ""}</section>`;
};
try {
  const id = new URLSearchParams(location.search).get("id");
  const response = await fetch("/api/public");
  const data = await response.json();
  const slate = (data.slates || []).find((item) => item.id === id);
  if (!slate) throw new Error("Chapa não encontrada ou ainda não publicada.");
  document.title = `${slate.nome} | Portal Eleitoral`;
  document.getElementById("school-name").textContent = data.school?.nome || "Grêmio Estudantil";
  render(slate);
} catch (error) { root.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`; }
