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

// Add auth token to requests (fallback to anonymous key if no session)
apiClient.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      // Use anonymous key for unauthenticated requests
      config.headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    }
  } catch (error) {
    // Fallback to anonymous key if auth fails
    config.headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    console.log("Using anonymous access for API requests");
  }
  return config;
});

export default apiClient;


