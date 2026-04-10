// frontend/js/news.js
import { supabase } from './supabaseClient.js'

// Variables globales
let allArticles = []      // Tous les articles depuis Supabase
let allEvents = []        // Tous les événements depuis Supabase
let currentFilter = 'tout'

// ============================================
// 1. CHARGER les actualités depuis Supabase
// ============================================
async function loadActualitesFromSupabase() {
    console.log('Chargement des actualités depuis Supabase...')
    
    const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .eq('statut', 'publié')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return []
    }
    
    console.log('Actualités chargées:', data.length)
    return data
}

// ============================================
// 2. CHARGER les événements
// ============================================
async function loadEventsFromSupabase() {
    console.log('Chargement des événements depuis Supabase...')
    
    const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .eq('type', 'evenement')
        .eq('statut', 'publié')
        .order('date_debut', { ascending: true })
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return []
    }
    
    console.log('Événements chargés:', data.length)
    return data
}

// ============================================
// 3. Adapter les données Supabase au format du front
// ============================================
function adaptArticle(actu) {
    return {
        id: actu.id,
        email: actu.email_contact,
        category: actu.type === 'evenement' ? 'Événement' : actu.type === 'promotion' ? 'Promotion' : actu.type === 'ouverture' ? 'Nouveau Commerce' : 'Actualité',
        type: actu.type === 'evenement' ? 'events' : actu.type === 'promotion' ? 'promos' : actu.type === 'ouverture' ? 'commerces' : 'news',
        title: actu.titre,
        excerpt: actu.description?.substring(0, 150) + '...',
        date: new Date(actu.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        readTime: '3 min',
        img: actu.image_url || '../images/default-news.jpg',
        author: {
            name: actu.commerce_nom || 'LocalGuide',
            avatar: 'https://randomuser.me/api/portraits/lego/1.jpg'
        },
        isNew: new Date(actu.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
        tag: new Date(actu.date_debut) > new Date() ? 'nouveau' : 'bientot'
    }
}

// ============================================
// 4. AJOUTER BOUTONS SUPPRIMER
// ============================================
async function addDeleteButtons() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    const isAdmin = profile?.role === 'admin'
    
    document.querySelectorAll('.news-card').forEach(card => {
        const actualiteId = card.dataset.id
        const createdBy = card.dataset.createdBy
        
        console.log('ID trouvé:', actualiteId, 'Créé par:', createdBy, 'Utilisateur:', user.email)
        
        if (!actualiteId) {
            console.log('ID manquant pour cette carte')
            return
        }
        
        // Si admin OU créateur
        if (isAdmin || createdBy === user.email) {
            if (card.querySelector('.btn-delete-news')) return
            
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
            `
            deleteBtn.onclick = async (e) => {
                e.stopPropagation()
                if (confirm('Supprimer cette actualité ?')) {
                    const { error } = await supabase
                        .from('actualites')
                        .delete()
                        .eq('id', actualiteId)
                    
                    if (error) {
                        alert('Erreur: ' + error.message)
                    } else {
                        alert('✅ Actualité supprimée')
                        card.remove()
                    }
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
    
    // Charger les données si besoin
    if (allArticles.length === 0) {
        allArticles = await loadActualitesFromSupabase()
    }
    
    let list = [...allArticles]
    
    // Filtrer selon le type
    if (filter === 'news') {
        list = list.filter(a => a.type === 'actu')
    } else if (filter === 'commerces') {
        list = list.filter(a => a.type === 'ouverture')
    } else if (filter === 'promos') {
        list = list.filter(a => a.type === 'promotion')
    } else if (filter === 'events') {
        list = []
    }
    
    // Adapter les données
    const adaptedList = list.map(adaptArticle)
    
    if (adaptedList.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted);padding:20px 0">Aucun article dans cette catégorie.</p>`
        return
    }
    
    grid.innerHTML = adaptedList.map(a => `
        <article class="news-card" data-id="${a.id}" data-created-by="${a.email || ''}">
            <div class="news-img">
                <img src="${a.img}" alt="${a.title}" loading="lazy">
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
    
    // Ajouter les boutons supprimer
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
        listContainer.innerHTML = `<p style="color:var(--muted)">Aucun événement pour le moment.</p>`
        return
    }
    
    const adaptedEvents = allEvents.map(adaptEvent)
    
    listContainer.innerHTML = adaptedEvents.map((e, i) => `
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
            <span class="event-tag ${e.tag}">${e.tag === 'nouveau' ? 'Nouveau' : 'Bientôt'}</span>
            <button class="event-register" onclick="registerEvent(${e.id})">S'inscrire</button>
        </div>
    `).join('')
}

// ============================================
// 7. FONCTIONS D'INTERFACE
// ============================================
window.switchTab = function(tab, el) {
    currentFilter = tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    el.classList.add('active')
    
    const newsSection = document.getElementById('newsSection')
    const eventsSection = document.getElementById('eventsSection')
    const featuredBanner = document.getElementById('featuredBanner')
    
    if (newsSection) newsSection.style.display = ['tout', 'news', 'commerces', 'promos'].includes(tab) ? '' : 'none'
    if (eventsSection) eventsSection.style.display = ['tout', 'events'].includes(tab) ? '' : 'none'
    if (featuredBanner) featuredBanner.style.display = tab === 'tout' ? '' : 'none'
    
    renderArticles(tab === 'tout' ? 'tout' : tab)
    if (tab === 'events' || tab === 'tout') renderEvents(tab)
}

window.openArticle = function(id) {
    const article = allArticles.find(a => a.id === id)
    if (article) {
        alert(`📰 ${article.titre}\n\n${article.description}\n\n— ${article.commerce_nom || 'LocalGuide'}`)
    }
}

window.registerEvent = function(id) {
    const event = allEvents.find(e => e.id === id)
    if (event) {
        alert(`✅ Inscription confirmée !\n"${event.titre}"\n📅 ${new Date(event.date_debut).toLocaleDateString('fr-FR')}\n📍 ${event.adresse || 'Monastir'}`)
    }
}

window.subscribeNewsletter = function() {
    const email = document.getElementById('emailNewsletter')?.value
    if (!email || !email.includes('@')) {
        alert('Veuillez saisir une adresse email valide.')
        return
    }
    alert(`🎉 Merci ! Vous êtes abonné(e) aux actualités de Monastir.\nConfirmation envoyée à : ${email}`)
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