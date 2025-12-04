import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  }
});

export const uploadSingle = (fieldName) => multer({ storage }).single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 10) =>
  multer({ storage }).array(fieldName, maxCount);
export const uploadAny = () => multer({ storage }).any();
