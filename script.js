const languageToggle = document.getElementById("language-toggle");
const translatableElements = document.querySelectorAll("[data-es][data-en]");
const filterButtons = document.querySelectorAll(".filter");
const labCards = document.querySelectorAll(".lab-card");

function setLanguage(language) {
  translatableElements.forEach((element) => {
    element.textContent = element.dataset[language];
  });

  document.documentElement.lang = language;

  if (languageToggle) {
    languageToggle.textContent = language === "es" ? "EN" : "ES";
  }

  localStorage.setItem("preferredLanguage", language);
}

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem("preferredLanguage");

  if (savedLanguage === "es" || savedLanguage === "en") {
    return savedLanguage;
  }

  const browserLanguage = navigator.language || navigator.userLanguage;

  if (browserLanguage && browserLanguage.startsWith("en")) {
    return "en";
  }

  return "es";
}

if (languageToggle) {
  languageToggle.addEventListener("click", () => {
    const currentLanguage = document.documentElement.lang;
    const newLanguage = currentLanguage === "es" ? "en" : "es";

    setLanguage(newLanguage);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    labCards.forEach((card) => {
      const cardTags = card.dataset.tags || "";

      if (selectedFilter === "all" || cardTags.includes(selectedFilter)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });
});

setLanguage(getInitialLanguage());
