const guides = [
  {
    id: 1,
    name: "Salma Benali",
    specialty: "Gastronomie Monastirienne",
    category: "Gastronomie",
    description:
      "Spécialiste des saveurs authentiques de Monastir, Salma vous emmène explorer les marchés, les snacks cachés de la médina et les tables de pêcheurs du port.",
    tags: ["Médina", "Port", "Tajines"],
    rating: 4.9,
    reviews: 128,
    price: 45,
    available: "available",
    cover: "../images/gastronomie.jpg",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    featured: true,
  },
  {
    id: 2,
    name: "Karim Sfaxi",
    specialty: "Histoire & Ribat",
    category: "Histoire",
    description:
      "Archéologue de formation, Karim donne vie au Ribat, au Mausolée de Bourguiba et aux ruelles de la médina avec une maîtrise historique rare.",
    tags: ["Ribat", "Médina", "Byzantin"],
    rating: 4.8,
    reviews: 95,
    price: 55,
    available: "available",
    cover: "../images/Ribat.webp",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    featured: false,
  },
  {
    id: 3,
    name: "Nadia Hamrouni",
    specialty: "Pâtisseries & Douceurs",
    category: "Gastronomie",
    description:
      "Pâtissière chevronnée, Nadia propose des ateliers makroud et des dégustations dans les meilleures boutiques sucrées de Monastir.",
    tags: ["Makroud", "Pâtisserie", "Thé"],
    rating: 4.9,
    reviews: 112,
    price: 42,
    available: "available",
    cover: "../images/patisserie.jpg",
    avatar: "https://randomuser.me/api/portraits/women/29.jpg",
    featured: false,
  },
  {
    id: 4,
    name: "Anis Belhaj",
    specialty: "Pêche & Vie du Port",
    category: "Mer & Port",
    description:
      "Fils de pêcheur, Anis vous emmène au lever du soleil sur le port de Monastir, entre filets, criée et secrets de la mer qu'il connaît depuis l'enfance.",
    tags: ["Port", "Pêche", "Lever du soleil"],
    rating: 4.7,
    reviews: 68,
    price: 38,
    available: "available",
    cover: "../images/port.jpg",
    avatar: "https://randomuser.me/api/portraits/men/47.jpg",
    featured: false,
  },
  {
    id: 5,
    name: "Leila Mansouri",
    specialty: "Patrimoine Moderne & Bourguiba",
    category: "Histoire",
    description:
      "Historienne et conteuse, Leila tisse l'histoire du mouvement national tunisien et du mausolée de Bourguiba avec une passion communicative.",
    tags: ["Bourguiba", "Indépendance", "Mausolée"],
    rating: 4.7,
    reviews: 83,
    price: 48,
    available: "unavailable",
    cover: "../images/histoire.jpg",
    avatar: "https://randomuser.me/api/portraits/women/51.jpg",
    featured: false,
  },
  {
    id: 6,
    name: "Youssef Dridi",
    specialty: "Artisanat & Médina",
    category: "Artisanat",
    description:
      "Guide artisan, Youssef ouvre les portes des ateliers de broderie, de bijouterie et de tissage traditionnels nichés dans la médina de Monastir.",
    tags: ["Broderie", "Bijoux", "Souk"],
    rating: 4.6,
    reviews: 61,
    price: 38,
    available: "busy",
    cover: "../images/Artisanat.jpg",
    avatar: "https://randomuser.me/api/portraits/men/58.jpg",
    featured: false,
  },
  {
    id: 7,
    name: "Mehdi Trabelsi",
    specialty: "Balades Nocturnes",
    category: "Nocturne",
    description:
      "Expert des lumières de Monastir après le coucher du soleil, Mehdi révèle les cafés secrets, la corniche illuminée et le Ribat sous les étoiles.",
    tags: ["Nuit", "Corniche", "Ribat"],
    rating: 4.5,
    reviews: 48,
    price: 50,
    available: "available",
    cover: "../images/nocturne.jpg",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
    featured: false,
  },
];

