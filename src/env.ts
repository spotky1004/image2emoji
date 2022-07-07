import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

function getPath(url: string) {
  const __filename = fileURLToPath(url);
  const __dirname = path.dirname(__filename);
  return {
    __filename,
    __dirname,
  };
}

const { __dirname } = getPath(import.meta.url);

export default function initEnv() {
  if (process.env.NODE_ENV === "development") {
    dotenv.config({
      path: path.join(__dirname, "../env/.env.development")
    });
  } else if (process.env.NODE_ENV === "production") {
    dotenv.config({
      path: path.join(__dirname, "../env/.env.production")
    });
  }
}
