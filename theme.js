// CLASS B theme state is applied before stylesheets render to avoid a light-mode flash.
(function () {
  const root = document.documentElement;
  const storageKey = "system-creator-theme";
  let theme = "light";

  try {
    theme = localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch (error) {
    console.warn("Theme preference could not be read from local storage.", error);
  }
  root.dataset.theme = theme;

  const applyTheme = (nextTheme, persist) => {
    theme = nextTheme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#0B1120" : "#F8FAFC";
    const button = document.querySelector(".theme-toggle");
    if (button) {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
      button.title = `Switch to ${dark ? "light" : "dark"} mode`;
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        console.warn("Theme preference could not be saved to local storage.", error);
      }
    }
  };

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "dark" ? "#0B1120" : "#F8FAFC";

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("class-b")) return;
    const nav = document.querySelector(".main-nav");
    const accountLink = nav && nav.querySelector("[data-account-link]");
    if (!nav || !accountLink) {
      console.error("CLASS B theme switcher could not initialize because the account navigation link is missing.");
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-pressed", String(theme === "dark"));
    button.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
    button.title = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
    button.innerHTML = '<span class="theme-toggle-icon theme-icon-sun" aria-hidden="true">☀️</span><span class="theme-toggle-icon theme-icon-moon" aria-hidden="true">🌙</span><span class="sr-only">Toggle light and dark theme</span>';
    button.addEventListener("click", () => {
      document.body.classList.add("theme-animating");
      applyTheme(theme === "dark" ? "light" : "dark", true);
      window.setTimeout(() => document.body.classList.remove("theme-animating"), 280);
    });
    accountLink.after(button);
  });
})();
