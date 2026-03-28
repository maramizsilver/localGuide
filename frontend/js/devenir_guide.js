document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("guideForm");
  const progressFill = document.getElementById("progressFill");
  const charCounter = document.getElementById("charCounter");
  const motivationField = document.getElementById("motivation");
  const uploadSection = document.getElementById("uploadSection");
  const pictureInput = document.getElementById("picture");
  const uploadText = document.getElementById("uploadText");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitSpinner = document.getElementById("submitSpinner");
  const cancelBtn = document.getElementById("cancelBtn");
  const successOverlay = document.getElementById("successOverlay");
  const successMessage = document.getElementById("successMessage");

  // ── Champs requis pour la progression ──
  const requiredFields = [
    "prenom",
    "nom",
    "email",
    "phone",
    "ville",
    "specialite",
    "experience",
    "motivation",
  ];

  // ── Barre de progression ──
  function updateProgress() {
    let filled = 0;

    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== "") filled++;
    });

    // Langues cochées
    const languesChecked = document.querySelectorAll(
      'input[name="langues"]:checked'
    ).length;
    if (languesChecked > 0) filled++;

    // Conditions acceptées
    const conditions = document.getElementById("conditions");
    if (conditions && conditions.checked) filled++;

    const total = requiredFields.length + 2; // +langues +conditions
    const pct = Math.round((filled / total) * 100);
    progressFill.style.width = pct + "%";
  }

  requiredFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateProgress);
  });

  document.querySelectorAll('input[name="langues"]').forEach((cb) => {
    cb.addEventListener("change", updateProgress);
  });

  document
    .getElementById("conditions")
    ?.addEventListener("change", updateProgress);

  // ── Compteur de caractères ──
  if (motivationField && charCounter) {
    motivationField.addEventListener("input", () => {
      const len = motivationField.value.length;
      charCounter.textContent = `${len}/600 caractères`;
      updateProgress();
    });
  }

  // ── Upload photo ──
  uploadSection.addEventListener("click", () => pictureInput.click());

  uploadSection.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = "var(--primary)";
  });

  uploadSection.addEventListener("dragleave", () => {
    uploadSection.style.borderColor = "";
  });

  uploadSection.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  pictureInput.addEventListener("change", () => {
    if (pictureInput.files[0]) handleFile(pictureInput.files[0]);
  });

  function handleFile(file) {
    const error = document.getElementById("pictureError");
    const maxSize = 5 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      showError(error, "Format non supporté. Utilisez JPG ou PNG.");
      return;
    }
    if (file.size > maxSize) {
      showError(error, "Fichier trop lourd (max 5MB).");
      return;
    }

    error.classList.remove("visible");
    uploadText.textContent = `✅ ${file.name}`;
    uploadSection.style.borderColor = "var(--primary)";
  }

  // ── Validation ──
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^(\+?[0-9\s\-]{7,16})$/.test(phone.trim());
  }

  function showError(el, msg = null) {
    if (msg) el.textContent = msg;
    el.classList.add("visible");
  }

  function hideError(el) {
    el.classList.remove("visible");
  }

  function validateForm() {
    let valid = true;

    // Prénom
    const prenom = document.getElementById("prenom");
    const prenomError = document.getElementById("prenomError");
    if (!prenom.value.trim()) {
      showError(prenomError);
      prenom.classList.add("invalid");
      valid = false;
    } else {
      hideError(prenomError);
      prenom.classList.remove("invalid");
    }

    // Nom
    const nom = document.getElementById("nom");
    const nomError = document.getElementById("nomError");
    if (!nom.value.trim()) {
      showError(nomError);
      nom.classList.add("invalid");
      valid = false;
    } else {
      hideError(nomError);
      nom.classList.remove("invalid");
    }

    // Email
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) {
      showError(emailError);
      email.classList.add("invalid");
      valid = false;
    } else {
      hideError(emailError);
      email.classList.remove("invalid");
    }

    // Téléphone
    const phone = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    if (!validatePhone(phone.value)) {
      showError(phoneError);
      phone.classList.add("invalid");
      valid = false;
    } else {
      hideError(phoneError);
      phone.classList.remove("invalid");
    }

    // Ville
    const ville = document.getElementById("ville");
    const villeError = document.getElementById("villeError");
    if (!ville.value.trim()) {
      showError(villeError);
      ville.classList.add("invalid");
      valid = false;
    } else {
      hideError(villeError);
      ville.classList.remove("invalid");
    }

    // Spécialité
    const specialite = document.getElementById("specialite");
    const specialiteError = document.getElementById("specialiteError");
    if (!specialite.value) {
      showError(specialiteError);
      specialite.classList.add("invalid");
      valid = false;
    } else {
      hideError(specialiteError);
      specialite.classList.remove("invalid");
    }

    // Expérience
    const experience = document.getElementById("experience");
    const experienceError = document.getElementById("experienceError");
    if (!experience.value) {
      showError(experienceError);
      experience.classList.add("invalid");
      valid = false;
    } else {
      hideError(experienceError);
      experience.classList.remove("invalid");
    }

    // Langues
    const languesChecked = document.querySelectorAll(
      'input[name="langues"]:checked'
    ).length;
    const languesError = document.getElementById("languesError");
    if (languesChecked === 0) {
      showError(languesError);
      valid = false;
    } else {
      hideError(languesError);
    }

    // Motivation
    const motivation = document.getElementById("motivation");
    const motivationError = document.getElementById("motivationError");
    if (!motivation.value.trim() || motivation.value.trim().length < 50) {
      showError(motivationError);
      motivation.classList.add("invalid");
      valid = false;
    } else {
      hideError(motivationError);
      motivation.classList.remove("invalid");
    }

    // Conditions
    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) {
      showError(conditionsError);
      valid = false;
    } else {
      hideError(conditionsError);
    }

    return valid;
  }

  // ── Soumission ──
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll vers la première erreur
      const firstError = form.querySelector(".error-message.visible");
      if (firstError)
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Simulation d'envoi
    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";
    submitBtn.disabled = true;

    setTimeout(() => {
      submitText.style.display = "inline";
      submitSpinner.style.display = "none";
      submitBtn.disabled = false;
      openSuccessMessage();
    }, 1800);
  });

  // ── Annuler ──
  cancelBtn.addEventListener("click", () => {
    if (
      confirm("Voulez-vous vraiment annuler ? Vos informations seront perdues.")
    ) {
      form.reset();
      progressFill.style.width = "0%";
      charCounter.textContent = "0/600 caractères";
      uploadText.textContent = "Déposez votre photo ici";
      uploadSection.style.borderColor = "";
      // Supprimer les classes invalid
      form
        .querySelectorAll(".invalid")
        .forEach((el) => el.classList.remove("invalid"));
      form
        .querySelectorAll(".error-message.visible")
        .forEach((el) => el.classList.remove("visible"));
    }
  });

  // ── Succès ──
  function openSuccessMessage() {
    successOverlay.classList.add("visible");
    successMessage.classList.add("visible");
    progressFill.style.width = "100%";
  }

  window.closeSuccessMessage = function () {
    successOverlay.classList.remove("visible");
    successMessage.classList.remove("visible");
    form.reset();
    progressFill.style.width = "0%";
    charCounter.textContent = "0/600 caractères";
    uploadText.textContent = "Déposez votre photo ici";
    uploadSection.style.borderColor = "";
  };

  // ── Inline validation au blur ──
  ["prenom", "nom", "ville"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      const err = document.getElementById(id + "Error");
      if (!el.value.trim()) {
        showError(err);
        el.classList.add("invalid");
      } else {
        hideError(err);
        el.classList.remove("invalid");
      }
    });
  });

  document.getElementById("email").addEventListener("blur", () => {
    const el = document.getElementById("email");
    const err = document.getElementById("emailError");
    if (!validateEmail(el.value)) {
      showError(err);
      el.classList.add("invalid");
    } else {
      hideError(err);
      el.classList.remove("invalid");
    }
  });

  document.getElementById("phone").addEventListener("blur", () => {
    const el = document.getElementById("phone");
    const err = document.getElementById("phoneError");
    if (!validatePhone(el.value)) {
      showError(err);
      el.classList.add("invalid");
    } else {
      hideError(err);
      el.classList.remove("invalid");
    }
  });
});
