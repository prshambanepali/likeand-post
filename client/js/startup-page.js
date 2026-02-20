import { api } from "./api.js";
import { fetchMe, getToken, clearSession } from "./auth.js";
import { toast } from "./ui.js";

if (!getToken()) window.location.href = "../index.html";

const statusEl = document.getElementById("status");
const myPostsEl = document.getElementById("myPosts");

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 400);
});

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadProfile() {
  const me = await fetchMe();

  document.getElementById("name").textContent = me.full_name || "User";
  document.getElementById("email").textContent = me.email;
  document.getElementById("role").textContent = `Role: ${me.role}`;

  const img = document.getElementById("avatar");
  if (me.avatar_url) {
    img.src = me.avatar_url;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }

  // ✅ Hard guard
  if (me.role !== "STARTUP") window.location.href = "./unauthorized.html";

  return me;
}

function renderMyPosts(posts) {
  if (!posts || posts.length === 0) {
    myPostsEl.innerHTML = `<p class="small" style="margin-top:10px;">No ideas posted yet.</p>`;
    return;
  }

  myPostsEl.innerHTML = `
    <div style="margin-top:14px;">
      <h3 style="margin:0 0 8px;">My Posts</h3>
      ${posts
        .map(
          (p) => `
        <div style="border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.04); border-radius:16px; padding:12px; margin-top:10px;">
          <div style="font-weight:800;">${escapeHtml(p.title)}</div>
          <div class="small" style="margin-top:4px;">${new Date(
            p.created_at
          ).toLocaleString()}</div>
          <div style="margin-top:8px; color:rgba(255,255,255,.80); line-height:1.6;">
            ${escapeHtml(p.body)}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

async function loadMyPosts() {
  const data = await api("/posts/mine", { token: getToken() });
  renderMyPosts(data.posts);
}

async function publishIdea() {
  const titleEl = document.getElementById("ideaTitle");
  const bodyEl = document.getElementById("ideaBody");

  const title = titleEl.value.trim();
  const body = bodyEl.value.trim();

  if (!title || !body) {
    toast("Please enter title and description", "error");
    return;
  }

  // Disable button while publishing
  const btn = document.getElementById("postIdea");
  btn.disabled = true;
  btn.textContent = "Publishing...";

  try {
    await api("/posts", {
      method: "POST",
      token: getToken(),
      body: { title, body },
    });

    toast("Idea published ✅", "success");

    titleEl.value = "";
    bodyEl.value = "";

    await loadMyPosts();
  } catch (e) {
    toast(e.message || "Publish failed", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Publish";
  }
}

document.getElementById("postIdea").addEventListener("click", publishIdea);

async function main() {
  try {
    statusEl.textContent = "Loading your profile...";
    await loadProfile();

    statusEl.textContent = "Loading your posts...";
    await loadMyPosts();

    statusEl.textContent = "You are logged in ✅";
  } catch (e) {
    console.error(e);
    toast("Session expired or API error. Please login again.", "error");
    clearSession();
    setTimeout(() => (window.location.href = "../index.html"), 800);
  }
}

main();
