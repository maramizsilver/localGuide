// JavaScript pour la page fichecomm.html
// Ajoutez ici le code JavaScript spécifique à cette page

document.addEventListener("DOMContentLoaded", () => {
  // Code d'initialisation pour la page fiche commerce
  console.log("Page fichecomm chargée");

  // Gestion de la transparence de la navbar au défilement
  const nav = document.querySelector(".nav");
  if (nav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    });
  }

  // Animation de la galerie photos
  const gMain = document.querySelector(".g-main");
  const g1 = document.querySelector(".g1");
  const g2 = document.querySelector(".g2");

  if (gMain && g1 && g2) {
    // Fonction pour changer l'image principale
    const changeMainImage = (sourceElement) => {
      const bgImage = window.getComputedStyle(sourceElement).backgroundImage;
      gMain.style.backgroundImage = bgImage;
      // Animation de transition
      gMain.style.transition = "background-image 0.3s ease";
    };

    // Écouteurs d'événements pour les miniatures
    g1.addEventListener("click", () => changeMainImage(g1));
    g2.addEventListener("click", () => changeMainImage(g2));
  }

  // Animation d'apparition des cartes au scroll
  const cards = document.querySelectorAll(".card");
  if (cards.length > 0) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    cards.forEach(card => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(card);
    });
  }

  // Fonctions et animations pour les boutons d'actions
  const actionButtons = document.querySelectorAll(".actions .btn");
  actionButtons.forEach(button => {
    // Animation au survol
    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.05)";
      button.style.transition = "transform 0.2s ease";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
    });

    // Fonctions au clic
    button.addEventListener("click", (e) => {
      // Animation de clic
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "scale(1)";
      }, 150);

      const text = button.textContent.trim();
      if (text === "Appeler") {
        // Ouvrir le dialer téléphonique
        window.location.href = "tel:+21655000000";
      } else if (text === "Itinéraire") {
        // Ouvrir Google Maps
        window.open("https://www.google.com/maps/search/?api=1&query=Corniche,+Monastir,+Tunisie", "_blank");
      } else if (text.includes("Ajouter un avis")) {
        // Rediriger vers la page des avis ou ouvrir un modal simple
        // Pour l'instant, alerte ; peut être remplacé par une navigation
        alert("Fonctionnalité d'ajout d'avis à implémenter. Redirection vers avis.html...");
        window.location.href = "avis.html";
      }
    });
  });
});