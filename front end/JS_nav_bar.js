    // Gestion de la transparence au défilement du Nav bar
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (window.scrollY > 100) { // Si on a défilé de plus de 100px
    nav.classList.add('transparent');
  } else {
    nav.classList.remove('transparent');
  }
});