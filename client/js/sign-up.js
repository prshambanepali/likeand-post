import { CONFIG } from "./config.js";
import {
  loginWithGoogleCredential,
  registerLocal,
  redirectByRole,
} from "./auth.js";
import { toast, $ } from "./ui.js";

$("#signupBtn").addEventListener("click", async () => {
  try {
    const full_name = $("#full_name").value.trim();
    const email = $("#email").value.trim();
    const password = $("#password").value;
    const role = $("#role").value;

    if (!role) throw new Error("Please select account type");

    const user = await registerLocal(email, password, full_name, role);
    toast("Account created ✅", "success");
    window.location.href = redirectByRole(user.role);
  } catch (e) {
    toast(e.message || "Signup failed", "error");
  }
});

// Google Identity Services
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
        // Google users default to INTERN_SEEKER in backend (admin can change role later)
        const user = await loginWithGoogleCredential(response.credential);
        toast("Account created ✅", "success");
        window.location.href = redirectByRole(user.role);
      } catch (e) {
        toast(e.message || "Google signup failed", "error");
      }
    },
  });

  google.accounts.id.renderButton(document.getElementById("googleBtn"), {
    theme: "outline",
    size: "large",
    shape: "pill",
    width: 360,
    text: "signup_with",
  });
};
