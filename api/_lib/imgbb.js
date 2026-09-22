export const uploadToImgBB = async ({ image, name, expiration }) => {
  if (!process.env.IMGBB_API_KEY) throw new Error("IMGBB_API_KEY não configurado.");
  const body = new URLSearchParams({ key: process.env.IMGBB_API_KEY, image });
  if (name) body.set("name", name);
  if (expiration) body.set("expiration", String(expiration));
  const response = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || "O ImgBB recusou o upload.");
  return { url: payload.data.url, displayUrl: payload.data.display_url, deleteUrl: payload.data.delete_url };
};
