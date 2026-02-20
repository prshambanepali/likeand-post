import { fetchMe, clearSession, getToken } from "./auth.js";
import { toast, $ } from "./ui.js";

// If no token, go back to login
if (!getToken()) {
  window.location.href = "../index.html";
}

async function loadProfile() {
  try {
    const me = await fetchMe();

    $("#status").textContent = "You are logged in ✅";
    $("#name").textContent = me.full_name || "User";
    $("#email").textContent = me.email;
    $("#provider").textContent = `Provider: ${me.auth_provider}`;
    $("#role").textContent = `Role: ${me.role}`;

    $("#uid").textContent = me.id || "—";
    $("#prov2").textContent = me.auth_provider || "—";
    $("#role2").textContent = me.role || "—";

    const img = $("#avatar");
    if (me.avatar_url) {
      img.src = me.avatar_url;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }

    // Show admin link only for ADMIN
    const adminLink = document.getElementById("adminLink");
    if (adminLink)
      adminLink.style.display = me.role === "ADMIN" ? "block" : "none";

    $("#stat2").textContent = me.is_active ? "Active" : "Disabled";
  } catch (e) {
    toast("Session expired. Please login again.", "error");
    clearSession();
    setTimeout(() => (window.location.href = "../index.html"), 700);
  }
}

// Logout
$("#logout").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 500);
});

const refreshBtn = $("#refreshBtn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    $("#status").textContent = "Refreshing...";
    await loadProfile();
    toast("Profile refreshed ✅", "success");
  });
}

loadProfile();
