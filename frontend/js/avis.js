// ===== avis.js =====

document.addEventListener("DOMContentLoaded", () => {

  /* ── Refs ── */
  const form            = document.getElementById("avisForm");
  const progressFill    = document.getElementById("progressFill");
  const charCounter     = document.getElementById("charCounter");
  const avisTexte       = document.getElementById("avisTexte");
  const uploadSection   = document.getElementById("uploadSection");
  const picturesInput   = document.getElementById("pictures");
  const uploadText      = document.getElementById("uploadText");
  const uploadPreviews  = document.getElementById("uploadPreviews");
  const submitBtn       = document.getElementById("submitBtn");
  const submitText      = document.getElementById("submitText");
  const submitSpinner   = document.getElementById("submitSpinner");
  const cancelBtn       = document.getElementById("cancelBtn");
  const previewBtn      = document.getElementById("previewBtn");
  const successOverlay  = document.getElementById("successOverlay");
  const successMessage  = document.getElementById("successMessage");
  const previewOverlay  = document.getElementById("previewOverlay");
  const previewModal    = document.getElementById("previewModal");

  /* ── State ── */
  let noteGlobale = 0;
  let uploadedFiles = [];
  let pointsForts = [];
  let pointsFaibles = [];

  const noteCriteres = { qualite: 0, service: 0, prix: 0, ambiance: 0 };

  /* ══════════════════════════════
     BARRE DE PROGRESSION
  ══════════════════════════════ */
  const requiredFields = ["commerce", "categorie", "ville", "dateVisite", "titre", "avisTexte", "prenom", "email"];

  function updateProgress() {
    let filled = 0;
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== "") filled++;
    });
    if (noteGlobale > 0) filled++;
    const conditions = document.getElementById("conditions");
    if (conditions && conditions.checked) filled++;

    const total = requiredFields.length + 2;
    progressFill.style.width = Math.round((filled / total) * 100) + "%";
  }

  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener("input", updateProgress); el.addEventListener("change", updateProgress); }
  });
  document.getElementById("conditions")?.addEventListener("change", updateProgress);

  /* ── Compteur description ── */
  avisTexte.addEventListener("input", () => {
    charCounter.textContent = `${avisTexte.value.length}/1000 caractères`;
    updateProgress();
  });

  /* ══════════════════════════════
     ÉTOILES GLOBALES
  ══════════════════════════════ */
  const noteLabels = ["", "Très mauvais 😞", "Mauvais 😕", "Correct 😐", "Bien 😊", "Excellent ! 🤩"];
  const starsGlobal = document.querySelectorAll("#starsGlobal .star");
  const noteLabel   = document.getElementById("noteLabel");
  const noteInput   = document.getElementById("noteGlobale");

  function paintGlobalStars(n) {
    starsGlobal.forEach(s => {
      s.classList.toggle("active", parseInt(s.dataset.val) <= n);
    });
  }

  starsGlobal.forEach(star => {
    star.addEventListener("mouseenter", () => paintGlobalStars(parseInt(star.dataset.val)));
    star.addEventListener("mouseleave", () => paintGlobalStars(noteGlobale));
    star.addEventListener("click", () => {
      noteGlobale = parseInt(star.dataset.val);
      noteInput.value = noteGlobale;
      noteLabel.textContent = noteLabels[noteGlobale];
      noteLabel.style.color = "var(--primary)";
      paintGlobalStars(noteGlobale);
      hideError(document.getElementById("noteGlobaleError"));
      updateProgress();
    });
  });

  /* ══════════════════════════════
     ÉTOILES CRITÈRES
  ══════════════════════════════ */
  const critereMap = {
    starsQualite:  { key: "qualite",  inputId: "noteQualite"  },
    starsService:  { key: "service",  inputId: "noteService"  },
    starsPrix:     { key: "prix",     inputId: "notePrix"     },
    starsAmbiance: { key: "ambiance", inputId: "noteAmbiance" },
  };

  Object.entries(critereMap).forEach(([groupId, { key, inputId }]) => {
    const group = document.getElementById(groupId);
    if (!group) return;
    const stars = group.querySelectorAll(".star-mini");
    const input = document.getElementById(inputId);

    function paintMini(n) {
      stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.val) <= n));
    }

    stars.forEach(star => {
      star.addEventListener("mouseenter", () => paintMini(parseInt(star.dataset.val)));
      star.addEventListener("mouseleave", () => paintMini(noteCriteres[key]));
      star.addEventListener("click", () => {
        noteCriteres[key] = parseInt(star.dataset.val);
        input.value = noteCriteres[key];
        paintMini(noteCriteres[key]);
      });
    });
  });

  /* ══════════════════════════════
     RECOMMANDE
  ══════════════════════════════ */
  document.querySelectorAll(".recommend-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".recommend-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  /* ══════════════════════════════
     TAGS — POINTS FORTS
  ══════════════════════════════ */
  setupTags("fortsInput", "fortsList", "fortsHidden", pointsForts, "fort");

  /* ══════════════════════════════
     TAGS — POINTS FAIBLES
  ══════════════════════════════ */
  setupTags("faiblesInput", "faiblesList", "faiblesHidden", pointsFaibles, "faible");

  function setupTags(inputId, listId, hiddenId, arr, type) {
    const input  = document.getElementById(inputId);
    const list   = document.getElementById(listId);
    const hidden = document.getElementById(hiddenId);

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = input.value.trim().replace(/,/g, "");
        if (val && !arr.includes(val) && arr.length < 5) {
          arr.push(val);
          renderTags(arr, list, hidden, type, input);
        }
        input.value = "";
      }
      if (e.key === "Backspace" && !input.value && arr.length) {
        arr.pop();
        renderTags(arr, list, hidden, type, input);
      }
    });
  }

  function renderTags(arr, list, hidden, type, input) {
    list.innerHTML = "";
    arr.forEach((tag, i) => {
      const pill = document.createElement("span");
      pill.className = `tag-pill ${type}`;
      pill.innerHTML = `${tag} <button type="button" aria-label="Supprimer ${tag}">×</button>`;
      pill.querySelector("button").addEventListener("click", () => {
        arr.splice(i, 1);
        renderTags(arr, list, hidden, type, input);
      });
      list.appendChild(pill);
    });
    hidden.value = arr.join(",");
  }

  /* ══════════════════════════════
     UPLOAD PHOTOS
  ══════════════════════════════ */
  uploadSection.addEventListener("click", () => picturesInput.click());

  uploadSection.addEventListener("dragover", e => { e.preventDefault(); uploadSection.style.borderColor = "var(--primary)"; });
  uploadSection.addEventListener("dragleave", () => { uploadSection.style.borderColor = ""; });
  uploadSection.addEventListener("drop", e => {
    e.preventDefault();
    uploadSection.style.borderColor = "";
    Array.from(e.dataTransfer.files).forEach(f => addPhoto(f));
  });

  picturesInput.addEventListener("change", () => {
    Array.from(picturesInput.files).forEach(f => addPhoto(f));
    picturesInput.value = "";
  });

  function addPhoto(file) {
    const error = document.getElementById("pictureError");
    if (uploadedFiles.length >= 3) { showError(error, "Maximum 3 photos autorisées."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showError(error, "Format non supporté (JPG/PNG)."); return; }
    if (file.size > 5 * 1024 * 1024) { showError(error, "Photo trop lourde (max 5MB)."); return; }

    error.classList.remove("visible");
    uploadedFiles.push(file);
    renderPreviews();
    uploadText.textContent = `✅ ${uploadedFiles.length} photo(s) sélectionnée(s)`;
  }

  function renderPreviews() {
    uploadPreviews.innerHTML = "";
    uploadedFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        const thumb = document.createElement("div");
        thumb.className = "preview-thumb";
        thumb.innerHTML = `<img src="${e.target.result}" alt="photo ${i+1}" />
          <button class="remove-thumb" type="button" title="Supprimer">×</button>`;
        thumb.querySelector(".remove-thumb").addEventListener("click", () => {
          uploadedFiles.splice(i, 1);
          renderPreviews();
          uploadText.textContent = uploadedFiles.length
            ? `✅ ${uploadedFiles.length} photo(s) sélectionnée(s)`
            : "Déposez vos photos ici";
        });
        uploadPreviews.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  }

  /* ══════════════════════════════
     VALIDATION
  ══════════════════════════════ */
  function showError(el, msg = null) { if (msg) el.textContent = msg; el.classList.add("visible"); }
  function hideError(el) { el.classList.remove("visible"); }
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function validateForm() {
    let valid = true;

    const simpleRequired = [
      { id: "commerce", errId: "commerceError" },
      { id: "ville",    errId: "villeError" },
      { id: "titre",    errId: "titreError" },
      { id: "prenom",   errId: "prenomError" },
    ];

    simpleRequired.forEach(({ id, errId }) => {
      const el = document.getElementById(id);
      const err = document.getElementById(errId);
      if (!el.value.trim()) { showError(err); el.classList.add("invalid"); valid = false; }
      else { hideError(err); el.classList.remove("invalid"); }
    });

    // Catégorie
    const categorie = document.getElementById("categorie");
    const categorieError = document.getElementById("categorieError");
    if (!categorie.value) { showError(categorieError); categorie.classList.add("invalid"); valid = false; }
    else { hideError(categorieError); categorie.classList.remove("invalid"); }

    // Date visite
    const dateVisite = document.getElementById("dateVisite");
    const dateVisiteError = document.getElementById("dateVisiteError");
    if (!dateVisite.value) { showError(dateVisiteError); dateVisite.classList.add("invalid"); valid = false; }
    else {
      const today = new Date(); today.setHours(0,0,0,0);
      const visited = new Date(dateVisite.value);
      if (visited > today) { showError(dateVisiteError, "La date ne peut pas être dans le futur."); dateVisite.classList.add("invalid"); valid = false; }
      else { hideError(dateVisiteError); dateVisite.classList.remove("invalid"); }
    }

    // Note globale
    const noteGlobaleError = document.getElementById("noteGlobaleError");
    if (noteGlobale === 0) { showError(noteGlobaleError); valid = false; }
    else { hideError(noteGlobaleError); }

    // Texte avis
    const avisErr = document.getElementById("avisTexteError");
    if (!avisTexte.value.trim() || avisTexte.value.trim().length < 50) {
      showError(avisErr); avisTexte.classList.add("invalid"); valid = false;
    } else { hideError(avisErr); avisTexte.classList.remove("invalid"); }

    // Email
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) { showError(emailError); email.classList.add("invalid"); valid = false; }
    else { hideError(emailError); email.classList.remove("invalid"); }

    // Conditions
    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  /* ══════════════════════════════
     SOUMISSION
  ══════════════════════════════ */
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErr = form.querySelector(".error-message.visible");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";
    submitBtn.disabled = true;

    setTimeout(() => {
      submitText.style.display = "inline";
      submitSpinner.style.display = "none";
      submitBtn.disabled = false;
      openSuccess();
    }, 1800);
  });

  /* ══════════════════════════════
     APERÇU
  ══════════════════════════════ */
  previewBtn.addEventListener("click", () => {
    const titre    = document.getElementById("titre").value || "Titre de l'avis";
    const commerce = document.getElementById("commerce").value || "Commerce";
    const ville    = document.getElementById("ville").value || "Ville";
    const prenom   = document.getElementById("prenom").value || "Anonyme";
    const texte    = avisTexte.value || "Aucun texte.";
    const dateVal  = document.getElementById("dateVisite").value;
    const catEl    = document.getElementById("categorie");
    const catText  = catEl.options[catEl.selectedIndex]?.text?.replace(/^.\s/, "") || "—";

    document.getElementById("previewTitre").textContent = titre;
    document.getElementById("previewCommerce").textContent = `${commerce} — ${ville}`;
    document.getElementById("previewCat").textContent = catText;
    document.getElementById("previewDesc").textContent = texte;
    document.getElementById("previewAuteur").textContent =
      `Par ${prenom} · 📅 ${dateVal ? new Date(dateVal).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }) : "—"}`;

    // Étoiles
    document.getElementById("previewStars").textContent = "★".repeat(noteGlobale) + "☆".repeat(5 - noteGlobale);

    // Tags forts
    const fortsRow = document.getElementById("previewForts");
    fortsRow.innerHTML = "";
    pointsForts.forEach(t => {
      const pill = document.createElement("span");
      pill.className = "tag-pill fort";
      pill.textContent = "✅ " + t;
      fortsRow.appendChild(pill);
    });

    previewOverlay.classList.add("visible");
    previewModal.classList.add("visible");
  });

  window.closePreview = function () {
    previewOverlay.classList.remove("visible");
    previewModal.classList.remove("visible");
  };

  previewOverlay.addEventListener("click", () => {
    if (previewModal.classList.contains("visible")) closePreview();
  });

  /* ══════════════════════════════
     SUCCÈS
  ══════════════════════════════ */
  function openSuccess() {
    successOverlay.classList.add("visible");
    successMessage.classList.add("visible");
    progressFill.style.width = "100%";
  }

  window.closeSuccessMessage = function () {
    successOverlay.classList.remove("visible");
    successMessage.classList.remove("visible");
    resetForm();
  };

  /* ══════════════════════════════
     ANNULER
  ══════════════════════════════ */
  cancelBtn.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment annuler ? Votre avis sera perdu.")) resetForm();
  });

  function resetForm() {
    form.reset();

    // Stars
    noteGlobale = 0;
    document.getElementById("noteGlobale").value = "";
    document.getElementById("noteLabel").textContent = "Cliquez pour noter";
    document.getElementById("noteLabel").style.color = "";
    starsGlobal.forEach(s => s.classList.remove("active"));
    Object.keys(noteCriteres).forEach(k => { noteCriteres[k] = 0; });
    document.querySelectorAll(".star-mini").forEach(s => s.classList.remove("active"));

    // Recommend
    document.querySelectorAll(".recommend-card").forEach(c => c.classList.remove("selected"));

    // Tags
    pointsForts.length = 0;
    pointsFaibles.length = 0;
    ["fortsList", "faiblesList"].forEach(id => { document.getElementById(id).innerHTML = ""; });
    ["fortsHidden", "faiblesHidden"].forEach(id => { document.getElementById(id).value = ""; });

    // Photos
    uploadedFiles = [];
    uploadPreviews.innerHTML = "";
    uploadText.textContent = "Déposez vos photos ici";
    uploadSection.style.borderColor = "";

    // Progress
    progressFill.style.width = "0%";
    charCounter.textContent = "0/1000 caractères";

    // Errors
    form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    form.querySelectorAll(".error-message.visible").forEach(el => el.classList.remove("visible"));
  }

  /* ══════════════════════════════
     INLINE BLUR VALIDATION
  ══════════════════════════════ */
  ["commerce", "ville", "titre", "prenom"].forEach(id => {
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

  document.getElementById("dateVisite").addEventListener("change", () => {
    const el = document.getElementById("dateVisite");
    const err = document.getElementById("dateVisiteError");
    const today = new Date(); today.setHours(0,0,0,0);
    if (!el.value) { showError(err, "La date de visite est requise."); el.classList.add("invalid"); }
    else if (new Date(el.value) > today) { showError(err, "La date ne peut pas être dans le futur."); el.classList.add("invalid"); }
    else { hideError(err); el.classList.remove("invalid"); }
    updateProgress();
  });

});
