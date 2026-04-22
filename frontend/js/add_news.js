// frontend/js/add_news.js
import { supabase } from './supabaseClient.js'

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

  // Variables
  let previewImageSrc = null;
  let tags = [];

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
    if (progressFill) progressFill.style.width = pct + "%";
  }

  requiredFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateProgress);
      el.addEventListener("change", updateProgress);
    }
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
  if (uploadSection) {
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
  }

  if (pictureInput) {
    pictureInput.addEventListener("change", () => {
      if (pictureInput.files[0]) handleFile(pictureInput.files[0]);
    });
  }

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

    if (error) error.classList.remove("visible");
    if (uploadText) uploadText.textContent = `✅ ${file.name}`;
    if (uploadSection) uploadSection.style.borderColor = "var(--primary)";

    const reader = new FileReader();
    reader.onload = (e) => { previewImageSrc = e.target.result; };
    reader.readAsDataURL(file);
  }

  // ── Tags ──
  const tagsInput = document.getElementById("tagsInput");
  const tagsList = document.getElementById("tagsList");
  const tagsHidden = document.getElementById("tagsHidden");

  if (tagsInput && tagsList) {
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
  }

  function renderTags() {
    if (!tagsList) return;
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
    if (tagsHidden) tagsHidden.value = tags.join(",");
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
    if (!el) return;
    if (msg) el.textContent = msg;
    el.classList.add("visible");
  }

  function hideError(el) {
    if (!el) return;
    el.classList.remove("visible");
  }

  function validateForm() {
    let valid = true;

    // Titre
    const titre = document.getElementById("titre");
    const titreError = document.getElementById("titreError");
    if (!titre?.value.trim()) { showError(titreError); titre?.classList.add("invalid"); valid = false; }
    else { hideError(titreError); titre?.classList.remove("invalid"); }

    // Type
    const type = document.getElementById("type");
    const typeError = document.getElementById("typeError");
    if (!type?.value) { showError(typeError); type?.classList.add("invalid"); valid = false; }
    else { hideError(typeError); type?.classList.remove("invalid"); }

    // Commerce
    const commerce = document.getElementById("commerce");
    const commerceError = document.getElementById("commerceError");
    if (!commerce?.value.trim()) { showError(commerceError); commerce?.classList.add("invalid"); valid = false; }
    else { hideError(commerceError); commerce?.classList.remove("invalid"); }

    // Description
    const description = document.getElementById("description");
    const descriptionError = document.getElementById("descriptionError");
    if (!description?.value.trim() || description.value.trim().length < 30) {
      showError(descriptionError); description?.classList.add("invalid"); valid = false;
    } else { hideError(descriptionError); description?.classList.remove("invalid"); }

    // Date début
    const dateDebut = document.getElementById("dateDebut");
    const dateDebutError = document.getElementById("dateDebutError");
    if (!dateDebut?.value) { showError(dateDebutError); dateDebut?.classList.add("invalid"); valid = false; }
    else { hideError(dateDebutError); dateDebut?.classList.remove("invalid"); }

    // Date fin
    const dateFin = document.getElementById("dateFin");
    const dateFinError = document.getElementById("dateFinError");
    if (dateFin?.value && dateDebut?.value && dateFin.value < dateDebut.value) {
      showError(dateFinError); dateFin.classList.add("invalid"); valid = false;
    } else { hideError(dateFinError); dateFin?.classList.remove("invalid"); }

    // Adresse
    const adresse = document.getElementById("adresse");
    const adresseError = document.getElementById("adresseError");
    if (!adresse?.value.trim()) { showError(adresseError); adresse?.classList.add("invalid"); valid = false; }
    else { hideError(adresseError); adresse?.classList.remove("invalid"); }

    // Ville
    const ville = document.getElementById("ville");
    const villeError = document.getElementById("villeError");
    if (!ville?.value.trim()) { showError(villeError); ville?.classList.add("invalid"); valid = false; }
    else { hideError(villeError); ville?.classList.remove("invalid"); }

    // Lien
    const lien = document.getElementById("lien");
    const lienError = document.getElementById("lienError");
    if (lien?.value && !validateUrl(lien.value)) { showError(lienError); lien.classList.add("invalid"); valid = false; }
    else { hideError(lienError); lien?.classList.remove("invalid"); }

    // Email
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email?.value)) { showError(emailError); email?.classList.add("invalid"); valid = false; }
    else { hideError(emailError); email?.classList.remove("invalid"); }

    // Téléphone
    const phone = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    if (phone?.value && !validatePhone(phone.value)) { showError(phoneError); phone.classList.add("invalid"); valid = false; }
    else { hideError(phoneError); phone?.classList.remove("invalid"); }

    // Conditions
    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions?.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  // ── SOUMISSION À SUPABASE ──
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = form.querySelector(".error-message.visible");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Vérifier admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert(' Vous devez être connecté en tant qu\'administrateur')
      window.location.href = 'login.html'
      return
    }

    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      alert(' Accès réservé aux administrateurs')
      window.location.href = 'accueil.html'
      return
    }

    // Récupérer les valeurs
    const titre = document.getElementById("titre").value
    const type = document.getElementById("type").value
    const commerce_nom = document.getElementById("commerce").value
    const description = document.getElementById("description").value
    const date_debut = document.getElementById("dateDebut").value
    const date_fin = document.getElementById("dateFin").value || null
    const adresse = document.getElementById("adresse").value
    const ville = document.getElementById("ville").value
    const lien_externe = document.getElementById("lien").value || null
    const email_contact = document.getElementById("email").value
    const phone = document.getElementById("phone").value || null
    const mise_en_avant = document.getElementById("featured")?.checked || false
    const tagsArray = tags

    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";
    submitBtn.disabled = true;

    // Upload image si présente
    let image_url = null
    if (pictureInput?.files[0]) {
      const file = pictureInput.files[0]
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('actualites')
        .upload(fileName, file)
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('actualites')
          .getPublicUrl(fileName)
        image_url = publicUrl
      }
    }

    // Insérer dans Supabase
    const { error } = await supabase
      .from('actualites')
      .insert({
        titre, type, commerce_nom, description,
        date_debut, date_fin, adresse, ville,
        lien_externe, email_contact, phone,
        image_url, tags: tagsArray, mise_en_avant,
        user_id: user.id, statut: 'publié'
      })

    submitText.style.display = "inline";
    submitSpinner.style.display = "none";
    submitBtn.disabled = false;

    if (error) {
      alert(' Erreur: ' + error.message)
    } else {
      openSuccessMessage()
    }
  });

  // ── Aperçu ──
  previewBtn?.addEventListener("click", () => {
    const titre = document.getElementById("titre")?.value || "Titre de la nouveauté";
    const commerce = document.getElementById("commerce")?.value || "Commerce";
    const ville = document.getElementById("ville")?.value || "Ville";
    const description = document.getElementById("description")?.value || "Aucune description.";
    const dateDebut = document.getElementById("dateDebut")?.value;
    const dateFin = document.getElementById("dateFin")?.value;
    const typeVal = document.getElementById("type");
    const typeText = typeVal?.options[typeVal.selectedIndex]?.text || "Nouveauté";

    const previewTitre = document.getElementById("previewTitre");
    const previewCommerce = document.getElementById("previewCommerce");
    const previewDesc = document.getElementById("previewDesc");
    const previewBadge = document.getElementById("previewBadge");
    const previewDates = document.getElementById("previewDates");
    const previewImgWrap = document.getElementById("previewImgWrap");

    if (previewTitre) previewTitre.textContent = titre;
    if (previewCommerce) previewCommerce.textContent = `${commerce} — ${ville}`;
    if (previewDesc) previewDesc.textContent = description;
    if (previewBadge) previewBadge.textContent = typeText.replace(/^.\s/, "");

    let datesText = "📅 ";
    if (dateDebut) {
      datesText += formatDate(dateDebut);
      if (dateFin) datesText += ` → ${formatDate(dateFin)}`;
    } else {
      datesText += "Non renseigné";
    }
    if (previewDates) previewDates.textContent = datesText;

    if (previewImgWrap) {
      if (previewImageSrc) {
        previewImgWrap.innerHTML = `<img src="${previewImageSrc}" alt="preview" />`;
      } else {
        previewImgWrap.innerHTML = "<span>🖼️</span>";
      }
    }

    if (previewOverlay) previewOverlay.classList.add("visible");
    if (previewModal) previewModal.classList.add("visible");
  });

  function formatDate(str) {
    const d = new Date(str);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  }

  window.closePreview = function () {
    if (previewOverlay) previewOverlay.classList.remove("visible");
    if (previewModal) previewModal.classList.remove("visible");
  };

  if (previewOverlay) {
    previewOverlay.addEventListener("click", () => {
      if (previewModal?.classList.contains("visible")) window.closePreview();
    });
  }

  // ── Annuler ──
  cancelBtn?.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment annuler ? Vos informations seront perdues.")) {
      resetForm();
    }
  });

  function resetForm() {
    form?.reset();
    tags = [];
    renderTags();
    if (tagsInput) tagsInput.value = "";
    if (progressFill) progressFill.style.width = "0%";
    if (charCounter) charCounter.textContent = "0/700 caractères";
    if (uploadText) uploadText.textContent = "Déposez votre image ici";
    if (uploadSection) uploadSection.style.borderColor = "";
    previewImageSrc = null;
    form?.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    form?.querySelectorAll(".error-message.visible").forEach((el) => el.classList.remove("visible"));
  }

  // ── Succès ──
  function openSuccessMessage() {
    if (successOverlay) successOverlay.classList.add("visible");
    if (successMessage) successMessage.classList.add("visible");
    if (progressFill) progressFill.style.width = "100%";
  }

  window.closeSuccessMessage = function () {
    if (successOverlay) successOverlay.classList.remove("visible");
    if (successMessage) successMessage.classList.remove("visible");
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

  const emailField = document.getElementById("email");
  if (emailField) {
    emailField.addEventListener("blur", () => {
      const err = document.getElementById("emailError");
      if (!validateEmail(emailField.value)) { showError(err); emailField.classList.add("invalid"); }
      else { hideError(err); emailField.classList.remove("invalid"); }
    });
  }

  const dateFinField = document.getElementById("dateFin");
  if (dateFinField) {
    dateFinField.addEventListener("change", () => {
      const debut = document.getElementById("dateDebut")?.value;
      const fin = dateFinField.value;
      const err = document.getElementById("dateFinError");
      if (fin && debut && fin < debut) { showError(err); dateFinField.classList.add("invalid"); }
      else { hideError(err); dateFinField.classList.remove("invalid"); }
    });
  }
});