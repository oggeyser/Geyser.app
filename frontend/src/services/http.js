import axios from "axios";

const fromWindow = window.__ENV__?.API_URL;              //  env.js
const fromVite = import.meta.env.VITE_API_URL;           // Vercel env
const fallback = "http://localhost:4000/api";            // solo dev

const baseURL = fromWindow || fromVite || fallback;

// Log visible en producción 
console.log("🌐 API BASE:", baseURL);

export const http = axios.create({
  baseURL,
});
