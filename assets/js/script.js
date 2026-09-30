const languageToggle = document.getElementById("language-toggle");
const translatableElements = document.querySelectorAll("[data-es][data-en]");
const filterButtons = document.querySelectorAll(".filter");
const labCards = document.querySelectorAll(".lab-card");

function setLanguage(language) {
  translatableElements.forEach((element) => {
    if (element.dataset[language] !== undefined) {
      element.textContent = element.dataset[language];
    }
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

// --- Scroll reveal ---------------------------------------------------
const revealTargets = document.querySelectorAll(
  ".featured-card, .lab-card, .method-card, .writing-card, .signal-item, .section-heading, .principle"
);

revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("in"));
}

// --- Code block language label + copy button (project pages) ---------
document.querySelectorAll("div.highlighter-rouge").forEach((block) => {
  const langClass = [...block.classList].find((c) => c.startsWith("language-"));
  const lang = langClass ? langClass.replace("language-", "") : "code";
  block.setAttribute("data-lang", lang);

  const codeEl = block.querySelector("code");
  if (!codeEl) return;

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "code-copy";
  copyBtn.textContent = "Copiar";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar"), 1600);
    });
  });

  block.appendChild(copyBtn);
});

// --- Explainer widgets (interactive demo blocks inside a project) ----
document.querySelectorAll(".explainer").forEach((widget) => {
  const groups = widget.querySelectorAll(".pill-group");
  const output = widget.querySelector(".explainer-output .value");
  const runBtn = widget.querySelector(".explainer-run");
  if (!output || !runBtn) return;

  groups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const pill = event.target.closest(".pill-toggle");
      if (!pill) return;
      group.querySelectorAll(".pill-toggle").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  runBtn.addEventListener("click", () => {
    const base = parseInt(widget.dataset.base || "10", 10);
    const variance = parseInt(widget.dataset.variance || "6", 10);
    let multiplier = 1;

    groups.forEach((group) => {
      const active = group.querySelector(".pill-toggle.active");
      const weight = active ? parseFloat(active.dataset.weight || "1") : 1;
      multiplier *= weight;
    });

    const value = Math.max(1, Math.round(base * multiplier + (Math.random() * variance - variance / 2)));

    output.classList.add("pulse");
    output.textContent = value;
    setTimeout(() => output.classList.remove("pulse"), 350);
  });
});
