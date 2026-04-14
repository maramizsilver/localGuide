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

  // Variables
  let selectedAbonnement = null
  let selectedPrix = null
  let uploadedImageUrl = null

  // Champs requis pour la progression
  const requiredFields = [
    "prenom", "nom", "email", "phone", "ville",
    "specialite", "experience", "motivation"
  ];

  // Barre de progression
  function updateProgress() {
    let filled = 0;
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value && el.value.trim() !== "") filled++;
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

  // Compteur de caractères
  if (motivationField && charCounter) {
    const updateCharCounter = () => {
      const length = motivationField.value.length;
      charCounter.textContent = `${length}/600 caractères`;
      if (length >= 50) {
        charCounter.style.color = "green";
      } else {
        charCounter.style.color = "#999";
      }
      updateProgress();
    };
    motivationField.addEventListener("input", updateCharCounter);
    updateCharCounter();
  }

  // Gestion abonnement
  function initAbonnement() {
    const abonnementCards = document.querySelectorAll('.abonnement-card')
    const abonnementDureeInput = document.getElementById('abonnementDuree')
    const abonnementPrixInput = document.getElementById('abonnementPrix')
    const abonnementError = document.getElementById('abonnementError')

    console.log('Cartes abonnement trouvées:', abonnementCards.length)

    if (abonnementCards.length === 0) {
      console.error('⚠️ Aucune carte avec la classe "abonnement-card" trouvée!')
      return
    }

    abonnementCards.forEach(card => {
      if (card._handler) {
        card.removeEventListener('click', card._handler)
      }
      
      const handler = () => {
        console.log('Carte cliquée!', card.dataset)
        
        abonnementCards.forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
        
        selectedAbonnement = parseInt(card.dataset.duree)
        selectedPrix = parseInt(card.dataset.prix)
        
        console.log('✅ Abonnement sélectionné:', selectedAbonnement, 'mois -', selectedPrix, 'DT')
        
        if (abonnementDureeInput) abonnementDureeInput.value = selectedAbonnement
        if (abonnementPrixInput) abonnementPrixInput.value = selectedPrix
        if (abonnementError) hideError(abonnementError)
        updateProgress()
      }
      
      card._handler = handler
      card.addEventListener('click', handler)
    })
  }

  // ✅ Upload photo vers 'guides-photos' (AVEC 's')
  async function handleFile(file) {
    const error = document.getElementById("pictureError");
    const maxSize = 5 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      showError(error, "Format non supporté. Utilisez JPG, PNG ou WEBP.");
      return;
    }
    
    if (file.size > maxSize) {
      showError(error, `Fichier trop lourd (max 5MB). Votre fichier: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    if (uploadText) {
      uploadText.innerHTML = "⏳ Upload en cours...";
      uploadText.style.color = "#d42b2b";
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log('Upload vers bucket:', 'guides-photos');
      console.log('Nom du fichier:', fileName);
      
      // ✅ Bucket 'guides-photos' (avec 's')
      const { error: uploadError } = await supabase.storage
        .from('guides-photos')  // ← CORRECTION: guides-photos (avec 's')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        showError(error, "Erreur d'upload: " + uploadError.message);
        if (uploadText) uploadText.innerHTML = "❌ Échec de l'upload";
        return;
      }
      
      // ✅ Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('guides-photos')  // ← CORRECTION: guides-photos (avec 's')
        .getPublicUrl(fileName)
      
      uploadedImageUrl = publicUrl
      console.log('✅ Photo uploadée avec succès:', publicUrl)
      
      if (error) hideError(error)
      if (uploadText) {
        uploadText.innerHTML = `✅ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
        uploadText.style.color = "green";
      }
      if (uploadSection) uploadSection.style.borderColor = "#4caf50";
      
    } catch (err) {
      console.error('Erreur:', err);
      showError(error, "Erreur inattendue lors de l'upload");
      if (uploadText) uploadText.innerHTML = "❌ Erreur, réessayez";
    }
  }

  // Événements upload
  if (uploadSection) {
    uploadSection.addEventListener("click", () => pictureInput?.click());

    uploadSection.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadSection.style.borderColor = "#d42b2b";
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

  // Validation
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

    const prenom = document.getElementById("prenom");
    const prenomError = document.getElementById("prenomError");
    if (!prenom.value.trim()) { showError(prenomError); prenom.classList.add("invalid"); valid = false; }
    else { hideError(prenomError); prenom.classList.remove("invalid"); }

    const nom = document.getElementById("nom");
    const nomError = document.getElementById("nomError");
    if (!nom.value.trim()) { showError(nomError); nom.classList.add("invalid"); valid = false; }
    else { hideError(nomError); nom.classList.remove("invalid"); }

    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    if (!validateEmail(email.value)) { showError(emailError); email.classList.add("invalid"); valid = false; }
    else { hideError(emailError); email.classList.remove("invalid"); }

    const phone = document.getElementById("phone");
    const phoneError = document.getElementById("phoneError");
    if (!validatePhone(phone.value)) { showError(phoneError); phone.classList.add("invalid"); valid = false; }
    else { hideError(phoneError); phone.classList.remove("invalid"); }

    const ville = document.getElementById("ville");
    const villeError = document.getElementById("villeError");
    if (!ville.value.trim()) { showError(villeError); ville.classList.add("invalid"); valid = false; }
    else { hideError(villeError); ville.classList.remove("invalid"); }

    const specialite = document.getElementById("specialite");
    const specialiteError = document.getElementById("specialiteError");
    if (!specialite.value) { showError(specialiteError); specialite.classList.add("invalid"); valid = false; }
    else { hideError(specialiteError); specialite.classList.remove("invalid"); }

    const experience = document.getElementById("experience");
    const experienceError = document.getElementById("experienceError");
    if (!experience.value) { showError(experienceError); experience.classList.add("invalid"); valid = false; }
    else { hideError(experienceError); experience.classList.remove("invalid"); }

    const languesChecked = document.querySelectorAll('input[name="langues"]:checked').length;
    const languesError = document.getElementById("languesError");
    if (languesChecked === 0) { showError(languesError); valid = false; }
    else { hideError(languesError); }

    const motivation = document.getElementById("motivation");
    const motivationError = document.getElementById("motivationError");
    if (!motivation.value.trim() || motivation.value.trim().length < 50) {
      showError(motivationError); motivation.classList.add("invalid"); valid = false;
    } else { hideError(motivationError); motivation.classList.remove("invalid"); }

    const abonnementError = document.getElementById("abonnementError");
    if (!selectedAbonnement) { showError(abonnementError); valid = false; }
    else { hideError(abonnementError); }

    const conditions = document.getElementById("conditions");
    const conditionsError = document.getElementById("conditionsError");
    if (!conditions.checked) { showError(conditionsError); valid = false; }
    else { hideError(conditionsError); }

    return valid;
  }

  // ✅ SOUMISSION vers table 'guides'
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

    const now = new Date()
    const dateDebut = now.toISOString()
    const dateFin = new Date(now.setMonth(now.getMonth() + selectedAbonnement)).toISOString()

    // ✅ Insertion dans la table 'guides'
    const { error } = await supabase
      .from('guides')
      .insert({
        user_id: user.id,
        prenom: prenom,
        nom: nom,
        email: email,
        telephone: phone,
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

  // Annuler
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm("Voulez-vous vraiment annuler ? Vos informations seront perdues.")) {
        form.reset();
        if (progressFill) progressFill.style.width = "0%";
        if (charCounter) charCounter.textContent = "0/600 caractères";
        if (uploadText) {
          uploadText.innerHTML = "Déposez votre photo ici";
          uploadText.style.color = "";
        }
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
    if (uploadText) {
      uploadText.innerHTML = "Déposez votre photo ici";
      uploadText.style.color = "";
    }
    if (uploadSection) uploadSection.style.borderColor = "";
    selectedAbonnement = null;
    selectedPrix = null;
    uploadedImageUrl = null;
    document.querySelectorAll('.abonnement-card').forEach(c => c.classList.remove('selected'));
  };

  // Initialisation
  initAbonnement()

  // Inline validation
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