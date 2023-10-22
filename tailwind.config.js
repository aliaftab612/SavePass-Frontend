/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "src/app/auth/auth.component.html",
    "src/app/header/header.component.html",
    "src/app/general-passwords/general-passwords-list/general-passwords.component.html",
    "src/app/general-passwords/edit-general-password/edit-general-password.component.html",
    "src/app/update-profile/update-profile.component.html",
    "src/app/not-found/not-found.component.html",
    "src/index.html",
    "src/app/lock/lock.component.html",
    "src/app/update-lock-time/update-lock-time.component.html",
    "src/app/modal/modal.component.html",
    "src/app/modal/modal.component.css",
    "src/app/settings/settings.component.html",
    "src/app/settings/two-factor/two-factor.component.html",
    "src/app/update-profile/update-profile.component.ts",
    "src/app/settings/two-factor/two-factor.component.ts",
    "src/app/update-lock-time/update-lock-time.component.ts",
    "src/app/settings/two-factor/totp-authentication-setup/totp-authentication-setup.component.html",
    "src/app/verify-master-password/verify-master-password.component.html",
    "src/app/auth/two-factor-auth/two-factor-auth.component.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
