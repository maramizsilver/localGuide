// frontend/js/devenir_guide.js
import { supabase } from './supabaseClient.js'

document.addEventListener("DOMContentLoaded", () => {
  console.log('✅ devenir_guide.js chargé')

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

  // ── Variables abonnement ──
  let selectedAbonnement = null
  let selectedPrix = null
  let uploadedImageUrl = null

  // ── Champs requis pour la progression ──
  const requiredFields = [
    "prenom", "nom", "email", "phone", "ville",
    "specialite", "experience", "motivation"
  ];

  // ── Barre de progression ──
  function updateProgress() {
    let filled = 0;
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== "") filled++;
    });
    const languesChecked = document.querySelectorAll('input[name="langues"]:checked').length;
    if (languesChecked > 0) filled++;
    if (selectedAbonnement) filled++;
    const conditions = document.getElementById("conditions");
    if (conditions && conditions.checked) filled++;

    const total = requiredFields.length + 3;
    const pct = Math.round((filled / total) * 100);
    if (progressFill) progressFill.style.width = pct + "%";
  }

  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateProgress);
      el.addEventListener("change", updateProgress);
    }
  });

  document.querySelectorAll('input[name="langues"]').forEach(cb => {
    cb.addEventListener("change", updateProgress);
  });

  document.getElementById("conditions")?.addEventListener("change", updateProgress);

  // ── Compteur de caractères ──
  if (motivationField && charCounter) {
    motivationField.addEventListener("input", () => {
      charCounter.textContent = `${motivationField.value.length}/600 caractères`;
      updateProgress();
    });
  }

  // ── GESTION ABONNEMENT ──
  function initAbonnement() {
    const abonnementCards = document.querySelectorAll('.abonnement-card')
    const abonnementDureeInput = document.getElementById('abonnementDuree')
    const abonnementPrixInput = document.getElementById('abonnementPrix')
    const abonnementError = document.getElementById('abonnementError')

    console.log('Cartes abonnement trouvées:', abonnementCards.length)

    abonnementCards.forEach(card => {
      card.addEventListener('click', () => {
        console.log('Carte cliquée')
        abonnementCards.forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
        
        selectedAbonnement = parseInt(card.dataset.duree)
        selectedPrix = parseInt(card.dataset.prix)
        
        console.log('Abonnement sélectionné:', selectedAbonnement, 'mois - prix:', selectedPrix, 'DT')
        
        if (abonnementDureeInput) abonnementDureeInput.value = selectedAbonnement
        if (abonnementPrixInput) abonnementPrixInput.value = selectedPrix
        if (abonnementError) hideError(abonnementError)
        updateProgress()
      })
    })
  }

  // ── Upload photo ──
  if (uploadSection) {
    uploadSection.addEventListener("click", () => pictureInput?.click());

    uploadSection.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadSection.style.borderColor = "var(--primary)";
    });

    uploadSection.addEventListener("dragleave", () => {
      uploadSection.style.borderColor = "";
    });

    uploadSection.addEventListener("drop", async (e) => {
      e.preventDefault();
      uploadSection.style.borderColor = "";
      const file = e.dataTransfer.files[0];
      if (file) await handleFile(file);
    });
  }

  if (pictureInput) {
    pictureInput.addEventListener("change", async () => {
      if (pictureInput.files[0]) await handleFile(pictureInput.files[0]);
    });
  }

  async function handleFile(file) {
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

    const fileName = `guides/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('guides')
      .upload(fileName, file)
    
    if (uploadError) {
      showError(error, "Erreur upload: " + uploadError.message)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('guides')
      .getPublicUrl(fileName)
    
    uploadedImageUrl = publicUrl
    if (error) error.classList.remove("visible");
    if (uploadText) uploadText.textContent = `✅ ${file.name}`;
    if (uploadSection) uploadSection.style.borderColor = "var(--primary)";
  }

  // ── Validation ──
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^(\+?[0-9\s\-]{7,16})$/.test(phone.trim());
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

    // Prénom
    const prenom = document.getElementById("prenom");
    const prenomError = document.getElementById("prenomError");
    if (!prenom.value.trim()) { showError(prenomError); prenom.classList.add("invalid"); valid = false; }
    else { hideError(prenomError); prenom.classList.remove("invalid"); }

    // Nom
    const nom = document.getElementById("nom");
    const nomError = document.getElementById("nomError");
    if (!nom.value.trim()) { showError(nomError); nom.classList.add("invalid"); valid = false; }
    else { hideError(nomError); nom.classList.remove("invalid"); }

    // Email
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) { showError(emailError); email.classList.add("invalid"); valid = false; }
    else { hideError(emailError); email.classList.remove("invalid"); }

    // Téléphone
    const phone = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    if (!validatePhone(phone.value)) { showError(phoneError); phone.classList.add("invalid"); valid = false; }
    else { hideError(phoneError); phone.classList.remove("invalid"); }

    // Ville
    const ville = document.getElementById("ville");
    const villeError = document.getElementById("villeError");
    if (!ville.value.trim()) { showError(villeError); ville.classList.add("invalid"); valid = false; }
    else { hideError(villeError); ville.classList.remove("invalid"); }

    // Spécialité
    const specialite = document.getElementById("specialite");
    const specialiteError = document.getElementById("specialiteError");
    if (!specialite.value) { showError(specialiteError); specialite.classList.add("invalid"); valid = false; }
    else { hideError(specialiteError); specialite.classList.remove("invalid"); }

    // Expérience
    const experience = document.getElementById("experience");
    const experienceError = document.getElementById("experienceError");
    if (!experience.value) { showError(experienceError); experience.classList.add("invalid"); valid = false; }
    else { hideError(experienceError); experience.classList.remove("invalid"); }

    // Langues
    const languesChecked = document.querySelectorAll('input[name="langues"]:checked').length;
    const languesError = document.getElementById("languesError");
    if (languesChecked === 0) { showError(languesError); valid = false; }
    else { hideError(languesError); }

    // Motivation
    const motivation = document.getElementById("motivation");
    const motivationError = document.getElementById("motivationError");
    if (!motivation.value.trim() || motivation.value.trim().length < 50) {
      showError(motivationError); motivation.classList.add("invalid"); valid = false;
    } else { hideError(motivationError); motivation.classList.remove("invalid"); }

    // Abonnement
    const abonnementError = document.getElementById("abonnementError");
    if (!selectedAbonnement) { showError(abonnementError); valid = false; }
    else { hideError(abonnementError); }

    // Conditions
    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  // ── SOUMISSION À SUPABASE ──
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = form.querySelector(".error-message.visible");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('❌ Veuillez vous connecter pour postuler')
      window.location.href = 'login.html'
      return
    }

    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";
    submitBtn.disabled = true;

    const langues = Array.from(document.querySelectorAll('input[name="langues"]:checked')).map(cb => cb.value)
    const prenom = document.getElementById("prenom").value
    const nom = document.getElementById("nom").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value
    const ville = document.getElementById("ville").value
    const specialite = document.getElementById("specialite").value
    const experienceValue = document.getElementById("experience").value
    const motivation = document.getElementById("motivation").value
    const instagram = document.getElementById("instagram")?.value || null
    const facebook = document.getElementById("facebook")?.value || null

    let experienceYears = 0
    if (experienceValue === 'debutant') experienceYears = 1
    else if (experienceValue === 'intermediaire') experienceYears = 3
    else if (experienceValue === 'expert') experienceYears = 5

    // Calcul des dates d'abonnement
    const now = new Date()
    const dateDebut = now.toISOString()
    const dateFin = new Date(now.setMonth(now.getMonth() + selectedAbonnement)).toISOString()

    const { error } = await supabase
      .from('guides')
      .insert({
        user_id: user.id,
        prenom: prenom,
        nom: nom,
        email: email,
        phone: phone,
        ville: ville,
        specialite: specialite,
        experience: experienceYears,
        langue: langues,
        motivation: motivation,
        insta_url: instagram,
        facebook_url: facebook,
        image_url: uploadedImageUrl,
        abonnement_duree: selectedAbonnement,
        abonnement_prix: selectedPrix,
        abonnement_date_debut: dateDebut,
        abonnement_date_fin: dateFin,
        statut: 'inactif'
      })

    submitText.style.display = "inline";
    submitSpinner.style.display = "none";
    submitBtn.disabled = false;

    if (error) {
      alert('❌ Erreur: ' + error.message)
      console.error('Erreur détaillée:', error)
    } else {
      openSuccessMessage()
    }
  });

  // ── Annuler ──
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm("Voulez-vous vraiment annuler ? Vos informations seront perdues.")) {
        form.reset();
        if (progressFill) progressFill.style.width = "0%";
        if (charCounter) charCounter.textContent = "0/600 caractères";
        if (uploadText) uploadText.textContent = "Déposez votre photo ici";
        if (uploadSection) uploadSection.style.borderColor = "";
        selectedAbonnement = null;
        selectedPrix = null;
        uploadedImageUrl = null;
        document.querySelectorAll('.abonnement-card').forEach(c => c.classList.remove('selected'));
        form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
        form.querySelectorAll(".error-message.visible").forEach(el => el.classList.remove("visible"));
      }
    });
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
    form.reset();
    if (progressFill) progressFill.style.width = "0%";
    if (charCounter) charCounter.textContent = "0/600 caractères";
    if (uploadText) uploadText.textContent = "Déposez votre photo ici";
    if (uploadSection) uploadSection.style.borderColor = "";
    selectedAbonnement = null;
    selectedPrix = null;
    uploadedImageUrl = null;
    document.querySelectorAll('.abonnement-card').forEach(c => c.classList.remove('selected'));
  };

  // ── Initialisation ──
  initAbonnement()

  // ── Inline validation ──
  ["prenom", "nom", "ville"].forEach(id => {
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

  const phoneEl = document.getElementById("phone");
  if (phoneEl) {
    phoneEl.addEventListener("blur", () => {
      const err = document.getElementById("phoneError");
      if (!validatePhone(phoneEl.value)) { showError(err); phoneEl.classList.add("invalid"); }
      else { hideError(err); phoneEl.classList.remove("invalid"); }
    });
  }
});