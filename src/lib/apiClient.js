import axios from "axios";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Create axios instance with interceptor for auth token
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/rest/v1`,
  headers: {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return config;
});

export default apiClient;


