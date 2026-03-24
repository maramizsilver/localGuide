// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", function () {
  // Récupérer les éléments du DOM
  const filterButtons = document.querySelectorAll(".filter-btn");
  const commerceCards = document.querySelectorAll(".commerce-card");
  const statsElement = document.querySelector(".stats span");

  // Fonction pour compter les éléments par statut
  function compterElements() {
    let compteurs = {
      tous: commerceCards.length,
      "En attente": 0,
      Approuvés: 0,
      Refusés: 0,
    };

    // Parcourir toutes les cartes pour compter
    commerceCards.forEach((card) => {
      const badge = card.querySelector(".commerce-meta .badge:last-child");
      if (badge) {
        const badgeText = badge.textContent.trim();
        if (badgeText.includes("En attente")) {
          compteurs["En attente"]++;
        } else if (badgeText.includes("Approuvé")) {
          compteurs["Approuvés"]++;
        } else if (badgeText.includes("Refusé")) {
          compteurs["Refusés"]++;
        }
      }
    });

    return compteurs;
  }

  // Fonction pour filtrer les commerces
  function filtrerCommerces(statut) {
    commerceCards.forEach((card) => {
      const badge = card.querySelector(".commerce-meta .badge:last-child");
      if (badge) {
        const badgeText = badge.textContent.trim();

        // Cacher toutes les cartes par défaut
        card.style.display = "none";

        // Afficher selon le filtre
        if (statut === "Tous") {
          card.style.display = "flex";
        } else if (
          statut === "En attente" &&
          badgeText.includes("En attente")
        ) {
          card.style.display = "flex";
        } else if (statut === "Approuvés" && badgeText.includes("Approuvé")) {
          card.style.display = "flex";
        } else if (statut === "Refusés" && badgeText.includes("Refusé")) {
          card.style.display = "flex";
        }
      }
    });
  }

  // Fonction pour mettre à jour les compteurs dans les boutons
  function mettreAJourCompteurs() {
    const compteurs = compterElements();

    // Mettre à jour le texte des boutons
    filterButtons.forEach((button) => {
      const buttonText = button.textContent.trim();

      if (buttonText.includes("Tous")) {
        button.textContent = `Tous (${compteurs.tous})`;
      } else if (buttonText.includes("En attente")) {
        button.textContent = `En attente (${compteurs["En attente"]})`;
      } else if (buttonText.includes("Approuvés")) {
        button.textContent = `Approuvés (${compteurs["Approuvés"]})`;
      } else if (buttonText.includes("Refusés")) {
        button.textContent = `Refusés (${compteurs["Refusés"]})`;
      }
    });

    // Mettre à jour le stats dans l'en-tête
    if (statsElement) {
      statsElement.textContent = `⏳ En attente : ${compteurs["En attente"]}`;
    }
  }

  // Ajouter les événements de clic sur les boutons de filtre
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Retirer la classe active de tous les boutons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Ajouter la classe active au bouton cliqué
      this.classList.add("active");

      // Récupérer le texte du bouton pour identifier le filtre
      const buttonText = this.textContent.trim();

      // Extraire le statut (ignorer le compteur entre parenthèses)
      let statut = "Tous";
      if (buttonText.includes("En attente")) {
        statut = "En attente";
      } else if (buttonText.includes("Approuvés")) {
        statut = "Approuvés";
      } else if (buttonText.includes("Refusés")) {
        statut = "Refusés";
      }

      // Appliquer le filtre
      filtrerCommerces(statut);
      console.log("Filtre sélectionné:", statut);
    });
  });

  // Fonction pour mettre à jour les compteurs après une action de modération
  function mettreAJourApresAction() {
    mettreAJourCompteurs();

    // Réappliquer le filtre actif
    const activeFilter = document.querySelector(".filter-btn.active");
    if (activeFilter) {
      const buttonText = activeFilter.textContent.trim();
      let statut = "Tous";
      if (buttonText.includes("En attente")) {
        statut = "En attente";
      } else if (buttonText.includes("Approuvés")) {
        statut = "Approuvés";
      } else if (buttonText.includes("Refusés")) {
        statut = "Refusés";
      }
      filtrerCommerces(statut);
    }
  }

  // Modifier le script des actions de modération existant
  const actionButtons = document.querySelectorAll(".btn-approve, .btn-reject");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const action = this.classList.contains("btn-approve")
        ? "approuvé"
        : "refusé";
      const commerceCard = this.closest(".commerce-card");
      const commerce = commerceCard
        .querySelector("h3")
        .textContent.split("⚠️")[0]
        .trim();

      // Trouver le badge de statut
      const badge = commerceCard.querySelector(
        ".commerce-meta .badge:last-child"
      );

      // Simuler le changement de statut
      if (action === "approuvé") {
        badge.textContent = "✅ Approuvé";
        badge.style.backgroundColor = "#d4edda";
        badge.style.color = "#155724";
      } else if (action === "refusé") {
        badge.textContent = "❌ Refusé";
        badge.style.backgroundColor = "#f8d7da";
        badge.style.color = "#721c24";
      }

      alert(`Commerce "${commerce}" ${action} (simulation)`);

      // Mettre à jour les compteurs après l'action
      mettreAJourApresAction();
    });
  });

  // Initialiser les compteurs au chargement
  mettreAJourCompteurs();
});

// Script pour les filtres
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    console.log("Filtre sélectionné:", this.textContent);
  });
});

// Script pour les actions de modération
const actionButtons = document.querySelectorAll(".btn-approve, .btn-reject");

actionButtons.forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    const action = this.classList.contains("btn-approve")
      ? "approuvé"
      : "refusé";
    const commerce =
      this.closest(".commerce-card").querySelector("h3").textContent;

    alert(`Commerce "${commerce}" ${action} (simulation)`);
  });
});
