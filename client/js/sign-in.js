import { CONFIG } from "./config.js";
import { loginWithGoogleCredential, loginLocal } from "./auth.js";
import { toast, $ } from "./ui.js";
import { redirectByRole } from "./auth.js";

$("#loginBtn").addEventListener("click", async () => {
  try {
    const email = $("#email").value.trim();
    const password = $("#password").value;
    const user = await loginLocal(email, password);
    toast("Login successful ✅", "success");
    window.location.href = redirectByRole(user.role);
  } catch (e) {
    toast(e.message || "Login failed", "error");
  }
});

// Load Google Identity Services
const s = document.createElement("script");
s.src = "https://accounts.google.com/gsi/client?hl=en";
s.async = true;
s.defer = true;
document.head.appendChild(s);

s.onload = () => {
  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const user = await loginWithGoogleCredential(response.credential);
        toast("Login successful ✅", "success");
        window.location.href = redirectByRole(user.role);
      } catch (e) {
        toast(e.message || "Google login failed", "error");
      }
    },
  });

  google.accounts.id.renderButton(document.getElementById("googleBtn"), {
    theme: "outline",
    size: "large",
    shape: "pill",
    width: 360,
    text: "continue_with",
  });
};
