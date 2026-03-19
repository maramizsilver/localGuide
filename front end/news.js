const articles = [
  {
    id: 1,
    category: "Gastronomie",
    type: "news",
    title: "Les meilleures adresses pour le poisson grillé au port de Monastir",
    excerpt:
      "Le port de pêche de Monastir cache quelques tables de caractère où les pêcheurs eux-mêmes viennent déjeuner. Notre guide Salma Benali a sélectionné les 4 adresses incontournables pour savourer une friture maison les pieds dans l'eau.",
    date: "15 Fév 2025",
    readTime: "4 min",
    img: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80",
    author: {
      name: "Salma B.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    isNew: true,
  },
  {
    id: 2,
    category: "Patrimoine",
    type: "news",
    title: "Le Ribat de Monastir : secrets et anecdotes méconnus",
    excerpt:
      "Construit au VIIIe siècle, le Ribat de Monastir est bien plus qu'une forteresse. Notre guide Karim dévoile les détails architecturaux et symboliques que même les habitants ignorent, ainsi que les dernières découvertes des fouilles.",
    date: "10 Fév 2025",
    readTime: "6 min",
    img: "images/Ribat_news.jpg",
    author: {
      name: "Karim S.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    isNew: false,
  },
  {
    id: 3,
    category: "Nouveau Commerce",
    type: "commerces",
    title:
      "Miss cake :C’est officiel, l’univers gourmand de Miss Cake a posé ses valises au cœur de Stah Jaber ",

    excerpt:
      "Miss Cake vous accueille au cœur de Stah Jaber, à Monastir. Située prés de ISIMM , notre boutique est facilement accessible et constitue la nouvelle halte gourmande du quartier.",
    date: "6 Fév 2025",
    readTime: "3 min",
    img: "images/misscake.png",
    author: {
      name: "Équipe LG",
      avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
    },
    isNew: true,
  },
  {
    id: 4,
    category: "Promotion",
    type: "promos",
    title: "-20% sur les visites guidées du Ribat ce weekend",
    excerpt:
      "Pour fêter le lancement de notre nouvelle fonctionnalité de réservation en ligne, profitez d'une réduction exceptionnelle sur toutes les visites guidées du Ribat de Monastir samedi et dimanche.",
    date: "3 Fév 2025",
    readTime: "2 min",
    img: "images/reduction tour ribat.avif",
    author: {
      name: "Équipe LG",
      avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
    },
    isNew: true,
  },
  {
    id: 5,
    category: "Nouveau Commerce",
    type: "commerces",
    title: "Boulangerie Artisanale Bled : le pain au feu de bois est de retour",
    excerpt:
      "Installée dans le quartier historique de Monastir, la boulangerie Bled ravive la tradition du pain cuit au feu de bois. Des recettes transmises de génération en génération, à deux pas de la médina.",
    date: "28 Jan 2025",
    readTime: "3 min",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    author: {
      name: "Équipe LG",
      avatar: "https://randomuser.me/api/portraits/lego/3.jpg",
    },
    isNew: false,
  },
  {
    id: 6,
    category: "Culture",
    type: "news",
    title:
      "La Mausolée de Bourguiba : plongée dans l'histoire moderne de Monastir",
    excerpt:
      "Symbole de la Tunisie indépendante, le mausolée de Habib Bourguiba domine la médina de Monastir. Leila Mansouri retrace son histoire, son architecture et les anecdotes que les guides locaux transmettent.",
    date: "20 Jan 2025",
    readTime: "5 min",
    img: "images/bourguiba mosquee.jpg",
    author: {
      name: "Leila M.",
      avatar: "https://randomuser.me/api/portraits/women/51.jpg",
    },
    isNew: false,
  },
];

const events = [
  {
    id: 1,
    day: "15",
    month: "Mars",
    title: "Festival des Saveurs du Ribat — Monastir",
    location: "Place du Ribat, Monastir",
    time: "10h – 22h",
    typeLabel: "Gratuit",
    tag: "nouveau",
  },
  {
    id: 2,
    day: "22",
    month: "Mars",
    title: "Atelier Pêche Traditionnelle au Port de Monastir",
    location: "Port de Monastir",
    time: "7h – 11h",
    typeLabel: "30 TND",
    tag: "bientot",
  },
  {
    id: 3,
    day: "29",
    month: "Mars",
    title: "Nuit des Musées : le Ribat en nocturne",
    location: "Ribat de Monastir",
    time: "20h – 23h30",
    typeLabel: "10 TND",
    tag: "nouveau",
  },
  {
    id: 4,
    day: "05",
    month: "Avr",
    title: "Souk des Artisans de la Médina de Monastir",
    location: "Médina, Monastir",
    time: "9h – 18h",
    typeLabel: "Entrée libre",
    tag: "promo",
  },
  {
    id: 5,
    day: "12",
    month: "Avr",
    title: "Masterclass Cuisine Tunisienne — Spécial Monastir",
    location: "Riad El Asfour, Monastir",
    time: "11h – 14h",
    typeLabel: "55 TND",
    tag: "bientot",
  },
  {
    id: 6,
    day: "19",
    month: "Avr",
    title: "Balade Photo : Monastir au lever du soleil",
    location: "Départ : Place Bourguiba, Monastir",
    time: "Départ 5h45",
    typeLabel: "25 TND",
    tag: "bientot",
  },
];

function renderArticles(filter = "tout") {
  const grid = document.getElementById("newsGrid");
  const list =
    filter === "tout" ? articles : articles.filter((a) => a.type === filter);
  if (!list.length) {
    grid.innerHTML = `<p style="color:var(--muted);padding:20px 0">Aucun article dans cette catégorie.</p>`;
    return;
  }
  grid.innerHTML = list
    .map(
      (a) => `
    <article class="news-card" onclick="openArticle(${a.id})">
      <div class="news-img">
        <img src="${a.img}" alt="${a.title}" loading="lazy">
        <span class="news-category">${a.category}</span>
        ${a.isNew ? '<span class="news-badge-new">Nouveau</span>' : ""}
      </div>
      <div class="news-body">
        <div class="news-date">${a.date}</div>
        <h3 class="news-title">${a.title}</h3>
        <p class="news-excerpt">${a.excerpt}</p>
        <div class="news-footer">
          <div class="news-author">
            <img src="${a.author.avatar}" class="author-avatar" alt="${
        a.author.name
      }">
            <span class="author-name">${a.author.name}</span>
          </div>
          <span class="news-read-time">⏱ ${a.readTime}</span>
        </div>
      </div>
    </article>`
    )
    .join("");
}

function renderEvents(filter = "tout") {
  const list = document.getElementById("eventsList");
  const show = ["tout", "events"].includes(filter);
  if (!show) {
    list.innerHTML = `<p style="color:var(--muted)">Aucun événement pour ce filtre.</p>`;
    return;
  }
  list.innerHTML = events
    .map(
      (e, i) => `
    <div class="event-card" style="animation-delay:${i * 0.07}s">
      <div class="event-date-box">
        <span class="event-day">${e.day}</span>
        <span class="event-month">${e.month}</span>
      </div>
      <div class="event-info">
        <div class="event-title">${e.title}</div>
        <div class="event-meta">
          <span>📍 ${e.location}</span>
          <span>🕐 ${e.time}</span>
          <span>🎟️ ${e.typeLabel}</span>
        </div>
      </div>
      <span class="event-tag ${e.tag}">${
        e.tag === "nouveau"
          ? "Nouveau"
          : e.tag === "promo"
          ? " Promo"
          : " Bientôt"
      }</span>
      <button class="event-register" onclick="registerEvent(${
        e.id
      })">S'inscrire</button>
    </div>`
    )
    .join("");
}

function switchTab(tab, el) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("newsSection").style.display = [
    "tout",
    "news",
    "commerces",
    "promos",
  ].includes(tab)
    ? ""
    : "none";
  document.getElementById("eventsSection").style.display = [
    "tout",
    "events",
  ].includes(tab)
    ? ""
    : "none";
  document.getElementById("featuredBanner").style.display =
    tab === "tout" ? "" : "none";
  renderArticles(tab === "tout" ? "tout" : tab);
  renderEvents(tab);
}

function openArticle(id) {
  const a = articles.find((x) => x.id === id);
  alert(
    `📰 ${a.title}\n\n${a.excerpt}\n\n— ${a.author.name} · ${a.date} · ${a.readTime} de lecture`
  );
}
function registerEvent(id) {
  const e = events.find((x) => x.id === id);
  alert(
    `✅ Inscription confirmée !\n"${e.title}"\n ${e.day} ${e.month} · ${e.time}\n📍 ${e.location}`
  );
}
function subscribeNewsletter() {
  const email = document.getElementById("emailNewsletter").value;
  if (!email || !email.includes("@")) {
    alert("Veuillez saisir une adresse email valide.");
    return;
  }
  alert(
    `🎉 Merci ! Vous êtes abonné(e) aux actualités de Monastir.\nConfirmation envoyée à : ${email}`
  );
  document.getElementById("emailNewsletter").value = "";
}

window.addEventListener("scroll", () =>
  document
    .getElementById("mainNav")
    .classList.toggle("scrolled", window.scrollY > 50)
);
renderArticles();
renderEvents();