let activeFilter = "Tous";
let currentSort = "rating";

function renderStars(r) {
  const f = Math.floor(r),
    h = r % 1 >= 0.5 ? 1 : 0;
  return "★".repeat(f) + (h ? "½" : "") + "☆".repeat(5 - f - h);
}
function availLabel(s) {
  return s === "available"
    ? "Disponible"
    : s === "busy"
    ? "Occupé"
    : "Indisponible";
}

function renderGrid() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  let list = [...guides];
  if (activeFilter !== "Tous")
    list = list.filter((g) => g.category === activeFilter);
  if (search)
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(search) ||
        g.specialty.toLowerCase().includes(search) ||
        g.description.toLowerCase().includes(search) ||
        g.tags.some((t) => t.toLowerCase().includes(search))
    );
  if (currentSort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (currentSort === "price") list.sort((a, b) => a.price - b.price);
  else if (currentSort === "reviews")
    list.sort((a, b) => b.reviews - a.reviews);
  else list.sort((a, b) => b.rating - a.rating);

  document.getElementById("guideCount").textContent = list.length;
  const grid = document.getElementById("guidesGrid");

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Aucun guide trouvé</h3><p>Essayez un autre filtre ou mot-clé.</p></div>`;
    return;
  }

  grid.innerHTML = list
    .map((g) => {
      const tags = g.tags.map((t) => `<span class="tag">${t}</span>`).join("");
      const disabled =
        g.available === "unavailable"
          ? 'disabled style="opacity:0.5;cursor:not-allowed"'
          : "";
      return `
      <article class="card ${g.featured ? "featured" : ""}" data-id="${g.id}">
        <div class="card-image">
          <img src="${g.cover}" alt="${g.name}" loading="lazy">
          <span class="card-badge">${g.specialty}</span>
          <span class="card-availability ${g.available}" title="${availLabel(
        g.available
      )}"></span>
        </div>
        <div class="card-body">
          ${
            g.featured
              ? '<span class="featured-label">Guide en vedette</span>'
              : ""
          }
          <div class="card-header">
            <img src="${g.avatar}" alt="${g.name}" class="guide-avatar">
            <div class="card-meta">
              <div class="card-name">${g.name}</div>
              <div class="card-specialty">${g.category}</div>
            </div>
          </div>
          <p class="card-desc">${g.description}</p>
          <div class="card-tags">${tags}</div>
          <div class="card-footer">
            <div class="card-rating">
              <span class="stars">${renderStars(g.rating)}</span>
              <span class="rating-num">${g.rating}</span>
              <span class="review-count">(${g.reviews} avis)</span>
            </div>
            <div class="card-price">${g.price} TND <span>/ pers.</span></div>
          </div>
          <div class="card-cta">
            <button class="btn-book" ${disabled} onclick="bookGuide(${g.id})">
              ${g.available === "unavailable" ? "Non disponible" : " Réserver"}
            </button>
            <button class="btn-profile" title="Voir le profil" onclick="viewProfile(${
              g.id
            })">👤</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function setFilter(cat, el) {
  activeFilter = cat;
  document
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  renderGrid();
}

function bookGuide(id) {
  const g = guides.find((x) => x.id === id);
  alert(
    `✅ Demande de réservation envoyée à ${g.name} !\nNous vous contacterons très bientôt.`
  );
}
function viewProfile(id) {
  const g = guides.find((x) => x.id === id);
  alert(
    `📋 Profil de ${g.name}\n\nSpécialité : ${g.specialty}\nNote : ${
      g.rating
    }/5 (${g.reviews} avis)\nTarif : ${
      g.price
    } TND / pers.\nStatut : ${availLabel(g.available)}\n\n${g.description}`
  );
}

window.addEventListener("scroll", () =>
  document
    .getElementById("mainNav")
    .classList.toggle("scrolled", window.scrollY > 50)
);
renderGrid();
