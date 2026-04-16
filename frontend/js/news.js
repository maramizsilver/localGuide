// frontend/js/news.js
import { supabase } from './supabaseClient.js'
import { getCache, setCache } from './cache.js'

// Variables globales
let allArticles = []
let allEvents = []
let currentFilter = 'tout'

// ============================================
//  ACTUALITÉS PAR DÉFAUT (si BD vide)
// ============================================
const DEFAULT_ARTICLES = [
    {
        id: 'default-1',
        titre: " Découvrez la Corniche de Monastir",
        type: "actu",
        description: "La corniche de Monastir vient d'être rénovée avec une piste cyclable et des espaces de détente. Parfait pour une balade en famille !",
        date_debut: new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/corniche.jpg',
        commerce_nom: "Mairie de Monastir",
        email_contact: "contact@localguide.tn",
        statut: "publié"
    },
    {
        id: 'default-2',
        titre: " Nouveau restaurant : Le Pirate",
        type: "ouverture",
        description: "Un nouveau restaurant de fruits de mer ouvre ses portes au port de plaisance. Spécialité : poisson grillé et couscous aux fruits de mer.",
        date_debut: new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/pirate.jpg',
        commerce_nom: "Le Pirate Restaurant",
        email_contact: "contact@localguide.tn",
        statut: "publié"
    },
    {
        id: 'default-3',
        titre: " Festival international de Monastir",
        type: "evenement",
        description: "3 jours de fête et de musique au pied du Ribat ! Artistes tunisiens et internationaux au programme.",
        date_debut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/festivalmusic.jpg',
        commerce_nom: "Office du Tourisme",
        email_contact: "contact@localguide.tn",
        statut: "publié",
        adresse: "Place du Ribat, Monastir",
        prix_guide: "25"
    },
    {
        id: 'default-4',
        titre: " -20% sur les visites guidées",
        type: "promotion",
        description: "Profitez de -20% sur toutes les visites guidées du Ribat et de la Médina pendant tout le mois d'avril.",
        date_debut: new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/reduction tour ribat.avif',
        commerce_nom: "Guides de Monastir",
        email_contact: "contact@localguide.tn",
        statut: "publié"
    },
    {
        id: 'default-5',
        titre: " Nouvelle boutique artisanale",
        type: "ouverture",
        description: "Artisanat local : poterie, tapis et produits traditionnels. Idéal pour vos souvenirs de voyage !",
        date_debut: new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/artisanal.jpg',
        commerce_nom: "Souk El Artisan",
        email_contact: "contact@localguide.tn",
        statut: "publié"
    },
    {
        id: 'default-6',
        titre: " Concours photo 'Monastir en beauté'",
        type: "actu",
        description: "Participez à notre concours photo et gagnez des lots. Thème : les plus beaux endroits de Monastir.",
        date_debut: new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/photo_monastir.jpg',
        commerce_nom: "LocalGuide",
        email_contact: "contact@localguide.tn",
        statut: "publié"
    }
]

const DEFAULT_EVENTS = [
    {
        id: 'default-event-1',
        titre: " Concert au Ribat",
        type: "evenement",
        description: "Concert de musique classique dans l'enceinte historique du Ribat de Monastir.",
        date_debut: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/ribat.jpg',
        commerce_nom: "Ministère de la Culture",
        email_contact: "contact@localguide.tn",
        statut: "publié",
        adresse: "Ribat de Monastir",
        prix_guide: "15"
    },
    {
        id: 'default-event-2',
        titre: " Course de la solidarité",
        type: "evenement",
        description: "Course annuelle au profit des enfants défavorisés. Parcours de 5km et 10km.",
        date_debut: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/course.jpg',
        commerce_nom: "Association Espoir",
        email_contact: "contact@localguide.tn",
        statut: "publié",
        adresse: "Corniche de Monastir",
        prix_guide: "10"
    },
    {
        id: 'default-event-3',
        titre: " Festival de la gastronomie",
        type: "evenement",
        description: "Dégustation de plats traditionnels, ateliers cuisine et concours du meilleur chef.",
        date_debut: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        image_url: '../images/festival_degustation.jpg',
        commerce_nom: "Association Culinaire",
        email_contact: "contact@localguide.tn",
        statut: "publié",
        adresse: "Place du Marché, Monastir",
        prix_guide: "5"
    }
]

