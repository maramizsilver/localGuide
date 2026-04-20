// frontend/js/fichecomm.js
import { supabase } from './supabaseClient.js'

let allCommerces = []        // Tous les commerces (source)
let displayedCommerces = []  // Commerces après filtres/recherche
let currentPage = 1
let itemsPerPage = 6
let activeFilter = "all"
let searchQuery = ""
let sortBy = "note"
let currentUser = null
let isLoading = false
let hasMore = true

// ============================================
// COMMERCES PAR DÉFAUT DE MONASTIR (6 commerces)
// ============================================
const DEFAULT_COMMERCES = [
    {
        id: 'default-1',
        nom: "Café & Restaurant Elgrotte",
        categorie: "restaurant",
        description: "Café et restaurant situé au Port Kahlia. Cuisine locale et ambiance chaleureuse face à la mer.",
        adresse: "Port Kahlia, route el karraiya",
        ville: "Monastir",
        phone: "22 769 3200",
        email: "contact@elgrotte.tn",
        h_ouverture: "09:00",
        h_fermeture: "23:00",
        fourchette_prix: "€€",
        image_url: "../images/elgrotte.jpg",
        statut: "actif",
        note_moyenne: 4.7,
        nb_avis: 89,
        isDefault: true
    },
    {
        id: 'default-2',
        nom: "Restaurant le Pirate Monastir",
        categorie: "restaurant",
        description: "Restaurant de fruits de mer au port de pêche. Spécialités de poisson grillé.",
        adresse: "Fishing Port 5000, El Ghedir",
        ville: "Monastir",
        phone: "73 468 1260",
        email: "contact@lepirate.tn",
        h_ouverture: "12:00",
        h_fermeture: "23:00",
        fourchette_prix: "€€€",
        image_url: "../images/pirate.jpg",
        statut: "actif",
        note_moyenne: 4.8,
        nb_avis: 127,
        isDefault: true
    },
    {
        id: 'default-3',
        nom: "Ribat de Monastir",
        categorie: "site",
        description: "Forteresse historique du VIIIe siècle. Monument emblématique de Monastir.",
        adresse: "Avenue Habib Bourguiba",
        ville: "Monastir",
        phone: null,
        email: "ribat@monastir.tn",
        h_ouverture: "08:00",
        h_fermeture: "17:00",
        fourchette_prix: "€",
        image_url: "../images/ribat.jpg",
        statut: "actif",
        note_moyenne: 4.9,
        nb_avis: 203,
        isDefault: true
    },
    {
        id: 'default-4',
        nom: "Café Bahri - coworking space",
        categorie: "cafe",
        description: "Café moderne avec espace coworking. Idéal pour travailler.",
        adresse: "Rue Mohammed Slim, à côté de la Mosquée Bourguiba",
        ville: "Monastir",
        phone: "52 966 1980",
        email: "contact@cafebahri.tn",
        h_ouverture: "08:00",
        h_fermeture: "22:00",
        fourchette_prix: "€",
        image_url: "../images/cbahri.jpg",
        statut: "actif",
        note_moyenne: 4.6,
        nb_avis: 112,
        isDefault: true
    },
    {
        id: 'default-5',
        nom: "ZEN",
        categorie: "boutique",
        description: "Boutique de vêtements et accessoires tendance.",
        adresse: "Avenue des Martyrs, en face de la gare Habib Bourguiba",
        ville: "Monastir",
        phone: null,
        email: "contact@zenboutique.tn",
        h_ouverture: "09:00",
        h_fermeture: "20:00",
        fourchette_prix: "€€",
        image_url: "../images/zen.jpg",
        statut: "actif",
        note_moyenne: 4.5,
        nb_avis: 67,
        isDefault: true
    },
    {
        id: 'default-6',
        nom: "YOYO",
        categorie: "restaurant",
        description: "Restaurant moderne sur la route de la Falaise. Cuisine fusion.",
        adresse: "QQHR+8Q9, Route de la Falaise",
        ville: "Monastir",
        phone: "95 232 8820",
        email: "contact@yoyo.tn",
        h_ouverture: "11:00",
        h_fermeture: "23:00",
        fourchette_prix: "€€",
        image_url: "../images/yoyo.jpg",
        statut: "actif",
        note_moyenne: 4.4,
        nb_avis: 45,
        isDefault: true
    }
]

