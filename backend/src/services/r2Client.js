// backend/src/services/r2Client.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // ej: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Sube un archivo a R2 y retorna la URL pública.
 * @param {string} folder - Carpeta lógica dentro del bucket (ej: "documents", "routelogs/start")
 * @param {Express.Multer.File} file - Archivo recibido desde multer (en memoria)
 */
export async function uploadToR2(folder, file) {
  const ext = path.extname(file.originalname) || "";
  const key = `${folder}/${Date.now()}-${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_UPLOADS,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  // La URL pública final
  return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
}

