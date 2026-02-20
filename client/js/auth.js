import { api } from "./api.js";

const TOKEN_KEY = "token";

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerLocal(email, password, full_name, role) {
  const data = await api("/auth/signup", {
    method: "POST",
    body: { email, password, full_name, role },
  });
  setToken(data.token);
  return data.user;
}

export async function loginLocal(email, password) {
  const data = await api("/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  return data.user;
}

export async function loginWithGoogleCredential(credential) {
  // GIS returns a JWT "id_token" as `credential`
  const data = await api("/auth/google/verify", {
    method: "POST",
    body: { credential },
  });
  setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error("No session token");
  const data = await api("/user/me", { token });
  return data.user;
}
export function redirectByRole(role) {
  const map = {
    INVESTOR: "investor.html",
    STARTUP: "startup.html",
    INTERN_SEEKER: "intern.html",
    INFLUENCER: "influencer.html",
    ADMIN: "admin.html"
  };

  const file = map[role] || "intern.html";

  // Always go to pages folder on the *frontend host*
  // If we are already in /pages, use just filename
  const inPages = location.pathname.includes("/pages/");
  return inPages ? `./${file}` : `pages/${file}`;
}
