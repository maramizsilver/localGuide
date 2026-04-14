// frontend/js/avis.js
import { supabase } from './supabaseClient.js'

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
  let selectedCommerceId = null;

  const noteCriteres = { qualite: 0, service: 0, prix: 0, ambiance: 0 };

  // Récupérer l'ID du commerce depuis l'URL
  const urlParams = new URLSearchParams(window.location.search)
  const commerceId = urlParams.get('commerce_id')
  
  console.log('Commerce ID reçu:', commerceId)

  /* ══════════════════════════════
     CHARGER LA LISTE DES COMMERCES (SELECT)
  ══════════════════════════════ */
async function loadCommerces() {
    const commerceSelect = document.getElementById('commerce')
    if (!commerceSelect) return
    
    commerceSelect.innerHTML = '<option value="">⏳ Chargement...</option>'
    
    try {
        console.log('🔍 Chargement des commerces actifs...')
        
        const { data, error } = await supabase
            .from('commerces')
            .select('id, nom')
            .eq('statut', 'actif')
            .order('nom')
        
        if (error) {
            console.error('❌ Erreur Supabase:', error)
            commerceSelect.innerHTML = '<option value="">❌ Erreur: ' + error.message + '</option>'
            return
        }
        
        console.log('📊 Données reçues:', data)
        
        if (!data || data.length === 0) {
            console.log('⚠️ Aucun commerce actif trouvé')
            commerceSelect.innerHTML = '<option value="">⚠️ Aucun commerce disponible</option>'
            return
        }
        
        // Générer les options
        let options = '<option value="">-- Sélectionnez un commerce --</option>'
        data.forEach(commerce => {
            options += `<option value="${commerce.id}">${commerce.nom}</option>`
        })
        commerceSelect.innerHTML = options
        
        console.log(` ${data.length} commerces chargés:`, data.map(c => c.nom))
        
        // Si un ID est passé dans l'URL, le sélectionner
        const urlParams = new URLSearchParams(window.location.search)
        const commerceId = urlParams.get('commerce_id')
        if (commerceId) {
            commerceSelect.value = commerceId
            selectedCommerceId = commerceId
            updateProgress()
        }
        
    } catch (err) {
        console.error('❌ Erreur complète:', err)
        commerceSelect.innerHTML = '<option value="">❌ Erreur de connexion</option>'
    }
}

  /* ══════════════════════════════
     VALIDATION DU COMMERCE
  ══════════════════════════════ */
  function validateCommerce() {
    const commerceSelect = document.getElementById("commerce")
    const commerceError = document.getElementById("commerceError")
    
    if (!commerceSelect.value) {
      showError(commerceError, "Veuillez sélectionner un commerce")
      return false
    }
    
    selectedCommerceId = commerceSelect.value
    hideError(commerceError)
    return true
  }

  /* ══════════════════════════════
     BARRE DE PROGRESSION
  ══════════════════════════════ */
  const requiredFields = ["commerce", "categorie", "ville", "dateVisite", "titre", "avisTexte", "prenom", "email"];

  function updateProgress() {
    let filled = 0;
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value && el.value.trim() !== "") filled++;
    });
    if (noteGlobale > 0) filled++;
    if (selectedCommerceId) filled++;
    const conditions = document.getElementById("conditions");
    if (conditions && conditions.checked) filled++;

    const total = requiredFields.length + 2;
    if (progressFill) progressFill.style.width = Math.round((filled / total) * 100) + "%";
  }

  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { 
      el.addEventListener("input", updateProgress); 
      el.addEventListener("change", updateProgress); 
    }
  });
  document.getElementById("conditions")?.addEventListener("change", updateProgress);

  // Écouter le changement du select commerce
  const commerceSelect = document.getElementById("commerce");
  if (commerceSelect) {
    commerceSelect.addEventListener("change", () => {
      selectedCommerceId = commerceSelect.value;
      updateProgress();
    });
  }

  /* ── Compteur description ── */
  if (avisTexte) {
    avisTexte.addEventListener("input", () => {
      if (charCounter) charCounter.textContent = `${avisTexte.value.length}/1000 caractères`;
      updateProgress();
    });
  }

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

  if (starsGlobal.length) {
    starsGlobal.forEach(star => {
      star.addEventListener("mouseenter", () => paintGlobalStars(parseInt(star.dataset.val)));
      star.addEventListener("mouseleave", () => paintGlobalStars(noteGlobale));
      star.addEventListener("click", () => {
        noteGlobale = parseInt(star.dataset.val);
        if (noteInput) noteInput.value = noteGlobale;
        if (noteLabel) {
          noteLabel.textContent = noteLabels[noteGlobale];
          noteLabel.style.color = "var(--primary)";
        }
        paintGlobalStars(noteGlobale);
        hideError(document.getElementById("noteGlobaleError"));
        updateProgress();
      });
    });
  }

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
        if (input) input.value = noteCriteres[key];
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
     TAGS
  ══════════════════════════════ */
  setupTags("fortsInput", "fortsList", "fortsHidden", pointsForts, "fort");
  setupTags("faiblesInput", "faiblesList", "faiblesHidden", pointsFaibles, "faible");

  function setupTags(inputId, listId, hiddenId, arr, type) {
    const input  = document.getElementById(inputId);
    const list   = document.getElementById(listId);
    const hidden = document.getElementById(hiddenId);

    if (!input) return;
    
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
    if (!list) return;
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
    if (hidden) hidden.value = arr.join(",");
  }

  /* ══════════════════════════════
     UPLOAD PHOTOS
  ══════════════════════════════ */
  if (uploadSection) {
    uploadSection.addEventListener("click", () => picturesInput?.click());

    uploadSection.addEventListener("dragover", e => { e.preventDefault(); uploadSection.style.borderColor = "var(--primary)"; });
    uploadSection.addEventListener("dragleave", () => { uploadSection.style.borderColor = ""; });
    uploadSection.addEventListener("drop", e => {
      e.preventDefault();
      uploadSection.style.borderColor = "";
      Array.from(e.dataTransfer.files).forEach(f => addPhoto(f));
    });
  }

  if (picturesInput) {
    picturesInput.addEventListener("change", () => {
      Array.from(picturesInput.files).forEach(f => addPhoto(f));
      picturesInput.value = "";
    });
  }

  function addPhoto(file) {
    const error = document.getElementById("pictureError");
    if (uploadedFiles.length >= 3) { showError(error, "Maximum 3 photos autorisées."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showError(error, "Format non supporté (JPG/PNG)."); return; }
    if (file.size > 5 * 1024 * 1024) { showError(error, "Photo trop lourde (max 5MB)."); return; }

    if (error) error.classList.remove("visible");
    uploadedFiles.push(file);
    renderPreviews();
    if (uploadText) uploadText.textContent = `✅ ${uploadedFiles.length} photo(s) sélectionnée(s)`;
  }

  function renderPreviews() {
    if (!uploadPreviews) return;
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
          if (uploadText) uploadText.textContent = uploadedFiles.length
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
  function showError(el, msg = null) { if (el) { if (msg) el.textContent = msg; el.classList.add("visible"); } }
  function hideError(el) { if (el) el.classList.remove("visible"); }
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function validateForm() {
    let valid = true;

    if (!validateCommerce()) valid = false;

    const simpleRequired = [
      { id: "ville",    errId: "villeError" },
      { id: "titre",    errId: "titreError" },
      { id: "prenom",   errId: "prenomError" },
    ];

    simpleRequired.forEach(({ id, errId }) => {
      const el = document.getElementById(id);
      const err = document.getElementById(errId);
      if (!el.value.trim()) { showError(err); if (el) el.classList.add("invalid"); valid = false; }
      else { hideError(err); if (el) el.classList.remove("invalid"); }
    });

    const categorie = document.getElementById("categorie");
    const categorieError = document.getElementById("categorieError");
    if (!categorie.value) { showError(categorieError); if (categorie) categorie.classList.add("invalid"); valid = false; }
    else { hideError(categorieError); if (categorie) categorie.classList.remove("invalid"); }

    const dateVisite = document.getElementById("dateVisite");
    const dateVisiteError = document.getElementById("dateVisiteError");
    if (!dateVisite.value) { showError(dateVisiteError); if (dateVisite) dateVisite.classList.add("invalid"); valid = false; }
    else {
      const today = new Date(); today.setHours(0,0,0,0);
      const visited = new Date(dateVisite.value);
      if (visited > today) { showError(dateVisiteError, "La date ne peut pas être dans le futur."); if (dateVisite) dateVisite.classList.add("invalid"); valid = false; }
      else { hideError(dateVisiteError); if (dateVisite) dateVisite.classList.remove("invalid"); }
    }

    const noteGlobaleError = document.getElementById("noteGlobaleError");
    if (noteGlobale === 0) { showError(noteGlobaleError); valid = false; }
    else { hideError(noteGlobaleError); }

    const avisErr = document.getElementById("avisTexteError");
    if (!avisTexte.value.trim() || avisTexte.value.trim().length < 50) {
      showError(avisErr); if (avisTexte) avisTexte.classList.add("invalid"); valid = false;
    } else { hideError(avisErr); if (avisTexte) avisTexte.classList.remove("invalid"); }

    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) { showError(emailError); if (email) email.classList.add("invalid"); valid = false; }
    else { hideError(emailError); if (email) email.classList.remove("invalid"); }

    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  /* ══════════════════════════════
     SOUMISSION À SUPABASE
  ══════════════════════════════ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErr = form.querySelector(".error-message.visible");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    
    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";
    submitBtn.disabled = true;
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('❌ Veuillez vous connecter pour laisser un avis')
      window.location.href = 'login.html'
      return
    }
    
    // Récupérer les valeurs du formulaire
    const finalCommerceId = document.getElementById("commerce").value
    const categorie = document.getElementById("categorie").value
    const ville = document.getElementById("ville").value
    const dateVisite = document.getElementById("dateVisite").value
    const typeVisite = document.getElementById("typeVisite")?.value || null
    const titre = document.getElementById("titre").value
    const avisTexteValue = document.getElementById("avisTexte").value
    const prenom = document.getElementById("prenom").value
    const email = document.getElementById("email").value
    const recommande = document.querySelector('input[name="recommande"]:checked')?.value || null
    
    if (!finalCommerceId) {
      alert('❌ Veuillez sélectionner un commerce')
      submitText.style.display = "inline";
      submitSpinner.style.display = "none";
      submitBtn.disabled = false;
      return
    }
    
    // Upload des photos vers Supabase Storage
    let photoUrls = []
    for (const file of uploadedFiles) {
      const fileName = `avis/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('avis')
        .upload(fileName, file)
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avis')
          .getPublicUrl(fileName)
        photoUrls.push(publicUrl)
      }
    }
    
    // Insérer l'avis dans Supabase
    const { error } = await supabase
      .from('avis')
      .insert({
        commerce_id: finalCommerceId,
        user_id: user.id,
        ville: ville,
        date_visite: dateVisite,
        type_visite: typeVisite,
        note_globale: noteGlobale,
        note_qualite: noteCriteres.qualite || null,
        note_service: noteCriteres.service || null,
        note_prix: noteCriteres.prix || null,
        note_ambiance: noteCriteres.ambiance || null,
        recommande: recommande,
        titre: titre,
        avis_texte: avisTexteValue,
        points_forts: pointsForts.join(','),
        photos: photoUrls
      })
    
    submitText.style.display = "inline";
    submitSpinner.style.display = "none";
    submitBtn.disabled = false;
    
    if (error) {
      alert('❌ Erreur: ' + error.message)
    } else {
      openSuccess()
    }
  });

  /* ══════════════════════════════
     APERÇU
  ══════════════════════════════ */
  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const titre    = document.getElementById("titre").value || "Titre de l'avis";
      const commerceSelect = document.getElementById("commerce");
      const commerceName = commerceSelect.options[commerceSelect.selectedIndex]?.text || "Commerce";
      const ville    = document.getElementById("ville").value || "Ville";
      const prenom   = document.getElementById("prenom").value || "Anonyme";
      const texte    = avisTexte.value || "Aucun texte.";
      const dateVal  = document.getElementById("dateVisite").value;
      const catEl    = document.getElementById("categorie");
      const catText  = catEl.options[catEl.selectedIndex]?.text?.replace(/^.\s/, "") || "—";

      const previewTitre = document.getElementById("previewTitre");
      const previewCommerce = document.getElementById("previewCommerce");
      const previewCat = document.getElementById("previewCat");
      const previewDesc = document.getElementById("previewDesc");
      const previewAuteur = document.getElementById("previewAuteur");
      const previewStars = document.getElementById("previewStars");
      const previewForts = document.getElementById("previewForts");

      if (previewTitre) previewTitre.textContent = titre;
      if (previewCommerce) previewCommerce.textContent = `${commerceName} — ${ville}`;
      if (previewCat) previewCat.textContent = catText;
      if (previewDesc) previewDesc.textContent = texte;
      if (previewAuteur) previewAuteur.textContent = `Par ${prenom} · 📅 ${dateVal ? new Date(dateVal).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }) : "—"}`;
      if (previewStars) previewStars.textContent = "★".repeat(noteGlobale) + "☆".repeat(5 - noteGlobale);

      if (previewForts) {
        previewForts.innerHTML = "";
        pointsForts.forEach(t => {
          const pill = document.createElement("span");
          pill.className = "tag-pill fort";
          pill.textContent = "✅ " + t;
          previewForts.appendChild(pill);
        });
      }

      if (previewOverlay) previewOverlay.classList.add("visible");
      if (previewModal) previewModal.classList.add("visible");
    });
  }

  window.closePreview = function () {
    if (previewOverlay) previewOverlay.classList.remove("visible");
    if (previewModal) previewModal.classList.remove("visible");
  };

  if (previewOverlay) {
    previewOverlay.addEventListener("click", () => {
      if (previewModal && previewModal.classList.contains("visible")) closePreview();
    });
  }

  /* ══════════════════════════════
     SUCCÈS
  ══════════════════════════════ */
  function openSuccess() {
    if (successOverlay) successOverlay.classList.add("visible");
    if (successMessage) successMessage.classList.add("visible");
    if (progressFill) progressFill.style.width = "100%";
  }

  window.closeSuccessMessage = function () {
    if (successOverlay) successOverlay.classList.remove("visible");
    if (successMessage) successMessage.classList.remove("visible");
    resetForm();
  };

  /* ══════════════════════════════
     ANNULER
  ══════════════════════════════ */
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm("Voulez-vous vraiment annuler ? Votre avis sera perdu.")) resetForm();
    });
  }

  function resetForm() {
    if (form) form.reset();

    noteGlobale = 0;
    selectedCommerceId = null;
    
    const noteGlobaleInput = document.getElementById("noteGlobale");
    if (noteGlobaleInput) noteGlobaleInput.value = "";
    if (noteLabel) {
      noteLabel.textContent = "Cliquez pour noter";
      noteLabel.style.color = "";
    }
    starsGlobal.forEach(s => s.classList.remove("active"));
    Object.keys(noteCriteres).forEach(k => { noteCriteres[k] = 0; });
    document.querySelectorAll(".star-mini").forEach(s => s.classList.remove("active"));

    document.querySelectorAll(".recommend-card").forEach(c => c.classList.remove("selected"));

    pointsForts.length = 0;
    pointsFaibles.length = 0;
    const fortsList = document.getElementById("fortsList");
    const faiblesList = document.getElementById("faiblesList");
    const fortsHidden = document.getElementById("fortsHidden");
    const faiblesHidden = document.getElementById("faiblesHidden");
    if (fortsList) fortsList.innerHTML = "";
    if (faiblesList) faiblesList.innerHTML = "";
    if (fortsHidden) fortsHidden.value = "";
    if (faiblesHidden) faiblesHidden.value = "";

    uploadedFiles = [];
    if (uploadPreviews) uploadPreviews.innerHTML = "";
    if (uploadText) uploadText.textContent = "Déposez vos photos ici";
    if (uploadSection) uploadSection.style.borderColor = "";

    if (progressFill) progressFill.style.width = "0%";
    if (charCounter) charCounter.textContent = "0/1000 caractères";

    form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    form.querySelectorAll(".error-message.visible").forEach(el => el.classList.remove("visible"));
    
    // Recharger la liste des commerces
    loadCommerces();
  }

  /* ══════════════════════════════
     INLINE BLUR VALIDATION
  ══════════════════════════════ */
  ["ville", "titre", "prenom"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      const err = document.getElementById(id + "Error");
      if (!el.value.trim()) { showError(err); el.classList.add("invalid"); }
      else { hideError(err); el.classList.remove("invalid"); }
    });
  });

  const emailEl = document.getElementById("email");
  if (emailEl) {
    emailEl.addEventListener("blur", () => {
      const err = document.getElementById("emailError");
      if (!validateEmail(emailEl.value)) { showError(err); emailEl.classList.add("invalid"); }
      else { hideError(err); emailEl.classList.remove("invalid"); }
    });
  }

  const dateVisiteEl = document.getElementById("dateVisite");
  if (dateVisiteEl) {
    dateVisiteEl.addEventListener("change", () => {
      const err = document.getElementById("dateVisiteError");
      const today = new Date(); today.setHours(0,0,0,0);
      if (!dateVisiteEl.value) { showError(err, "La date de visite est requise."); dateVisiteEl.classList.add("invalid"); }
      else if (new Date(dateVisiteEl.value) > today) { showError(err, "La date ne peut pas être dans le futur."); dateVisiteEl.classList.add("invalid"); }
      else { hideError(err); dateVisiteEl.classList.remove("invalid"); }
      updateProgress();
    });
  }

  // Charger les commerces au démarrage
  loadCommerces();
});