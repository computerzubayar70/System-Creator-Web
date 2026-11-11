// SYSTEM CREATOR – login UI + Firebase Authentication (classic script: UI works even if Firebase fails to load)
(function () {
  const $ = (s) => document.querySelector(s);
  const pageType = document.body.dataset.page || "";
  const cfg = window.firebaseConfig || {};
  const configured = cfg.apiKey && !String(cfg.apiKey).startsWith("YOUR_");
  const accountLinks = document.querySelectorAll("[data-account-link]");
  const authMessage = $("#auth-message"), profileMessage = $("#profile-message");
  const FB = "https://www.gstatic.com/firebasejs/10.12.2/";

  const say = (el, text, type) => { if (el) { el.textContent = text; el.dataset.type = type || "info"; } };
  const msg = (t, type) => say(pageType === "profile" ? profileMessage : authMessage, t, type);

  const friendly = (e) => {
    const map = {
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/wrong-password": "Email or password is incorrect.",
      "auth/user-not-found": "No account found with this email.",
      "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
      "auth/weak-password": "Password is too weak. Use at least 8 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/missing-password": "Please enter your password.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/network-request-failed": "Network error. Check your internet connection and try again.",
      "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
      "auth/cancelled-popup-request": "Google sign-in was cancelled.",
      "auth/popup-blocked": "Your browser blocked the Google pop-up. Allow pop-ups for this site and try again.",
      "auth/unauthorized-domain": "This website's domain is not authorized. In Firebase: Authentication → Settings → Authorized domains → add it.",
      "auth/operation-not-allowed": "This sign-in method is not enabled. In Firebase: Authentication → Sign-in method → enable it.",
      "auth/configuration-not-found": "Authentication is not set up. In Firebase console open Authentication and press “Get started”.",
      "auth/invalid-api-key": "The Firebase apiKey in firebase-config.js is wrong. Copy it again from Project settings.",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "The Firebase apiKey in firebase-config.js is wrong. Copy it again from Project settings.",
      "auth/operation-not-supported-in-this-environment": "This needs the site to run on http(s). Use a local server (e.g. VS Code Live Server) or your hosting, not a double-clicked file."
    };
    return map[e && e.code] || ("Something went wrong" + (e && e.code ? " (" + e.code + ")" : "") + ". Please try again.");
  };

  // ── Header log-out button ──
  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button"; logoutBtn.className = "nav-logout"; logoutBtn.textContent = "Log out"; logoutBtn.hidden = true;
  if (accountLinks[0]) accountLinks[0].after(logoutBtn);
  const renderNav = (user) => {
    accountLinks.forEach((l) => { l.textContent = user ? "My profile" : "Log in"; l.href = user ? "profile.html" : "login.html"; });
    logoutBtn.hidden = !user;
  };

  // ── UI that must always work (no Firebase needed) ──
  let firebase = null; // filled once Firebase loads
  const needFirebase = () => {
    if (firebase) return true;
    if (location.protocol === "file:") msg("Open this site through a local server (e.g. VS Code “Live Server”) or your hosting. Firebase cannot run from a double-clicked file.", "error");
    else if (!configured) msg("Firebase is not set up yet. Paste your config into firebase-config.js (see the comments inside).", "error");
    else msg("Firebase could not load. Check your internet connection and refresh the page.", "error");
    return false;
  };

  if (pageType === "login") {
    const loginForm = $("#login-form"), registerForm = $("#register-form");
    const loginTab = $("#show-login"), registerTab = $("#show-register");
    const showTab = (login) => {
      loginForm.hidden = !login; registerForm.hidden = login;
      loginTab.classList.toggle("is-active", login); registerTab.classList.toggle("is-active", !login);
      loginTab.setAttribute("aria-pressed", String(login)); registerTab.setAttribute("aria-pressed", String(!login));
      say(authMessage, "");
    };
    loginTab.addEventListener("click", () => showTab(true));
    registerTab.addEventListener("click", () => showTab(false));
    if (location.hash === "#register") showTab(false);
    if (new URLSearchParams(location.search).has("logout")) say(authMessage, "You have been logged out.", "success");

    document.querySelectorAll(".pw-toggle").forEach((btn) => btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    }));

    const pw = $("#register-password"), meter = $("#pw-meter");
    pw.addEventListener("input", () => {
      const v = pw.value;
      const score = [v.length >= 8, /[A-Z]/.test(v) && /[a-z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
      meter.dataset.level = v ? Math.max(1, score) : 0;
    });

    const busy = (form, b) => form.querySelectorAll("button").forEach((x) => { if (!x.classList.contains("pw-toggle")) x.disabled = b; });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); say(authMessage, "");
      if (!needFirebase()) return;
      busy(loginForm, true);
      try { await firebase.signIn(firebase.auth, $("#login-email").value.trim(), $("#login-password").value); location.href = "profile.html"; }
      catch (err) { console.error(err); say(authMessage, friendly(err), "error"); busy(loginForm, false); }
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault(); say(authMessage, "");
      const name = $("#register-name").value.trim();
      if (name.length < 2) return say(authMessage, "Enter a name with at least two characters.", "error");
      if ($("#register-password").value.length < 8) return say(authMessage, "Use a password with at least 8 characters.", "error");
      if (!needFirebase()) return;
      busy(registerForm, true);
      sessionStorage.setItem("sc-busy", "1");
      try {
        const cred = await firebase.create(firebase.auth, $("#register-email").value.trim(), $("#register-password").value);
        try { await firebase.updateProfile(cred.user, { displayName: name }); } catch (x) { console.warn(x); }
        try { await firebase.verify(cred.user); } catch (x) { console.warn(x); }
        sessionStorage.removeItem("sc-busy");
        location.href = "profile.html?welcome=1";
      } catch (err) { console.error(err); sessionStorage.removeItem("sc-busy"); say(authMessage, friendly(err), "error"); busy(registerForm, false); }
    });

    $("#google-button").addEventListener("click", async () => {
      say(authMessage, "");
      if (!needFirebase()) return;
      sessionStorage.setItem("sc-busy", "1");
      sessionStorage.setItem("sc-google-redirect-pending", "1");
      try { await firebase.redirect(firebase.auth, new firebase.Google()); }
      catch (err) {
        console.error(err);
        sessionStorage.removeItem("sc-google-redirect-pending");
        sessionStorage.removeItem("sc-busy");
        say(authMessage, friendly(err), "error");
      }
    });

    $("#forgot-button").addEventListener("click", async () => {
      const email = $("#login-email").value.trim();
      if (!email) { $("#login-email").focus(); return say(authMessage, "Type your email in the box above first, then press “Forgot password?”.", "error"); }
      if (!needFirebase()) return;
      try { await firebase.reset(firebase.auth, email); say(authMessage, "Password reset email sent to " + email + ". Check your inbox and spam folder.", "success"); }
      catch (err) { console.error(err); say(authMessage, friendly(err), "error"); }
    });
  }

  // ── Profile page ──
  const doLogout = async () => {
    if (!firebase) { location.href = "login.html"; return; }
    try { await firebase.signOut(firebase.auth); location.href = "login.html?logout=1"; }
    catch (e) { msg(friendly(e), "error"); }
  };
  logoutBtn.addEventListener("click", doLogout);

  const renderProfile = (user) => {
    const card = $(".profile-card");
    if (!user) {
      card.classList.add("profile-signed-out"); $("#profile-login-link").hidden = false;
      if (configured && firebase) say(profileMessage, "You are not signed in. Log in or create an account to view your profile.", "info");
      return;
    }
    card.classList.remove("profile-signed-out"); $("#profile-login-link").hidden = true;
    const name = user.displayName || user.email.split("@")[0];
    $("#profile-name").textContent = name;
    $("#profile-email").textContent = user.email;
    $("#profile-provider").textContent = user.providerData[0] && user.providerData[0].providerId === "google.com" ? "Google" : "Email & password";
    $("#profile-since").textContent = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
    const avatar = $("#profile-avatar");
    if (user.photoURL) { avatar.textContent = ""; const img = document.createElement("img"); img.src = user.photoURL; img.alt = ""; img.referrerPolicy = "no-referrer"; avatar.append(img); }
    else avatar.textContent = name.split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
    const badge = $("#profile-verified");
    badge.textContent = user.emailVerified ? "Verified" : "Not verified"; badge.dataset.ok = String(user.emailVerified);
    $("#resend-verification").hidden = user.emailVerified;
    $("#welcome-name").textContent = name.split(" ")[0];
    if (new URLSearchParams(location.search).has("welcome")) say(profileMessage, "Account created! We sent a verification email to " + user.email + ".", "success");
  };

  if (pageType === "profile") {
    $("#logout-button").addEventListener("click", doLogout);
    $("#resend-verification").addEventListener("click", async () => {
      try { await firebase.verify(firebase.auth.currentUser); say(profileMessage, "Verification email sent.", "success"); }
      catch (e) { say(profileMessage, friendly(e), "error"); }
    });
  }

  // ── Load Firebase (errors are shown, never silent) ──
  (async function init() {
    if (!configured) { renderNav(null); if (pageType === "profile") renderProfile(null); if (pageType === "login") needFirebase(); return; }
    try {
      const [app, a] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js")]);
      firebase = {
        auth: a.getAuth(app.initializeApp(cfg)), signIn: a.signInWithEmailAndPassword, create: a.createUserWithEmailAndPassword,
        redirect: a.signInWithRedirect, getRedirectResult: a.getRedirectResult,
        Google: a.GoogleAuthProvider, signOut: a.signOut, updateProfile: a.updateProfile,
        reset: a.sendPasswordResetEmail, verify: a.sendEmailVerification
      };
      if (pageType === "login" && sessionStorage.getItem("sc-google-redirect-pending")) {
        try {
          const result = await firebase.getRedirectResult(firebase.auth);
          sessionStorage.removeItem("sc-google-redirect-pending");
          sessionStorage.removeItem("sc-busy");
          if (result && result.user) {
            location.replace("profile.html");
            return;
          }
        } catch (e) {
          console.error("Google sign-in redirect failed", e);
          sessionStorage.removeItem("sc-google-redirect-pending");
          sessionStorage.removeItem("sc-busy");
          say(authMessage, friendly(e), "error");
        }
      }
      a.onAuthStateChanged(firebase.auth, (user) => {
        renderNav(user);
        if (pageType === "profile") renderProfile(user);
        if (pageType === "login" && user && !sessionStorage.getItem("sc-busy")) location.replace("profile.html");
      });
    } catch (e) {
      console.error("Firebase failed to load", e);
      renderNav(null); if (pageType === "profile") renderProfile(null);
      if (location.protocol === "file:") needFirebase(); else msg("Could not load Firebase. Check your internet connection and refresh.", "error");
    }
  })();
})();