// ============================================
// 1. VÉRIFIER SI LE COMMERCE EST OUVERT
// ============================================
function isCommerceOpen(ouverture, fermeture) {
    if (!ouverture || !fermeture) return { open: false, text: "Horaires non renseignés" }
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour + currentMinute / 60
    
    const [openHour, openMinute] = ouverture.split(':').map(Number)
    const [closeHour, closeMinute] = fermeture.split(':').map(Number)
    
    const openTime = openHour + (openMinute || 0) / 60
    const closeTime = closeHour + (closeMinute || 0) / 60
    
    let isOpen = false
    if (closeTime > openTime) {
        isOpen = currentTime >= openTime && currentTime <= closeTime
    } else {
        // Cas où le commerce ferme après minuit
        isOpen = currentTime >= openTime || currentTime <= closeTime
    }
    
    return { 
        open: isOpen, 
        text: isOpen ? "Ouvert" : "Fermé",
        openTime: ouverture,
        closeTime: fermeture
    }
}

// ============================================
// 2. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
// ============================================
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    let isAdmin = false
    if (user.email === 'admin@localguide.com') {
        isAdmin = true
    } else {
        const { data: profile } = await supabase
            .from('users_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        isAdmin = profile?.role === 'admin'
    }
    
    return {
        id: user.id,
        email: user.email,
        isAdmin: isAdmin
    }
}

// ============================================
// 3. CHARGER LES COMMERCES (BASE + DÉFAUT)
// ============================================
async function getCommerces() {
    console.log('Chargement des commerces...')
    
    try {
        const { data, error } = await supabase
            .from('commerces')
            .select('*')
            .eq('statut', 'actif')
            .order('created_at', { ascending: false })
        
        if (error) {
            console.log('📦 Erreur Supabase → commerces par défaut')
            return DEFAULT_COMMERCES
        }
        
        const bddCommerces = (data && data.length > 0) ? data : []
        const allCommerces = [...DEFAULT_COMMERCES, ...bddCommerces]
        
        console.log(`✅ ${bddCommerces.length} de la base + ${DEFAULT_COMMERCES.length} par défaut = ${allCommerces.length} total`)
        return allCommerces
    } catch (err) {
        console.error('Erreur:', err)
        return DEFAULT_COMMERCES
    }
}

// ============================================
// 4. SUPPRIMER UN COMMERCE
// ============================================
async function deleteCommerce(id, ownerId) {
    if (!currentUser) {
        alert('🔒 Vous devez être connecté pour supprimer un commerce')
        return false
    }
    
    const canDelete = currentUser.isAdmin || (currentUser.id === ownerId)
    
    if (!canDelete) {
        alert('❌ Vous n\'avez pas le droit de supprimer ce commerce')
        return false
    }
    
    if (!confirm('🗑️ Supprimer définitivement ce commerce ? Cette action est irréversible.')) return false
    
    const { error } = await supabase
        .from('commerces')
        .delete()
        .eq('id', id)
    
    if (error) {
        alert('❌ Erreur: ' + error.message)
        return false
    }
    
    alert('✅ Commerce supprimé avec succès')
    return true
}

