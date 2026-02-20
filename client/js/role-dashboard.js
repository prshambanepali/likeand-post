import { fetchMe, clearSession, getToken } from "./auth.js";
import { toast } from "./ui.js";

if (!getToken()) window.location.href = "../index.html";

function pageRoleFromPath() {
  const file = location.pathname.split("/").pop();
  const map = {
    "investor.html": "INVESTOR",
    "startup.html": "STARTUP",
    "intern.html": "INTERN_SEEKER",
    "influencer.html": "INFLUENCER",
  };
  return map[file] || null;
}

async function load() {
  try {
    const me = await fetchMe();

    const expected = pageRoleFromPath();
    if (me.role === "ADMIN") {
      // Admin can access admin panel only
      window.location.href = "./admin.html";
      return;
    }
    if (expected && me.role !== expected) {
      window.location.href = "./unauthorized.html";
      return;
    }

    document.getElementById("status").textContent = "You are logged in ✅";
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
  } catch (e) {
    toast("Session expired. Please login again.", "error");
    clearSession();
    setTimeout(() => (window.location.href = "../index.html"), 700);
  }
}

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 500);
});

load();
