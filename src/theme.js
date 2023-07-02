const systemMediaEvent = window.matchMedia("(prefers-color-scheme: dark)");

const registerSystemThemeChangeListener = () => {
  systemMediaEvent.addEventListener("change", themeChangeCallback);
};

const themeChangeCallback = () => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

const setTheme = () => {
  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  if (!("theme" in localStorage)) {
    registerSystemThemeChangeListener();
  }
};

switchTheme = (newTheme) => {
  if (newTheme === "dark") {
    localStorage.theme = "dark";
    systemMediaEvent.removeEventListener("change", themeChangeCallback);
    setTheme();
  } else if (newTheme === "light") {
    localStorage.theme = "light";
    systemMediaEvent.removeEventListener("change", themeChangeCallback);
    setTheme();
  } else {
    localStorage.removeItem("theme");
    setTheme();
  }
};

setTheme();