// ============================================
// 5. MODIFIER UN COMMERCE
// ============================================
async function modifierCommerce(id, commerce) {
    if (!currentUser) {
        alert('🔒 Vous devez être connecté pour modifier un commerce')
        return false
    }
    
    const canEdit = currentUser.isAdmin || (currentUser.id === commerce.ownerId)
    
    if (!canEdit) {
        alert('❌ Vous n\'avez pas le droit de modifier ce commerce')
        return false
    }
    
    // Ouvrir un modal ou prompt pour modifier
    const nouveauNom = prompt("Nouveau nom du commerce :", commerce.nom)
    if (nouveauNom && nouveauNom !== commerce.nom) {
        const { error } = await supabase
            .from('commerces')
            .update({ nom: nouveauNom })
            .eq('id', id)
        
        if (error) {
            alert('❌ Erreur: ' + error.message)
            return false
        }
        commerce.nom = nouveauNom
    }
    
    const nouvelleAdresse = prompt("Nouvelle adresse :", commerce.adresse)
    if (nouvelleAdresse && nouvelleAdresse !== commerce.adresse) {
        const { error } = await supabase
            .from('commerces')
            .update({ adresse: nouvelleAdresse })
            .eq('id', id)
        
        if (error) {
            alert('❌ Erreur: ' + error.message)
            return false
        }
        commerce.adresse = nouvelleAdresse
    }
    
    const nouvelleHoraireOuverture = prompt("Nouvelle heure d'ouverture (HH:MM) :", commerce.h_ouverture)
    if (nouvelleHoraireOuverture && nouvelleHoraireOuverture !== commerce.h_ouverture) {
        const { error } = await supabase
            .from('commerces')
            .update({ h_ouverture: nouvelleHoraireOuverture })
            .eq('id', id)
        
        if (error) {
            alert('❌ Erreur: ' + error.message)
            return false
        }
        commerce.h_ouverture = nouvelleHoraireOuverture
    }
    
    const nouvelleHoraireFermeture = prompt("Nouvelle heure de fermeture (HH:MM) :", commerce.h_fermeture)
    if (nouvelleHoraireFermeture && nouvelleHoraireFermeture !== commerce.h_fermeture) {
        const { error } = await supabase
            .from('commerces')
            .update({ h_fermeture: nouvelleHoraireFermeture })
            .eq('id', id)
        
        if (error) {
            alert('❌ Erreur: ' + error.message)
            return false
        }
        commerce.h_fermeture = nouvelleHoraireFermeture
    }
    
    alert('✅ Commerce modifié avec succès !')
    return true
}

// ============================================
// 6. TRANSFORMER LES DONNÉES POUR L'AFFICHAGE
// ============================================
function adaptCommerce(commerce) {
    const iconMap = {
        'restaurant': '🍽️', 'cafe': '☕', 'boutique': '👗',
        'artisan': '🔨', 'sante': '💊', 'service': '🔧',
        'coiffeur': '✂️', 'site': '🏛️', 'default': '🏪'
    }
    
    const category = commerce.categorie?.toLowerCase() || 'default'
    const icon = iconMap[category] || iconMap.default
    const status = isCommerceOpen(commerce.h_ouverture, commerce.h_fermeture)
    
    const fullAddress = `${commerce.adresse || ''}, ${commerce.ville || 'Monastir'}, Tunisie`
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
    
    return {
        id: commerce.id,
        nom: commerce.nom,
        categorie: commerce.categorie,
        description: commerce.description,
        adresse: commerce.adresse,
        ville: commerce.ville,
        h_ouverture: commerce.h_ouverture,
        h_fermeture: commerce.h_fermeture,
        horaires: `${commerce.h_ouverture || '?'} - ${commerce.h_fermeture || '?'}`,
        tel: commerce.phone,
        note: commerce.note_moyenne || 4.0,
        avis: commerce.nb_avis || 10,
        prix: commerce.fourchette_prix || '€€',
        icon: icon,
        image_url: commerce.image_url,
        mapsUrl: mapsUrl,
        featured: commerce.publicite_prix > 0 || false,
        ownerId: commerce.owner_id || commerce.user_id,
        isDefault: commerce.isDefault || false,
        status: status
    }
}

// ============================================
// 7. FONCTIONS UTILITAIRES
// ============================================
function starsHtml(note) {
    const full = Math.floor(note);
    return "★".repeat(full) + "☆".repeat(5 - full);
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'
        if (m === '<') return '&lt;'
        if (m === '>') return '&gt;'
        return m
    })
}

