
import axios from "axios";

function resolveBaseURL() {
  // 1) Runtime env.js (si lo estás usando)
  if (typeof window !== "undefined" && window.__ENV__?.VITE_API_URL) {
    return window.__ENV__.VITE_API_URL;
  }

  // 2) Vite build-time env (Vercel)
  if (import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 3) fallback SOLO para desarrollo local
  return "http://localhost:4000/api";
}

export const http = axios.create({
  baseURL: resolveBaseURL(),
});

