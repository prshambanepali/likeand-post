import { listPosts } from "./posts.js";
import { api } from "./api.js";
import { fetchMe, getToken, clearSession } from "./auth.js";
import { toast } from "./ui.js";

if (!getToken()) {
  window.location.href = "../index.html";
}

const statusEl = document.getElementById("status");
const feedEl = document.getElementById("feed");

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

  // Hard guard: if not investor -> unauthorized
  if (me.role !== "INVESTOR") {
    window.location.href = "./unauthorized.html";
  }

  return me;
}

function renderFeed(posts) {
  if (!posts || posts.length === 0) {
    feedEl.innerHTML = `<p class="small">No startup ideas yet.</p>`;
    return;
  }

  feedEl.innerHTML = posts
    .map((p) => {
      const title = escapeHtml(p.title);
      const body = escapeHtml(p.body);
      const author = escapeHtml(p.full_name || p.email || "Startup");
      const count = Number(p.interest_count || 0);

      return `
        <div style="border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.04); border-radius:16px; padding:14px; margin-top:12px;">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div>
              <div style="font-weight:800; font-size:16px;">${title}</div>
              <div class="small">By ${author}</div>
            </div>
            <button
              class="like-btn ${p.liked_by_me ? "liked" : ""}"
              data-id="${p.id}"
              data-count="${count}"
            >❤️ ${count}</button>
          </div>

          <p style="margin:10px 0 0; color:rgba(255,255,255,.80); line-height:1.6;">
            ${body}
          </p>
        </div>
      `;
    })
    .join("");

  // attach like handlers
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.id;

      try {
        const res = await api(`/posts/${postId}/interested`, {
          method: "POST",
          token: getToken(),
        });

        // update count locally
        const current = parseInt(btn.innerText.split(" ")[1]) || 0;

        if (res.liked) {
          btn.classList.add("liked");
          btn.innerHTML = `❤️ ${current + 1}`;
        } else {
          btn.classList.remove("liked");
          btn.innerHTML = `❤️ ${Math.max(0, current - 1)}`;
        }
      } catch (e) {
        toast(e.message || "Failed to update interest", "error");
      }
    });
  });
}

async function main() {
  try {
    statusEl.textContent = "Loading your profile...";
    await loadProfile();

    statusEl.textContent = "Loading startup ideas...";
    const data = await listPosts();

    statusEl.textContent = "You are logged in ✅";
    renderFeed(data.posts);
  } catch (e) {
    console.error(e);
    toast("Session expired or API error. Please login again.", "error");
    clearSession();
    setTimeout(() => (window.location.href = "../index.html"), 800);
  }
}

main();