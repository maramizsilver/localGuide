document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form1");
  const uploadSection = document.querySelector(".upload-section");
  const fileInput = document.getElementById("picture");
  const uploadText = document.querySelector(".upload-text");
  const nav = document.querySelector(".nav");
  const successMessage = document.getElementById("successMessage");
  const successOverlay = document.getElementById("successOverlay");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitSpinner = document.getElementById("submitSpinner");

  // Gestion de la transparence au défilement
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });

  // Upload
  uploadSection.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const fileName = this.files[0].name;
      uploadText.textContent = `Fichier sélectionné : ${fileName}`;
      uploadSection.style.borderColor = "#4CAF50";
      uploadSection.style.background = "rgba(76, 175, 80, 0.1)";
    }
  });

  // Drag & Drop
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    uploadSection.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  uploadSection.addEventListener("dragover", () => {
    uploadSection.style.transform = "scale(1.02)";
    uploadSection.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });

  uploadSection.addEventListener("dragleave", () => {
    uploadSection.style.transform = "scale(1)";
    uploadSection.style.backgroundColor = "#676767";
  });

  uploadSection.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    uploadText.textContent = `Fichier déposé : ${files[0].name}`;
    uploadSection.style.transform = "scale(1)";
  });

  // Bouton Annuler
  const btnCancel = document.querySelector(".btn-secondary");
  btnCancel.addEventListener("click", () => {
    if (
      confirm("Êtes-vous sûr de vouloir effacer toutes les données saisies ?")
    ) {
      form.reset();
      uploadText.textContent = "Déposez votre image ici";
      uploadSection.style.borderColor = "#cbd5e0";
      uploadSection.style.background =
        "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)";
    }
  });

  // Fonction pour afficher le message de succès
  function showSuccessMessage() {
    successOverlay.style.display = "block";
    successMessage.style.display = "block";
    document.body.style.overflow = "hidden"; // Empêche le défilement
  }

  // Fonction pour fermer le message de succès
  window.closeSuccessMessage = function () {
    successOverlay.style.display = "none";
    successMessage.style.display = "none";
    document.body.style.overflow = "auto"; // Réactive le défilement
  };

  // Soumission du formulaire
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Empêche l'envoi réel pour la démo

    // Validation simple
    const name = document.getElementById("name").value;
    const categorie = document.getElementById("categorie").value;
    const adresse = document.getElementById("adresse").value;
    const ville = document.getElementById("ville").value;
    const codepostal = document.getElementById("codepostal").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const open = document.getElementById("open").value;

    // Vérifie si tous les champs requis sont remplis
    if (
      !name ||
      !categorie ||
      !adresse ||
      !ville ||
      !codepostal ||
      !phone ||
      !email ||
      !open
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Affiche le spinner
    submitBtn.disabled = true;
    submitText.style.display = "none";
    submitSpinner.style.display = "inline-block";

    // Simule un envoi (2 secondes)
    setTimeout(() => {
      // Cache le spinner
      submitBtn.disabled = false;
      submitText.style.display = "inline";
      submitSpinner.style.display = "none";

      // Affiche le message de succès
      showSuccessMessage();

      // Réinitialise le formulaire
      form.reset();
      uploadText.textContent = "Déposez votre image ici";
      uploadSection.style.borderColor = "#cbd5e0";
      uploadSection.style.background =
        "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)";
    }, 2000);
  });

  // Fermer le message de succès en cliquant sur l'overlay
  successOverlay.addEventListener("click", closeSuccessMessage);

  // Compteur de caractères
  const description = document.getElementById("description");
  const charCounter = document.getElementById("charCounter");

  description.addEventListener("input", () => {
    const remaining = description.value.length;
    charCounter.textContent = `${remaining}/500 caractères`;

    if (remaining > 450) {
      charCounter.classList.add("warning");
    } else {
      charCounter.classList.remove("warning");
    }

    if (remaining >= 500) {
      charCounter.classList.add("danger");
    } else {
      charCounter.classList.remove("danger");
    }
  });
});
