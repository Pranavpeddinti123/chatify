import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from the backend root (two levels up from this file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const ENV = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
  HUGGINGFACEHUB_API_TOKEN: process.env.HUGGINGFACEHUB_API_TOKEN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  HF_MODEL: process.env.HF_MODEL,
  HF_EMBEDDING_MODEL: process.env.HF_EMBEDDING_MODEL,
  // Google Generative API / Gemini
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_MODEL: process.env.GOOGLE_MODEL,
  GOOGLE_MAX_OUTPUT_TOKENS: process.env.GOOGLE_MAX_OUTPUT_TOKENS,
  GOOGLE_TEMPERATURE: process.env.GOOGLE_TEMPERATURE,
};

// PORT = 3000
// MONGO_URI = mongodb+srv://pranav:P2@cluster0.xkqc8li.mongodb.net/chatify_db?retryWrites=true&w=majority&appName=Cluster0
// NODE_ENV=development
// RESEND_API_KEY=re_QB1xwyVb_fuGPZT2iQMhd94TKXUtR8o73
// JWT_SECRET = myjwtsecretkey
// EMAIL_FROM = "onboarding@resend.dev"
// EMAIL_FROM_NAME="Burak Orkmez"
// CLIENT_URL=http://localhost:5173