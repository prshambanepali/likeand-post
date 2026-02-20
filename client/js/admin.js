import { api } from "./api.js";
import { fetchMe, clearSession, getToken } from "./auth.js";
import { toast } from "./ui.js";

if (!getToken()) window.location.href = "../index.html";

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 500);
});

async function ensureAdmin() {
  const me = await fetchMe();
  if (me.role !== "ADMIN") window.location.href = "./unauthorized.html";
  return me;
}

function render(users) {
  const wrap = document.getElementById("tableWrap");

  wrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr>
            <td>${u.email}</td>
            <td>${u.full_name || "—"}</td>
            <td>
              <select data-role="${u.id}">
                ${[
                  "INVESTOR",
                  "STARTUP",
                  "INTERN_SEEKER",
                  "INFLUENCER",
                  "ADMIN",
                ]
                  .map(
                    (r) =>
                      `<option value="${r}" ${
                        u.role === r ? "selected" : ""
                      }>${r}</option>`
                  )
                  .join("")}
              </select>
            </td>
            <td>${u.is_active ? "✅" : "⛔"}</td>
            <td>
              <button class="btn secondary" data-save="${
                u.id
              }" style="margin-top:0;">Save</button>
              <button class="btn danger" data-toggle="${u.id}" data-active="${
              u.is_active
            }" style="margin-top:8px;">
                ${u.is_active ? "Disable" : "Enable"}
              </button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-save");
      const sel = wrap.querySelector(`select[data-role="${id}"]`);
      const role = sel.value;

      try {
        await api(`/admin/users/${id}/role`, {
          method: "PATCH",
          token: getToken(),
          body: { role },
        });
        toast("Role updated ✅", "success");
        await loadUsers();
      } catch (e) {
        toast(e.message || "Update failed", "error");
      }
    });
  });

  wrap.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-toggle");
      const active = btn.getAttribute("data-active") === "true";

      try {
        await api(`/admin/users/${id}/active`, {
          method: "PATCH",
          token: getToken(),
          body: { is_active: !active },
        });
        toast(!active ? "User enabled ✅" : "User disabled ⛔", "success");
        await loadUsers();
      } catch (e) {
        toast(e.message || "Update failed", "error");
      }
    });
  });
}

async function loadUsers() {
  const data = await api("/admin/users", { token: getToken() });
  render(data.users);
}

await ensureAdmin();
await loadUsers();
