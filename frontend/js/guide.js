// frontend/js/guide.js
import { supabase } from './supabaseClient.js'

let allGuides = []           // ← Les vrais guides de Supabase
let activeFilter = "Tous"
let currentSort = "rating"

// ============================================
// 1. CHARGER les guides depuis Supabase
// ============================================
async function loadGuidesFromSupabase() {
    console.log('Chargement des guides depuis Supabase...')
    
    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('statut', 'disponible')
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return []
    }
    
    console.log('Guides chargés:', data.length)
    return data
}

// ============================================
// 2. Adapter les données Supabase au format de ton front
// ============================================
function adaptGuideData(supabaseGuide) {
    // Map des images par prénom
    const imagesMap = {
        'Salma': '../images/gastronomie.jpg',
        'Karim': '../images/Ribat.webp',
        'Nadia': '../images/patisserie.jpg',
        'Anis': '../images/port.jpg',
        'Mehdi': '../images/nocturne.jpg'
    };
    
    // Map des avatars
    const avatarMap = {
        'Salma': 'https://randomuser.me/api/portraits/women/44.jpg',
        'Karim': 'https://randomuser.me/api/portraits/men/32.jpg',
        'Nadia': 'https://randomuser.me/api/portraits/women/29.jpg',
        'Anis': 'https://randomuser.me/api/portraits/men/47.jpg',
        'Mehdi': 'https://randomuser.me/api/portraits/men/76.jpg'
    };
    
    return {
        id: supabaseGuide.id,
        name: `${supabaseGuide.prenom || ''} ${supabaseGuide.nom || ''}`,
        specialty: supabaseGuide.specialite || 'Guide local',
        category: supabaseGuide.specialite || 'Guide',
        description: supabaseGuide.motivation || 'Passionné par Monastir',
        tags: supabaseGuide.langue || ['Français', 'Arabe'],
        rating: supabaseGuide.note_moyenne || 4.5,
        reviews: supabaseGuide.nb_avis || 0,
        price: supabaseGuide.prix_guide || 45,
        available: supabaseGuide.statut === 'disponible' ? 'available' : 'busy',
        cover: imagesMap[supabaseGuide.prenom] || '../images/default-guide.jpg',
        avatar: avatarMap[supabaseGuide.prenom] || 'https://randomuser.me/api/portraits/men/32.jpg',
        featured: supabaseGuide.mise_en_avant || false,
        phone: supabaseGuide.phone,
        email: supabaseGuide.email
    }
}
// ============================================
// 3. Rendu des étoiles (inchangé)
// ============================================
function renderStars(r) {
    const f = Math.floor(r),
        h = r % 1 >= 0.5 ? 1 : 0
    return "★".repeat(f) + (h ? "½" : "") + "☆".repeat(5 - f - h)
}

function availLabel(s) {
    return s === "available" ? "Disponible" : s === "busy" ? "Occupé" : "Indisponible"
}

// ============================================
// 4. AFFICHAGE (MODIFIÉ pour utiliser Supabase)
// ============================================
async function renderGrid() {
    // Charger les guides depuis Supabase si pas déjà fait
    if (allGuides.length === 0) {
        const supabaseGuides = await loadGuidesFromSupabase()
        allGuides = supabaseGuides.map(adaptGuideData)
    }
    
    let list = [...allGuides]
    
    // Filtrer
    if (activeFilter !== "Tous")
        list = list.filter((g) => g.category === activeFilter)
    
    // Rechercher
    const search = document.getElementById("searchInput")?.value.toLowerCase() || ""
    if (search)
        list = list.filter(
            (g) =>
                g.name.toLowerCase().includes(search) ||
                g.specialty.toLowerCase().includes(search) ||
                g.description.toLowerCase().includes(search) ||
                (g.tags && g.tags.some((t) => t.toLowerCase().includes(search)))
        )
    
    // Trier
    if (currentSort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
    else if (currentSort === "price") list.sort((a, b) => a.price - b.price)
    else if (currentSort === "reviews") list.sort((a, b) => b.reviews - a.reviews)
    else list.sort((a, b) => b.rating - a.rating)
    
    const guideCount = document.getElementById("guideCount")
    if (guideCount) guideCount.textContent = list.length
    
    const grid = document.getElementById("guidesGrid")
    if (!grid) return
    
    if (!list.length) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Aucun guide trouvé</h3><p>Essayez un autre filtre ou mot-clé.</p></div>`
        return
    }
    
    grid.innerHTML = list
        .map((g) => {
            const tags = (g.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")
            const disabled = g.available === "unavailable" ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ""
            return `
                <article class="card ${g.featured ? "featured" : ""}" data-id="${g.id}">
                    <div class="card-image">
                        <img src="${g.cover}" alt="${g.name}" loading="lazy">
                        <span class="card-badge">${g.specialty}</span>
                        <span class="card-availability ${g.available}" title="${availLabel(g.available)}"></span>
                    </div>
                    <div class="card-body">
                        ${g.featured ? '<span class="featured-label">Guide en vedette</span>' : ''}
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
                                ${g.available === "unavailable" ? "Non disponible" : "Réserver"}
                            </button>
                            <button class="btn-profile" title="Voir le profil" onclick="viewProfile(${g.id})">👤</button>
                        </div>
                    </div>
                </article>`
        })
        .join("")
}

// ============================================
// 5. FONCTIONS (inchangées)
// ============================================
function setFilter(cat, el) {
    activeFilter = cat
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"))
    el.classList.add("active")
    renderGrid()
}

function bookGuide(id) {
    const g = allGuides.find((x) => x.id === id)
    if (g && g.available !== "unavailable") {
        alert(`✅ Demande de réservation envoyée à ${g.name} !\nNous vous contacterons très bientôt.`)
    } else {
        alert("❌ Ce guide n'est pas disponible pour le moment.")
    }
}

function viewProfile(id) {
    const g = allGuides.find((x) => x.id === id)
    if (g) {
        alert(`📋 Profil de ${g.name}\n\nSpécialité : ${g.specialty}\nNote : ${g.rating}/5 (${g.reviews} avis)\nTarif : ${g.price} TND / pers.\nStatut : ${availLabel(g.available)}\n\n${g.description}`)
    }
}

// ============================================
// 6. INITIALISATION
// ============================================
window.setFilter = setFilter
window.bookGuide = bookGuide
window.viewProfile = viewProfile
window.currentSort = currentSort

window.addEventListener("scroll", () =>
    document.getElementById("mainNav")?.classList.toggle("scrolled", window.scrollY > 50)
)

// Démarrer
renderGrid()