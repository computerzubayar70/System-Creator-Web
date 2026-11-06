// Waits until the account page and shared navigation have loaded.
document.addEventListener("DOMContentLoaded", () => { // Starts account setup after the browser parses the page.
  // Defines the browser storage keys used by this local demonstration.
  const accountsKey = "systemCreatorDemoAccounts"; // Stores demo profiles and password hashes on this device.
  const sessionKey = "systemCreatorDemoSession"; // Stores the active demo sign-in for this browser tab session.
  // Finds shared navigation and account-page elements when they exist.
  const accountLinks = document.querySelectorAll("[data-account-link]"); // Finds account links that appear in every page header.
  const pageType = document.body.dataset.page || ""; // Identifies login and profile pages without requiring a framework.
  const loginForm = document.querySelector("#login-form"); // Finds the sign-in form on the login page.
  const registerForm = document.querySelector("#register-form"); // Finds the registration form on the login page.
  const accountMessage = document.querySelector("#auth-message"); // Finds the sign-in and registration status message.
  const profileMessage = document.querySelector("#profile-message"); // Finds the profile access status message.
  // Reads locally stored accounts and rejects malformed data instead of hiding corruption.
  const loadAccounts = () => { // Returns the browser-local account list.
    const savedAccounts = localStorage.getItem(accountsKey); // Reads the account list from this browser.
    if (savedAccounts === null) return []; // Starts with an empty list when no local profiles exist.
    const accounts = JSON.parse(savedAccounts); // Parses persisted account data.
    if (!Array.isArray(accounts)) throw new Error("Saved account data is not a valid list."); // Rejects unexpected storage shapes.
    return accounts; // Returns the validated account list.
  }; // Ends the local account reader.
  // Reports browser storage and Web Crypto errors directly on the current account page.
  const showError = (element, error) => { // Displays a useful message without silently swallowing a failure.
    console.error("SYSTEM CREATOR demo account error:", error); // Keeps diagnostic details available to the site owner.
    if (element) element.textContent = error instanceof Error ? error.message : "The account action could not be completed. Please try again."; // Shows a readable explanation to the visitor.
  }; // Ends the shared error reporter.
  // Converts a byte array into the Base64 format used for a random password salt.
  const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes)); // Stores random salt bytes in a portable text format.
  // Derives a salted password hash so demo passwords are not stored as plain text.
  const hashPassword = async (password, salt) => { // Uses the browser's built-in PBKDF2 implementation.
    const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]); // Imports the password for key derivation without making it exportable.
    const saltBytes = Uint8Array.from(atob(salt), (character) => character.charCodeAt(0)); // Restores the random salt from Base64.
    const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 120000, hash: "SHA-256" }, passwordKey, 256); // Derives a salted hash using 120,000 iterations.
    return Array.from(new Uint8Array(hashBits), (byte) => byte.toString(16).padStart(2, "0")).join(""); // Converts the hash bytes to hexadecimal text.
  }; // Ends the password hash function.
  // Updates account navigation to match whether this browser has an active session.
  const updateAccountLinks = () => { // Makes each page header reflect the current local sign-in.
    const signedInEmail = sessionStorage.getItem(sessionKey); // Checks the active tab session.
    accountLinks.forEach((link) => { // Updates every matching account link.
      link.textContent = signedInEmail ? "My profile" : "Log in"; // Shows the appropriate account action.
      link.href = signedInEmail ? "profile.html" : "login.html"; // Directs the action to the matching page.
      link.setAttribute("aria-label", signedInEmail ? "View your profile" : "Log in or create a profile"); // Provides context for assistive technology.
    }); // Ends account navigation updates.
  }; // Ends the shared navigation updater.
  updateAccountLinks(); // Shows the correct account link when each page opens.
  // Explains a successful sign-out when the login page is reached from the profile.
  if (pageType === "login" && new URLSearchParams(window.location.search).has("logout") && accountMessage) accountMessage.textContent = "You have been logged out of this browser session."; // Confirms that the local session ended.
  // Switches between sign-in and account creation forms.
  const loginTab = document.querySelector("#show-login"); // Finds the sign-in tab button.
  const registerTab = document.querySelector("#show-register"); // Finds the account creation tab button.
  if (loginTab && registerTab && loginForm && registerForm) { // Binds tab behavior only on the account page.
    loginTab.addEventListener("click", () => { // Shows the sign-in form.
      loginForm.hidden = false; // Makes the sign-in fields visible.
      registerForm.hidden = true; // Hides account creation fields.
      loginTab.classList.add("is-active"); // Highlights the sign-in tab.
      registerTab.classList.remove("is-active"); // De-emphasizes the account creation tab.
      loginTab.setAttribute("aria-pressed", "true"); // Announces the active sign-in tab.
      registerTab.setAttribute("aria-pressed", "false"); // Announces the inactive registration tab.
      accountMessage.textContent = ""; // Clears feedback from the other form.
    }); // Ends the sign-in tab action.
    registerTab.addEventListener("click", () => { // Shows the account creation form.
      loginForm.hidden = true; // Hides sign-in fields.
      registerForm.hidden = false; // Makes account creation fields visible.
      loginTab.classList.remove("is-active"); // De-emphasizes the sign-in tab.
      registerTab.classList.add("is-active"); // Highlights the account creation tab.
      loginTab.setAttribute("aria-pressed", "false"); // Announces the inactive sign-in tab.
      registerTab.setAttribute("aria-pressed", "true"); // Announces the active registration tab.
      accountMessage.textContent = ""; // Clears feedback from the other form.
    }); // Ends the account creation tab action.
  } // Ends account form tab setup.
  // Registers a new browser-local demo profile.
  if (registerForm && accountMessage) { // Attaches registration behavior when its form is present.
    registerForm.addEventListener("submit", async (event) => { // Handles account creation without a server.
      event.preventDefault(); // Keeps the registration submission on this page.
      accountMessage.textContent = ""; // Removes previous validation feedback.
      try { // Reports storage and Web Crypto failures in the account interface.
        if (!crypto.subtle) throw new Error("This browser does not support secure password hashing. Open the site in a modern browser."); // Prevents saving a password without its salted hash.
        const name = document.querySelector("#register-name").value.trim(); // Reads the new profile's display name.
        const email = document.querySelector("#register-email").value.trim().toLowerCase(); // Normalizes the email used as the account identifier.
        const password = document.querySelector("#register-password").value; // Reads the new password for hashing only.
        if (name.length < 2) throw new Error("Enter a name with at least two characters."); // Validates profile names beyond browser defaults.
        if (password.length < 8) throw new Error("Use a password with at least eight characters."); // Enforces the advertised minimum password length.
        const accounts = loadAccounts(); // Reads existing local demo profiles.
        if (accounts.some((account) => account.email === email)) throw new Error("An account with this email already exists in this browser."); // Prevents duplicate local profiles.
        const salt = toBase64(crypto.getRandomValues(new Uint8Array(16))); // Creates a unique random salt for this profile.
        const passwordHash = await hashPassword(password, salt); // Derives a salted password hash using Web Crypto.
        accounts.push({ name, email, salt, passwordHash }); // Adds only the profile details, salt, and password hash.
        localStorage.setItem(accountsKey, JSON.stringify(accounts)); // Persists demo accounts in this browser.
        sessionStorage.setItem(sessionKey, email); // Signs in the newly created profile for this tab session.
        window.location.href = "profile.html"; // Opens the new profile after successful registration.
      } catch (error) { // Converts account creation errors into visible feedback.
        showError(accountMessage, error); // Reports the failure rather than pretending registration succeeded.
      } // Ends account creation error handling.
    }); // Ends the registration submit handler.
  } // Ends registration form setup.
  // Signs into an existing browser-local demo profile.
  if (loginForm && accountMessage) { // Attaches sign-in behavior when its form is present.
    loginForm.addEventListener("submit", async (event) => { // Handles sign-in with locally saved profile data.
      event.preventDefault(); // Keeps the sign-in submission on this page.
      accountMessage.textContent = ""; // Removes previous sign-in feedback.
      try { // Reports storage and Web Crypto failures in the account interface.
        if (!crypto.subtle) throw new Error("This browser does not support secure password hashing. Open the site in a modern browser."); // Requires the same password hashing support used for registration.
        const email = document.querySelector("#login-email").value.trim().toLowerCase(); // Normalizes the email before matching the stored profile.
        const password = document.querySelector("#login-password").value; // Reads the password to verify without storing it.
        const accounts = loadAccounts(); // Loads locally registered demo profiles.
        const account = accounts.find((savedAccount) => savedAccount.email === email); // Finds the profile associated with this email.
        if (!account || await hashPassword(password, account.salt) !== account.passwordHash) throw new Error("Email or password is incorrect for this browser's demo accounts."); // Rejects missing accounts or an incorrect password.
        sessionStorage.setItem(sessionKey, email); // Creates a sign-in session for this browser tab.
        window.location.href = "profile.html"; // Opens the account profile after a successful sign-in.
      } catch (error) { // Converts sign-in failures into visible feedback.
        showError(accountMessage, error); // Reports the failure instead of silently ignoring it.
      } // Ends sign-in error handling.
    }); // Ends the sign-in submit handler.
  } // Ends sign-in form setup.
  // Displays saved profile details only for the currently signed-in local demo account.
  if (pageType === "profile") { // Runs profile display only on the dedicated profile page.
    const nameField = document.querySelector("#profile-name"); // Finds the profile display name.
    const emailField = document.querySelector("#profile-email"); // Finds the profile email display.
    const avatar = document.querySelector("#profile-avatar"); // Finds the profile initials mark.
    const logoutButton = document.querySelector("#logout-button"); // Finds the profile sign-out control.
    const signedInEmail = sessionStorage.getItem(sessionKey); // Reads the active browser-local session.
    try { // Shows storage errors instead of disguising them as a signed-out state.
      if (!signedInEmail) { // Handles a visitor who has not signed in on this tab.
        profileMessage.textContent = "You are not signed in. Log in or create a demo profile to view your account."; // Explains why profile details are unavailable.
        document.querySelector(".profile-card").classList.add("profile-signed-out"); // Hides account-only details until a profile is signed in.
        document.querySelector("#profile-login-link").hidden = false; // Provides a direct link to sign-in and registration.
      } else { // Loads the local profile for a signed-in visitor.
        const account = loadAccounts().find((savedAccount) => savedAccount.email === signedInEmail); // Finds the signed-in profile in browser storage.
        if (!account) throw new Error("This profile is no longer available in this browser. Please create an account or sign in again."); // Reports a stale session instead of inventing profile data.
        nameField.textContent = account.name; // Displays the saved profile name safely as text.
        emailField.textContent = account.email; // Displays the saved profile email safely as text.
        avatar.textContent = account.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join(""); // Creates an initials badge from the profile name.
      } // Ends signed-in profile lookup.
    } catch (error) { // Surfaces profile lookup and storage errors.
      showError(profileMessage, error); // Explains why the profile could not be loaded.
    } // Ends profile display error handling.
    if (logoutButton) { // Adds sign-out behavior when its control is present.
      logoutButton.addEventListener("click", () => { // Ends the browser-local session.
        try { // Reports browser storage failures during sign-out.
          sessionStorage.removeItem(sessionKey); // Removes the active session without deleting the saved demo profile.
          window.location.href = "login.html?logout=1"; // Returns the visitor to the sign-in page.
        } catch (error) { // Surfaces failures rather than leaving the button without feedback.
          showError(profileMessage, error); // Explains why this browser could not end the session.
        } // Ends sign-out error handling.
      }); // Ends the sign-out button action.
    } // Ends sign-out control setup.
  } // Ends profile page behavior.
}); // Ends shared account setup.
