import { api } from "./api.js";
import { getToken } from "./auth.js";

export async function listPosts() {
  return api("/posts", { token: getToken() });
}

export async function createPost(title, body) {
  return api("/posts", {
    method: "POST",
    token: getToken(),
    body: { title, body },
  });
}

export async function myPosts() {
  return api("/posts/mine", { token: getToken() });
}

export async function savePost(id) {
  return api(`/posts/${id}/save`, { method: "POST", token: getToken() });
}

export async function unsavePost(id) {
  return api(`/posts/${id}/save`, { method: "DELETE", token: getToken() });
}

export async function savedPosts() {
  return api("/posts/saved/list", { token: getToken() });
}

export async function adminHidePost(id, is_hidden) {
  return api(`/posts/${id}/hide`, {
    method: "PATCH",
    token: getToken(),
    body: { is_hidden },
  });
}

export async function adminDeletePost(id) {
  return api(`/posts/${id}`, { method: "DELETE", token: getToken() });
}

export async function markInterested(id, message = "") {
  return api(`/posts/${id}/interested`, {
    method: "POST",
    token: getToken(),
    body: { message },
  });
}

export async function unmarkInterested(id) {
  return api(`/posts/${id}/interested`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function myPostInterests() {
  // startup only
  return api("/posts/mine/interests", { token: getToken() });
}
