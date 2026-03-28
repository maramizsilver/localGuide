// ===== add_news.js =====

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("newsForm");
  const progressFill = document.getElementById("progressFill");
  const charCounter = document.getElementById("charCounter");
  const descriptionField = document.getElementById("description");
  const uploadSection = document.getElementById("uploadSection");
  const pictureInput = document.getElementById("picture");
  const uploadText = document.getElementById("uploadText");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitSpinner = document.getElementById("submitSpinner");
  const cancelBtn = document.getElementById("cancelBtn");
  const previewBtn = document.getElementById("previewBtn");
  const successOverlay = document.getElementById("successOverlay");
  const successMessage = document.getElementById("successMessage");
  const previewOverlay = document.getElementById("previewOverlay");
  const previewModal = document.getElementById("previewModal");

  // ── Champs requis pour la progression ──
  const requiredFields = [
    "titre", "type", "commerce", "description",
    "dateDebut", "adresse", "ville", "email"
  ];

  // ── Barre de progression ──
  function updateProgress() {
    let filled = 0;
    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== "") filled++;
    });
    const conditions = document.getElementById("conditions");
    if (conditions && conditions.checked) filled++;

    const total = requiredFields.length + 1;
    const pct = Math.round((filled / total) * 100);
    progressFill.style.width = pct + "%";
  }

  requiredFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateProgress);
    if (el) el.addEventListener("change", updateProgress);
  });
  document.getElementById("conditions")?.addEventListener("change", updateProgress);

  // ── Compteur de caractères ──
  if (descriptionField && charCounter) {
    descriptionField.addEventListener("input", () => {
      charCounter.textContent = `${descriptionField.value.length}/700 caractères`;
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
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  pictureInput.addEventListener("change", () => {
    if (pictureInput.files[0]) handleFile(pictureInput.files[0]);
  });

  let previewImageSrc = null;

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

    const reader = new FileReader();
    reader.onload = (e) => { previewImageSrc = e.target.result; };
    reader.readAsDataURL(file);
  }

  // ── Tags ──
  const tagsInput = document.getElementById("tagsInput");
  const tagsList = document.getElementById("tagsList");
  const tagsHidden = document.getElementById("tagsHidden");
  let tags = [];

  tagsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagsInput.value.trim().replace(/,/g, "");
      if (val && !tags.includes(val) && tags.length < 6) {
        tags.push(val);
        renderTags();
      }
      tagsInput.value = "";
    }
    if (e.key === "Backspace" && !tagsInput.value && tags.length) {
      tags.pop();
      renderTags();
    }
  });

  function renderTags() {
    tagsList.innerHTML = "";
    tags.forEach((tag, i) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.innerHTML = `${tag} <button type="button" aria-label="Supprimer ${tag}">×</button>`;
      pill.querySelector("button").addEventListener("click", () => {
        tags.splice(i, 1);
        renderTags();
      });
      tagsList.appendChild(pill);
    });
    tagsHidden.value = tags.join(",");
  }

  // ── Validation ──
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return !phone || /^(\+?[0-9\s\-]{7,16})$/.test(phone.trim());
  }

  function validateUrl(url) {
    if (!url) return true;
    try { new URL(url); return true; } catch { return false; }
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

    // Titre
    const titre = document.getElementById("titre");
    const titreError = document.getElementById("titreError");
    if (!titre.value.trim()) { showError(titreError); titre.classList.add("invalid"); valid = false; }
    else { hideError(titreError); titre.classList.remove("invalid"); }

    // Type
    const type = document.getElementById("type");
    const typeError = document.getElementById("typeError");
    if (!type.value) { showError(typeError); type.classList.add("invalid"); valid = false; }
    else { hideError(typeError); type.classList.remove("invalid"); }

    // Commerce
    const commerce = document.getElementById("commerce");
    const commerceError = document.getElementById("commerceError");
    if (!commerce.value.trim()) { showError(commerceError); commerce.classList.add("invalid"); valid = false; }
    else { hideError(commerceError); commerce.classList.remove("invalid"); }

    // Description
    const description = document.getElementById("description");
    const descriptionError = document.getElementById("descriptionError");
    if (!description.value.trim() || description.value.trim().length < 30) {
      showError(descriptionError); description.classList.add("invalid"); valid = false;
    } else { hideError(descriptionError); description.classList.remove("invalid"); }

    // Date début
    const dateDebut = document.getElementById("dateDebut");
    const dateDebutError = document.getElementById("dateDebutError");
    if (!dateDebut.value) { showError(dateDebutError); dateDebut.classList.add("invalid"); valid = false; }
    else { hideError(dateDebutError); dateDebut.classList.remove("invalid"); }

    // Date fin (optionnelle mais doit être après début si remplie)
    const dateFin = document.getElementById("dateFin");
    const dateFinError = document.getElementById("dateFinError");
    if (dateFin.value && dateDebut.value && dateFin.value < dateDebut.value) {
      showError(dateFinError); dateFin.classList.add("invalid"); valid = false;
    } else { hideError(dateFinError); dateFin.classList.remove("invalid"); }

    // Adresse
    const adresse = document.getElementById("adresse");
    const adresseError = document.getElementById("adresseError");
    if (!adresse.value.trim()) { showError(adresseError); adresse.classList.add("invalid"); valid = false; }
    else { hideError(adresseError); adresse.classList.remove("invalid"); }

    // Ville
    const ville = document.getElementById("ville");
    const villeError = document.getElementById("villeError");
    if (!ville.value.trim()) { showError(villeError); ville.classList.add("invalid"); valid = false; }
    else { hideError(villeError); ville.classList.remove("invalid"); }

    // Lien (optionnel)
    const lien = document.getElementById("lien");
    const lienError = document.getElementById("lienError");
    if (!validateUrl(lien.value)) { showError(lienError); lien.classList.add("invalid"); valid = false; }
    else { hideError(lienError); lien.classList.remove("invalid"); }

    // Email
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) { showError(emailError); email.classList.add("invalid"); valid = false; }
    else { hideError(emailError); email.classList.remove("invalid"); }

    // Téléphone (optionnel)
    const phone = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    if (!validatePhone(phone.value)) { showError(phoneError); phone.classList.add("invalid"); valid = false; }
    else { hideError(phoneError); phone.classList.remove("invalid"); }

    // Conditions
    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  // ── Soumission ──
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = form.querySelector(".error-message.visible");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

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

  // ── Aperçu ──
  previewBtn.addEventListener("click", () => {
    const titre = document.getElementById("titre").value || "Titre de la nouveauté";
    const commerce = document.getElementById("commerce").value || "Commerce";
    const ville = document.getElementById("ville").value || "Ville";
    const description = document.getElementById("description").value || "Aucune description.";
    const dateDebut = document.getElementById("dateDebut").value;
    const dateFin = document.getElementById("dateFin").value;
    const typeVal = document.getElementById("type");
    const typeText = typeVal.options[typeVal.selectedIndex]?.text || "Nouveauté";

    document.getElementById("previewTitre").textContent = titre;
    document.getElementById("previewCommerce").textContent = `${commerce} — ${ville}`;
    document.getElementById("previewDesc").textContent = description;
    document.getElementById("previewBadge").textContent = typeText.replace(/^.\s/, "");

    let datesText = "📅 ";
    if (dateDebut) {
      datesText += formatDate(dateDebut);
      if (dateFin) datesText += ` → ${formatDate(dateFin)}`;
    } else {
      datesText += "Non renseigné";
    }
    document.getElementById("previewDates").textContent = datesText;

    const previewImgWrap = document.getElementById("previewImgWrap");
    if (previewImageSrc) {
      previewImgWrap.innerHTML = `<img src="${previewImageSrc}" alt="preview" />`;
    } else {
      previewImgWrap.innerHTML = "<span>🖼️</span>";
    }

    previewOverlay.classList.add("visible");
    previewModal.classList.add("visible");
  });

  function formatDate(str) {
    const d = new Date(str);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  }

  window.closePreview = function () {
    previewOverlay.classList.remove("visible");
    previewModal.classList.remove("visible");
  };

  previewOverlay.addEventListener("click", () => {
    // Ferme uniquement la modale de preview si elle est ouverte
    if (previewModal.classList.contains("visible")) closePreview();
  });

  // ── Annuler ──
  cancelBtn.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment annuler ? Vos informations seront perdues.")) {
      resetForm();
    }
  });

  function resetForm() {
    form.reset();
    tags = [];
    renderTags();
    tagsInput.value = "";
    progressFill.style.width = "0%";
    charCounter.textContent = "0/700 caractères";
    uploadText.textContent = "Déposez votre image ici";
    uploadSection.style.borderColor = "";
    previewImageSrc = null;
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    form.querySelectorAll(".error-message.visible").forEach((el) => el.classList.remove("visible"));
  }

  // ── Succès ──
  function openSuccessMessage() {
    successOverlay.classList.add("visible");
    successMessage.classList.add("visible");
    progressFill.style.width = "100%";
  }

  window.closeSuccessMessage = function () {
    successOverlay.classList.remove("visible");
    successMessage.classList.remove("visible");
    resetForm();
  };

  // ── Inline validation blur ──
  ["titre", "commerce", "adresse", "ville"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      const err = document.getElementById(id + "Error");
      if (!el.value.trim()) { showError(err); el.classList.add("invalid"); }
      else { hideError(err); el.classList.remove("invalid"); }
    });
  });

  document.getElementById("email").addEventListener("blur", () => {
    const el = document.getElementById("email");
    const err = document.getElementById("emailError");
    if (!validateEmail(el.value)) { showError(err); el.classList.add("invalid"); }
    else { hideError(err); el.classList.remove("invalid"); }
  });

  document.getElementById("dateFin").addEventListener("change", () => {
    const debut = document.getElementById("dateDebut").value;
    const fin = document.getElementById("dateFin").value;
    const err = document.getElementById("dateFinError");
    if (fin && debut && fin < debut) { showError(err); document.getElementById("dateFin").classList.add("invalid"); }
    else { hideError(err); document.getElementById("dateFin").classList.remove("invalid"); }
  });
});
