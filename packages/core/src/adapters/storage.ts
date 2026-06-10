/**
 * Storage plugável de documentos (LGPD: dados sob controle do escritório).
 * Drivers: "local" (filesystem) e "s3" (S3/MinIO). Selecionado por STORAGE_DRIVER.
 *
 * Nunca guardamos o binário no banco — apenas a chave do objeto (storageKey).
 */
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";

export interface PutResult {
  key: string;
  size: number;
}

export interface StorageDriver {
  readonly name: string;
  put(key: string, data: Buffer, contentType?: string): Promise<PutResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

// ---------- Local ----------
class LocalStorage implements StorageDriver {
  readonly name = "local";
  constructor(private root: string) {}

  private path(key: string) {
    return join(this.root, key);
  }
  async put(key: string, data: Buffer): Promise<PutResult> {
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, data);
    return { key, size: data.length };
  }
  async get(key: string): Promise<Buffer> {
    return readFile(this.path(key));
  }
  async delete(key: string): Promise<void> {
    await unlink(this.path(key)).catch(() => {});
  }
}

// ---------- S3 / MinIO ----------
class S3Storage implements StorageDriver {
  readonly name = "s3";
  private client: any;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "legaltech-docs";
  }
  private async getClient() {
    if (this.client) return this.client;
    // Import dinâmico para não exigir o SDK quando o driver é "local".
    const { S3Client } = await import("@aws-sdk/client-s3");
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
    return this.client;
  }
  async put(key: string, data: Buffer, contentType?: string): Promise<PutResult> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }));
    return { key, size: data.length };
  }
  async get(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    const res = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks: Buffer[] = [];
    for await (const c of res.Body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(c));
    return Buffer.concat(chunks);
  }
  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

// ---------- Google Drive ----------
class GDriveStorage implements StorageDriver {
  readonly name = "gdrive";

  private async token(): Promise<string> {
    const { getGoogleAccessToken } = await import("../services/google-auth.js");
    return getGoogleAccessToken();
  }
  /** A "key" é o id do arquivo no Drive (retornado pelo upload). */
  async put(key: string, data: Buffer, contentType?: string): Promise<PutResult> {
    const drive = await import("./google-drive.js");
    const token = await this.token();
    const name = key.split("/").pop() ?? key;
    const file = await drive.uploadFile(token, { name, mimeType: contentType, data });
    return { key: file.id, size: data.length };
  }
  async get(key: string): Promise<Buffer> {
    const drive = await import("./google-drive.js");
    return drive.downloadFile(await this.token(), key);
  }
  async delete(key: string): Promise<void> {
    const drive = await import("./google-drive.js");
    await drive.deleteFile(await this.token(), key);
  }
}

let cached: StorageDriver | null = null;

/** Retorna o driver de storage configurado (cacheado). */
export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (driver === "s3") cached = new S3Storage();
  else if (driver === "gdrive") cached = new GDriveStorage();
  else cached = new LocalStorage(process.env.STORAGE_LOCAL_PATH ?? "./storage");
  return cached;
}

/** Gera uma chave de objeto organizada por escopo/ano/mês. */
export function buildStorageKey(scope: string, fileName: string): string {
  const now = new Date();
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${scope}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${Date.now()}-${rand}-${safe}`;
}
