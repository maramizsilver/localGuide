(function () {
  // Sélectionne tous les éléments avec la classe "hero-bg"
  const bgElements = document.querySelectorAll(".hero-bg");

  if (bgElements.length > 0) {
    let current = 0;

    // Active la première image
    bgElements[current].classList.add("active");

    // Change d'image toutes les 3000 ms (3 secondes)
    setInterval(() => {
      bgElements[current].classList.remove("active");
      current = (current + 1) % bgElements.length;
      bgElements[current].classList.add("active");
    }, 4000);
  }
})();