function getGradientColor(categorie) {
    const colorMap = {
        'restaurant': 'linear-gradient(135deg, #d4956a 0%, #8b4513 100%)',
        'cafe': 'linear-gradient(135deg, #c8a87a 0%, #6b4423 100%)',
        'boutique': 'linear-gradient(135deg, #e8c9a8 0%, #d42b2b 100%)',
        'site': 'linear-gradient(135deg, #6a4e3a 0%, #3a2a1a 100%)',
        'default': 'linear-gradient(135deg, #e8a87c 0%, #b5451b 100%)'
    }
    return colorMap[categorie?.toLowerCase()] || colorMap.default
}


// ============================================
// 8. RENDU D'UNE CARTE
// ============================================
function renderCard(c) {
    const canDelete = currentUser && (currentUser.isAdmin || (c.ownerId && currentUser.id === c.ownerId)) && !c.isDefault
    const canEdit = currentUser && (currentUser.isAdmin || (c.ownerId && currentUser.id === c.ownerId)) && !c.isDefault
    
    const statusClass = c.status.open ? 'open' : 'closed'
    const statusText = c.status.open ? 'Ouvert' : 'Fermé'
    const statusColor = c.status.open ? '#2ea84a' : '#dc3545'
    
    const deleteButton = canDelete ? `
        <button class="btn-delete" onclick="supprimerCommerce('${c.id}', '${c.ownerId || ''}')" title="Supprimer">Supprimer</button>
    ` : ''
    
    const editButton = canEdit ? `
        <button class="btn-edit" onclick="editerCommerce('${c.id}')" title="Modifier">Modifier</button>
    ` : ''
    
    const imageHtml = c.image_url ? 
        `<img src="${c.image_url}" alt="${escapeHtml(c.nom)}" style="width:100%; height:100%; object-fit:cover;">` :
        `<div class="card-image-placeholder" style="background:${getGradientColor(c.categorie)};">${c.icon}</div>`
    
    return `
        <div class="card" data-id="${c.id}" data-cat="${c.categorie}">
            <div class="card-image">
                ${imageHtml}
                <div class="card-status">
                    <span class="status-dot ${statusClass}" style="background:${statusColor}; box-shadow:0 0 0 3px ${statusColor}33;"></span>
                    <span class="status-text ${statusClass}" style="color:${statusColor};">${statusText}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="card-header">
                    <div class="comm-icon">${c.icon}</div>
                    <div class="card-meta">
                        <div class="card-name">${escapeHtml(c.nom)}</div>
                        <div class="card-category">${escapeHtml(c.categorie)}</div>
                    </div>
                    <div class="card-actions">
                        ${editButton}
                        ${deleteButton}
                    </div>
                </div>
                <p class="card-desc">${escapeHtml(c.description?.substring(0, 80))}...</p>
                <div class="card-info">
                    <div class="card-info-row"><span class="info-icon">📍</span>${escapeHtml(c.adresse)}</div>
                    <div class="card-info-row"><span class="info-icon">🕐</span>${escapeHtml(c.horaires)}</div>
                </div>
                <div class="card-footer">
                    <div class="card-rating">
                        <span class="stars">${starsHtml(c.note)}</span>
                        <span class="rating-num">${c.note.toFixed(1)}</span>
                        <span class="review-count">(${c.avis} avis)</span>
                    </div>
                    <div class="card-price">${escapeHtml(c.prix)}</div>
                </div>
                <div class="card-cta">
                    <button class="btn-book" onclick="voirCommerce('${c.id}')">Voir la fiche</button>
                    <button class="btn-profile" onclick="ouvrirItineraire('${c.mapsUrl}')" title="Itinéraire">🗺️</button>
                    ${c.tel ? `<button class="btn-profile" onclick="appeler('${c.tel}')" title="Appeler">📞</button>` : ''}
                </div>
            </div>
        </div>`
}
// ============================================
// 9. FILTRES ET RECHERCHE (avec reset page)
// ============================================
function applyFiltersAndResetPage() {
    let liste = [...allCommerces]
    
    if (activeFilter !== "all") {
        liste = liste.filter(c => c.categorie === activeFilter)
    }
    
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        liste = liste.filter(c =>
            c.nom.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        )
    }
    
    if (sortBy === "note") liste.sort((a, b) => b.note - a.note)
    if (sortBy === "nom") liste.sort((a, b) => a.nom.localeCompare(b.nom))
    
    displayedCommerces = liste
    currentPage = 1
    hasMore = displayedCommerces.length > itemsPerPage
    
    const countDisplay = document.getElementById("countDisplay")
    if (countDisplay) countDisplay.textContent = displayedCommerces.length
    
    renderCurrentPage()
    renderPaginationButtons()
}

