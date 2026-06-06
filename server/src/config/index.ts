import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  weatherAiApiKey: requireEnv("WEATHERAI_API_KEY"),
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  weatherAiBaseUrl: "https://api.weather-ai.co",
  allowedOrigins: requireEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((origin) => origin.trim()),
  firebase: {
    projectId: requireEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requireEnv("FIREBASE_PRIVATE_KEY"),
  },
} as const;
