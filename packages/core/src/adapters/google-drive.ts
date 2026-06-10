/**
 * Adapter Google Drive (API v3) — upload/download/delete de arquivos.
 * Usa multipart upload. Recebe access_token já válido (ver services/google-auth).
 */

const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const FILES = "https://www.googleapis.com/drive/v3/files";

/** Faz upload de um arquivo e retorna o id do Drive. */
export async function uploadFile(
  accessToken: string,
  opts: { name: string; mimeType?: string; data: Buffer; parentId?: string },
): Promise<{ id: string; webViewLink?: string }> {
  const boundary = "legaltech" + Math.random().toString(36).slice(2);
  const metadata: Record<string, unknown> = { name: opts.name };
  if (opts.parentId) metadata.parents = [opts.parentId];

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${opts.mimeType ?? "application/octet-stream"}\r\n\r\n`),
    opts.data,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(`${UPLOAD}?uploadType=multipart&fields=id,webViewLink`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string; webViewLink?: string };
}

export async function downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
  const res = await fetch(`${FILES}/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Drive download: ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${FILES}/${fileId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok && res.status !== 404) throw new Error(`Drive delete: ${res.status} ${await res.text()}`);
}

/** Cria (ou retorna) uma pasta pelo nome no Drive. */
export async function ensureFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
      (parentId ? ` and '${parentId}' in parents` : ""),
  );
  const found = await fetch(`${FILES}?q=${q}&fields=files(id)`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (found.ok) {
    const data = (await found.json()) as { files?: { id: string }[] };
    if (data.files?.[0]) return data.files[0].id;
  }
  const res = await fetch(`${FILES}?fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }),
  });
  if (!res.ok) throw new Error(`Drive folder: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}