// ============================================
// 10. AFFICHER LA PAGE COURANTE
// ============================================
function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    const pageItems = displayedCommerces.slice(start, end)
    
    const grid = document.getElementById("commerceGrid")
    if (!grid) return
    
    if (pageItems.length === 0) {
        grid.innerHTML = `<div class="empty-state"><h3>Aucun commerce trouvé</h3></div>`
        return
    }
    
    grid.innerHTML = pageItems.map(renderCard).join("")
    console.log(`📄 Page ${currentPage}: ${pageItems.length} commerces affichés`)
    checkInfiniteScroll()
}

// 11. AFFICHER LES BOUTONS DE PAGINATION

function renderPaginationButtons() {
    const totalPages = Math.ceil(displayedCommerces.length / itemsPerPage)
    const paginationContainer = document.getElementById("paginationContainer")
    
    if (!paginationContainer) return
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = ''
        return
    }
    
    let buttonsHtml = `
        <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ◀ Précédent
        </button>
    `
    
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1)
    }
    
    if (startPage > 1) {
        buttonsHtml += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`
        if (startPage > 2) buttonsHtml += `<span class="pagination-dots">...</span>`
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttonsHtml += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) buttonsHtml += `<span class="pagination-dots">...</span>`
        buttonsHtml += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`
    }
    
    buttonsHtml += `
        <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Suivant ▶
        </button>
    `
    
    paginationContainer.innerHTML = buttonsHtml
}

// ============================================
// 12. CHANGER DE PAGE
// ============================================
window.goToPage = function(page) {
    const totalPages = Math.ceil(displayedCommerces.length / itemsPerPage)
    if (page < 1 || page > totalPages) return
    
    currentPage = page
    renderCurrentPage()
    renderPaginationButtons()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ============================================
// 13. CHARGER PLUS (Infinite Scroll)
// ============================================
function loadMore() {
    if (isLoading) return
    
    const totalPages = Math.ceil(displayedCommerces.length / itemsPerPage)
    if (currentPage >= totalPages) {
        hasMore = false
        return
    }
    
    isLoading = true
    currentPage++
    renderCurrentPage()
    renderPaginationButtons()
    isLoading = false
}

function checkInfiniteScroll() {
    const scrollPosition = window.innerHeight + window.scrollY
    const pageHeight = document.body.offsetHeight
    
    if (scrollPosition >= pageHeight - 300) {
        const totalPages = Math.ceil(displayedCommerces.length / itemsPerPage)
        if (currentPage < totalPages && !isLoading) {
            loadMore()
        }
    }
}

// ============================================
// 14. ACTIONS GLOBALES
// ============================================
window.voirCommerce = function(id) {
    window.location.href = `fiche-detail.html?id=${id}`
}

window.ouvrirItineraire = function(url) {
    if (url) window.open(url, '_blank')
    else alert('Adresse non disponible')
}

window.appeler = function(tel) {
    if (tel) window.location.href = `tel:${tel.replace(/\s/g, '')}`
    else alert('Numéro non disponible')
}

window.supprimerCommerce = async function(id, ownerId) {
    const success = await deleteCommerce(id, ownerId)
    if (success) {
        const commercesData = await getCommerces()
        allCommerces = commercesData.map(adaptCommerce)
        applyFiltersAndResetPage()
    }
}

window.editerCommerce = async function(id) {
    const commerce = allCommerces.find(c => c.id === id)
    if (!commerce) return
    
    const success = await modifierCommerce(id, commerce)
    if (success) {
        const commercesData = await getCommerces()
        allCommerces = commercesData.map(adaptCommerce)
        applyFiltersAndResetPage()
    }
}

// ============================================
// 15. INITIALISATION
// ============================================
async function init() {
    console.log('🟢 Initialisation avec pagination + infinite scroll...')
    
    currentUser = await getCurrentUser()
    console.log('👤 Utilisateur:', currentUser?.email || 'Non connecté')
    
    const grid = document.getElementById("commerceGrid")
    if (!grid) {
        console.error('❌ #commerceGrid introuvable')
        return
    }
    
    const commercesData = await getCommerces()
    allCommerces = commercesData.map(adaptCommerce)
    console.log(`📊 ${allCommerces.length} commerces préparés`)
    
    applyFiltersAndResetPage()
    
    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"))
            chip.classList.add("active")
            activeFilter = chip.dataset.cat
            applyFiltersAndResetPage()
        })
    })
    
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
        searchInput.addEventListener("input", e => {
            searchQuery = e.target.value
            applyFiltersAndResetPage()
        })
    }
    
    const sortSelect = document.getElementById("sortSelect")
    if (sortSelect) {
        sortSelect.addEventListener("change", e => {
            sortBy = e.target.value
            applyFiltersAndResetPage()
        })
    }
    
    window.addEventListener('scroll', () => {
        checkInfiniteScroll()
    })
}

