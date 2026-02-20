// Theme Management
let theme = localStorage.getItem("theme") || "light";

// Initialize theme on page load
export function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  theme = savedTheme;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark-body");
  } else {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark-body");
  }

  updateThemeIcons();
}

// Toggle between light and dark theme
export function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark-body");
  } else {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark-body");
  }

  updateThemeIcons();
}

// Update theme toggle button icons
function updateThemeIcons() {
  const sunIcons = document.querySelectorAll(".sun-icon");
  const moonIcons = document.querySelectorAll(".moon-icon");

  sunIcons.forEach((icon) => {
    icon.style.display = theme === "dark" ? "block" : "none";
  });

  moonIcons.forEach((icon) => {
    icon.style.display = theme === "light" ? "block" : "none";
  });
}

// Get current theme
export function getTheme() {
  return theme;
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  // Attach toggle to all theme toggle buttons
  const themeToggles = document.querySelectorAll(".theme-toggle");
  themeToggles.forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });
});