// ============================================
// 1. CHARGER les actualités depuis Supabase
// ============================================
async function loadActualitesFromSupabase() {
    console.log('Chargement des actualités...')
    
    // Vérifier le cache
    const cached = getCache('actualites')
    if (cached) {
        console.log(' Actualités depuis le cache')
        return cached
    }
    
    const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .eq('statut', 'publié')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return DEFAULT_ARTICLES
    }
    
    if (!data || data.length === 0) {
        return DEFAULT_ARTICLES
    }
    
    console.log(' Actualités depuis Supabase:', data.length)
    
    // Sauvegarder en cache
    setCache('actualites', data)
    
    return data
}
// ============================================
// 2. CHARGER les événements
// ============================================
async function loadEventsFromSupabase() {
    console.log('Chargement des événements...')
    
    // Vérifier le cache
    const cached = getCache('evenements')
    if (cached) {
        console.log(' Événements depuis le cache')
        return cached
    }
    
    const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .eq('type', 'evenement')
        .eq('statut', 'publié')
        .order('date_debut', { ascending: true })
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return DEFAULT_EVENTS
    }
    
    if (!data || data.length === 0) {
        return DEFAULT_EVENTS
    }
    
    console.log(' Événements depuis Supabase:', data.length)
    
    // Sauvegarder en cache
    setCache('evenements', data)
    
    return data
}