document.addEventListener('DOMContentLoaded', init)
// ============================================
// DÉFILER VERS UN COMMERCE SPÉCIFIQUE (si ID dans l'URL)
// ============================================

// Fonction pour défiler vers un commerce et le mettre en évidence
function scrollToCommerce(commerceId) {
    console.log(` Recherche du commerce avec ID: ${commerceId}`);
    
    // Attendre que les cartes soient chargées
    setTimeout(() => {
        // Chercher la carte avec l'ID correspondant
        const commerceCard = document.querySelector(`.card[data-id="${commerceId}"]`);
        
        if (commerceCard) {
            console.log(` Commerce trouvé, défilement en cours...`);
            
            // Défiler jusqu'au commerce
            commerceCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Ajouter une classe pour mettre en évidence
            commerceCard.classList.add('highlight-commerce');
            
            // Enlever la classe après 3 secondes
            setTimeout(() => {
                commerceCard.classList.remove('highlight-commerce');
            }, 3000);
        } else {
            console.log(` Commerce ${commerceId} non trouvé dans la liste`);
        }
    }, 800); // Attendre 800ms que les cartes soient chargées
}

// Vérifier s'il y a un ID dans l'URL APRÈS le chargement
function checkUrlForCommerce() {
    const urlParams = new URLSearchParams(window.location.search);
    const commerceId = urlParams.get('id');
    
    if (commerceId) {
        console.log(`🔍 ID détecté dans l'URL: ${commerceId}`);
        // Attendre que la liste des commerces soit chargée
        const waitForCards = setInterval(() => {
            const cards = document.querySelectorAll('.card');
            if (cards.length > 0) {
                clearInterval(waitForCards);
                scrollToCommerce(commerceId);
                // Nettoyer l'URL pour éviter de re-défiler si l'utilisateur rafraîchit
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 100);
    }
}

// Lancer la vérification après le chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUrlForCommerce);
} else {
    checkUrlForCommerce();
}
// ============================================
// TEST POUR VOIR SI L'ID EST DÉTECTÉ
// ============================================

console.log('🔍 URL actuelle:', window.location.href);
console.log('🔍 Paramètres:', new URLSearchParams(window.location.search).toString());

const testId = new URLSearchParams(window.location.search).get('id');
console.log('🔍 ID trouvé:', testId);

if (testId) {
    console.log('✅ ID détecté! Recherche de la carte...');
    
    setTimeout(() => {
        const card = document.querySelector(`.card[data-id="${testId}"]`);
        if (card) {
            console.log(' CARTE TROUVÉE! Défilement...');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.border = '3px solid red';
            card.style.backgroundColor = '#fff0e6';
        } else {
            console.log(' Carte NON trouvée pour ID:', testId);
            console.log('IDs disponibles:', [...document.querySelectorAll('.card')].map(c => c.getAttribute('data-id')));
        }
    }, 2000);
}