// ============================================
// 3. Adapter les données Supabase au format du front
// ============================================
function adaptArticle(actu) {
    // Utiliser l'image depuis Storage ou une image par défaut
    let imageUrl = '../images/default-news.jpg'
    
    if (actu.image_url && actu.image_url !== 'null' && actu.image_url !== '') {
        imageUrl = actu.image_url
    } else {
        // Fallback par type d'actualité
        const fallbackMap = {
            'evenement': '../images/event.jpg',
            'promotion': '../images/promo.jpg',
            'ouverture': '../images/new-shop.jpg',
            'actu': '../images/news.jpg'
        }
        imageUrl = fallbackMap[actu.type] || '../images/default-news.jpg'
    }
    
    // Déterminer l'icône/catégorie
    let categoryIcon = 'actualités'
    let categoryText = 'Actualité'
    if (actu.type === 'evenement') {
        categoryIcon = 'Événement'
        categoryText = 'Événement'
    } else if (actu.type === 'promotion') {
        categoryIcon = 'Promotion'
        categoryText = 'Promotion'
    } else if (actu.type === 'ouverture') {
        categoryIcon = 'Nouveau Commerce'
        categoryText = 'Nouveau Commerce'
    }
    
    return {
        id: actu.id,
        email: actu.email_contact,
        category: `${categoryIcon} ${categoryText}`,
        type: actu.type === 'evenement' ? 'events' : actu.type === 'promotion' ? 'promos' : actu.type === 'ouverture' ? 'commerces' : 'news',
        title: actu.titre,
        excerpt: actu.description?.substring(0, 150) + (actu.description?.length > 150 ? '...' : ''),
        description: actu.description,
        date: new Date(actu.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        readTime: '3 min',
        img: imageUrl,
        author: {
            name: actu.commerce_nom || 'LocalGuide',
            avatar: 'https://randomuser.me/api/portraits/lego/7.jpg'
        },
        isNew: new Date(actu.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        adresse: actu.adresse,
        prix: actu.prix_guide
    }
}

function adaptEvent(actu) {
    return {
        id: actu.id,
        day: new Date(actu.date_debut).getDate().toString(),
        month: new Date(actu.date_debut).toLocaleDateString('fr-FR', { month: 'short' }),
        title: actu.titre,
        location: actu.adresse || 'Monastir',
        time: 'À partir de ' + new Date(actu.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        typeLabel: actu.prix_guide ? actu.prix_guide + ' TND' : 'Gratuit',
        tag: new Date(actu.date_debut) > new Date() ? 'nouveau' : 'bientot',
        description: actu.description
    }
}


// ============================================
// 4. AJOUTER BOUTONS SUPPRIMER (admin OU créateur connecté)
// ============================================
async function addDeleteButtons() {
    // 1. Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // 2. Vérifier si c'est un admin
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
    
    // 3. Email de l'utilisateur connecté
    const currentUserEmail = user.email
    
    // 4. Parcourir toutes les cartes d'actualités
    document.querySelectorAll('.news-card').forEach(card => {
        const actualiteId = card.dataset.id
        const createdByEmail = card.dataset.createdBy  // Email du créateur stocké dans data-created-by
        
        // Vérifier si l'utilisateur connecté a le droit de supprimer
        const canDelete = isAdmin || (createdByEmail === currentUserEmail)
        
        // Ne pas ajouter si déjà existant
        if (card.querySelector('.btn-delete-news')) return
        
        if (canDelete) {
            const deleteBtn = document.createElement('button')
            deleteBtn.innerHTML = ' Supprimer'
            deleteBtn.className = 'btn-delete-news'
            deleteBtn.style.cssText = `
                background: #dc3545;
                color: white;
                border: none;
                padding: 5px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
                transition: all 0.2s;
            `
            deleteBtn.onmouseenter = () => {
                deleteBtn.style.background = '#c82333'
            }
            deleteBtn.onmouseleave = () => {
                deleteBtn.style.background = '#dc3545'
            }
            
            deleteBtn.onclick = async (e) => {
                e.stopPropagation()
                
                // Message de confirmation adapté
                const confirmMsg = isAdmin 
                    ? ` Supprimer cette actualité (action admin) ?`
                    : ` Supprimer votre actualité "${card.querySelector('.news-title')?.textContent || ''}" ?`
                
                if (!confirm(confirmMsg)) return
                
                // Supprimer de Supabase
                const { error } = await supabase
                    .from('actualites')
                    .delete()
                    .eq('id', actualiteId)
                
                if (error) {
                    alert(' Erreur: ' + error.message)
                } else {
                    alert(' Actualité supprimée')
                    card.remove()
                    
                    // Recharger les listes
                    allArticles = await loadActualitesFromSupabase()
                    allEvents = await loadEventsFromSupabase()
                    renderArticles(currentFilter)
                    renderEvents('tout')
                }
            }
            
            const footer = card.querySelector('.news-footer')
            if (footer) {
                footer.appendChild(deleteBtn)
            }
        }
    })
}

// ============================================
// 5. AFFICHER les articles
// ============================================
async function renderArticles(filter = 'tout') {
    const grid = document.getElementById('newsGrid')
    if (!grid) return
    
    if (allArticles.length === 0) {
        allArticles = await loadActualitesFromSupabase()
    }
    
    let list = [...allArticles]
    
    // Filtrer selon l'onglet
    if (filter === 'news') {
        list = list.filter(a => a.type === 'actu')
    } else if (filter === 'commerces') {
        list = list.filter(a => a.type === 'ouverture')
    } else if (filter === 'promos') {
        list = list.filter(a => a.type === 'promotion')
    } else if (filter === 'events') {
        list = []
    }
    
    const adaptedList = list.map(adaptArticle)
    
    if (adaptedList.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted);padding:20px 0; text-align:center;">Aucun article dans cette catégorie.</p>`
        return
    }
    
    grid.innerHTML = adaptedList.map(a => `
        <article class="news-card" data-id="${a.id}" data-created-by="${a.email || ''}">
            <div class="news-img">
                <img src="${a.img}" alt="${a.title}" loading="lazy" onerror="this.src='../images/default-news.jpg'">
                <span class="news-category">${a.category}</span>
                ${a.isNew ? '<span class="news-badge-new">Nouveau</span>' : ''}
            </div>
            <div class="news-body">
                <div class="news-date">${a.date}</div>
                <h3 class="news-title">${a.title}</h3>
                <p class="news-excerpt">${a.excerpt}</p>
                <div class="news-footer">
                    <div class="news-author">
                        <img src="${a.author.avatar}" class="author-avatar" alt="${a.author.name}">
                        <span class="author-name">${a.author.name}</span>
                    </div>
                    <span class="news-read-time">⏱ ${a.readTime}</span>
                </div>
            </div>
        </article>
    `).join('')
    
    setTimeout(() => addDeleteButtons(), 100)
}

// ============================================
// 6. AFFICHER les événements
// ============================================
async function renderEvents(filter = 'tout') {
    const listContainer = document.getElementById('eventsList')
    if (!listContainer) return
    
    if (allEvents.length === 0) {
        allEvents = await loadEventsFromSupabase()
    }
    
    if (allEvents.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--muted); text-align:center;"> Aucun événement pour le moment.</p>`
        return
    }
    
    const adaptedEvents = allEvents.map(adaptEvent)
    
    listContainer.innerHTML = adaptedEvents.map((e, i) => `
        <div class="event-card" style="animation-delay:${i * 0.07}s" data-id="${e.id}">
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
            <span class="event-tag ${e.tag}">${e.tag === 'nouveau' ? 'Nouveau' : 'Bientôt'}</span>
            <button class="event-register" onclick="registerEvent('${e.id}')">S'inscrire</button>
        </div>
    `).join('')
}

// ============================================
// 7. FONCTIONS D'INTERFACE
// ============================================
window.switchTab = function(tab, el) {
    currentFilter = tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    if (el) el.classList.add('active')
    
    const newsSection = document.getElementById('newsSection')
    const eventsSection = document.getElementById('eventsSection')
    const featuredBanner = document.getElementById('featuredBanner')
    
    if (newsSection) newsSection.style.display = ['tout', 'news', 'commerces', 'promos'].includes(tab) ? 'block' : 'none'
    if (eventsSection) eventsSection.style.display = ['tout', 'events'].includes(tab) ? 'block' : 'none'
    if (featuredBanner) featuredBanner.style.display = tab === 'tout' ? 'flex' : 'none'
    
    renderArticles(tab === 'tout' ? 'tout' : tab)
    if (tab === 'events' || tab === 'tout') renderEvents(tab)
}

window.openArticle = function(id) {
    const article = allArticles.find(a => a.id === id)
    if (article) {
        alert(` ${article.titre}\n\n${article.description}\n\n— ${article.commerce_nom || 'LocalGuide'}`)
    }
}

window.registerEvent = function(id) {
    const event = allEvents.find(e => e.id === id)
    if (event) {
        alert(`✅ Inscription confirmée !\n\n ${event.titre}\n📍 ${event.adresse || 'Monastir'}\n\nMerci de votre participation !`)
    }
}

window.subscribeNewsletter = function() {
    const email = document.getElementById('emailNewsletter')?.value
    if (!email || !email.includes('@')) {
        alert('📧 Veuillez saisir une adresse email valide.')
        return
    }
    alert(` Merci ! Vous êtes abonné(e) aux actualités de Monastir.\nConfirmation envoyée à : ${email}`)
    if (document.getElementById('emailNewsletter')) {
        document.getElementById('emailNewsletter').value = ''
    }
}

window.toggleAllNews = function(event) {
    if (event) event.preventDefault()
    const container = document.getElementById('allNews')
    if (container) {
        container.style.display = container.style.display !== 'none' ? 'none' : 'block'
        if (container.style.display === 'block') {
            const allGrid = document.getElementById('allNewsGrid')
            if (allGrid) allGrid.innerHTML = document.getElementById('newsGrid')?.innerHTML || ''
            setTimeout(() => addDeleteButtons(), 100)
        }
    }
}

window.closeAllNews = function() {
    const container = document.getElementById('allNews')
    if (container) container.style.display = 'none'
}

window.toggleAllEvents = function(event) {
    if (event) event.preventDefault()
    const container = document.getElementById('allEvents')
    if (container) {
        container.style.display = container.style.display !== 'none' ? 'none' : 'block'
        if (container.style.display === 'block') {
            const allList = document.getElementById('allEventsList')
            if (allList) allList.innerHTML = document.getElementById('eventsList')?.innerHTML || ''
        }
    }
}

window.closeAllEvents = function() {
    const container = document.getElementById('allEvents')
    if (container) container.style.display = 'none'
}

// ============================================
// 8. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderArticles('tout')
    renderEvents('tout')
})