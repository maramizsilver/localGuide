// frontend/js/fichecomm.js
import { supabase } from './supabaseClient.js'

// Récupérer l'ID du commerce dans l'URL
const urlParams = new URLSearchParams(window.location.search)
const commerceId = urlParams.get('id')

// Variables globales
let currentCommerce = null

// ============================================
// 1. CHARGER LES DONNÉES DU COMMERCE
// ============================================
async function loadCommerce() {
    if (!commerceId) {
        console.error('Aucun ID de commerce dans l\'URL')
        return
    }
    
    const { data, error } = await supabase
        .from('commerces')
        .select('*')
        .eq('id', commerceId)
        .single()
    
    if (error) {
        console.error('Erreur chargement commerce:', error)
        return
    }
    
    currentCommerce = data
    renderCommerce(data)
}

// ============================================
// 2. AFFICHER LES DONNÉES DU COMMERCE
// ============================================
function renderCommerce(commerce) {
    // Mettre à jour le titre
    const titleElement = document.querySelector('h1')
    if (titleElement) titleElement.textContent = commerce.nom
    
    // Mettre à jour la localisation
    const locationElements = document.querySelectorAll('.pill')
    locationElements.forEach(el => {
        if (el.textContent.includes('Corniche') || el.textContent.includes('Centre-ville')) {
            el.textContent = commerce.adresse
        }
    })
    
    // Mettre à jour la description
    const descElement = document.querySelector('.card-body .muted')
    if (descElement && !descElement.closest('.review')) {
        descElement.textContent = commerce.description || 'Aucune description disponible.'
    }
    
    // Mettre à jour les horaires
    const hoursElements = document.querySelectorAll('.hour')
    if (hoursElements.length > 0 && commerce.h_ouverture && commerce.h_fermeture) {
        hoursElements.forEach(el => {
            const timeSpan = el.querySelector('.time')
            if (timeSpan) {
                timeSpan.textContent = `${commerce.h_ouverture} – ${commerce.h_fermeture}`
            }
        })
    }
    
    // Mettre à jour les infos de contact
    const infoRows = document.querySelectorAll('.info-row')
    infoRows.forEach(row => {
        const strong = row.querySelector('strong')
        if (strong && strong.textContent === 'Téléphone') {
            const link = row.querySelector('a')
            if (link) {
                link.textContent = commerce.phone || 'Non renseigné'
                link.href = `tel:${commerce.phone}`
            }
        }
        if (strong && strong.textContent === 'Adresse') {
            const span = row.querySelector('span')
            if (span) span.textContent = commerce.adresse || 'Non renseignée'
        }
    })
    
    // Mettre à jour la photo de couverture
    const coverElement = document.querySelector('.cover')
    if (coverElement && commerce.image_url) {
        coverElement.style.backgroundImage = `url(${commerce.image_url})`
        coverElement.style.backgroundSize = 'cover'
        coverElement.style.backgroundPosition = 'center'
    }
}

// ============================================
// 3. CHARGER LES AVIS
// ============================================
async function loadAvis() {
    if (!commerceId) return
    
    const { data, error } = await supabase
        .from('avis')
        .select('*, users_profiles(display_name)')
        .eq('commerce_id', commerceId)
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur chargement avis:', error)
        return
    }
    
    const container = document.querySelector('.reviews')
    if (!container) return
    
    if (data.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center;">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>'
        return
    }
    
    container.innerHTML = data.map(avis => `
        <div class="review">
            <div class="review-head">
                <div class="user">
                    <div class="avatar">${avis.users_profiles?.display_name?.charAt(0) || '?'}</div>
                    <div>
                        <strong>${avis.users_profiles?.display_name || 'Anonyme'}</strong><br />
                        <span class="muted" style="font-size: 12px">${new Date(avis.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
                <div class="stars">${'⭐'.repeat(avis.note_globale)}</div>
            </div>
            <div class="review-title" style="font-weight: 600; margin: 8px 0 4px;">${avis.titre}</div>
            <div class="muted">${avis.avis_texte}</div>
        </div>
    `).join('')
}

// ============================================
// 4. AJOUTER UN FORMULAIRE D'AVIS
// ============================================
async function addReviewForm() {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Trouver l'endroit où ajouter le formulaire
    const reviewsSection = document.querySelector('.card:has(.reviews)')
    if (!reviewsSection) return
    
    // Vérifier si le formulaire existe déjà
    if (document.getElementById('reviewFormSection')) return
    
    const formHtml = `
        <div id="reviewFormSection" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.1);">
            <h3>${user ? '📝 Donnez votre avis' : '🔐 Connectez-vous pour laisser un avis'}</h3>
            ${user ? `
                <form id="reviewForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Titre de l'avis *</label>
                        <input type="text" id="reviewTitle" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" required>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Note (1 à 5) *</label>
                        <select id="reviewNote" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" required>
                            <option value="5">⭐⭐⭐⭐⭐ 5/5 - Excellent</option>
                            <option value="4">⭐⭐⭐⭐ 4/5 - Très bien</option>
                            <option value="3">⭐⭐⭐ 3/5 - Bien</option>
                            <option value="2">⭐⭐ 2/5 - Moyen</option>
                            <option value="1">⭐ 1/5 - Décevant</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Votre avis *</label>
                        <textarea id="reviewText" rows="4" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" required></textarea>
                    </div>
                    <button type="submit" style="background: #d42b2b; color: white; border: none; padding: 12px 24px; border-radius: 50px; cursor: pointer; font-weight: 600;">
                        📨 Publier mon avis
                    </button>
                </form>
                <div id="reviewMessage" style="margin-top: 15px;"></div>
            ` : `
                <p><a href="login.html" style="color: #d42b2b;">Connectez-vous</a> pour laisser un avis.</p>
            `}
        </div>
    `
    
    reviewsSection.insertAdjacentHTML('beforeend', formHtml)
    
    // Ajouter l'écouteur d'événement si l'utilisateur est connecté
    if (user) {
        const form = document.getElementById('reviewForm')
        const messageDiv = document.getElementById('reviewMessage')
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const titre = document.getElementById('reviewTitle').value
                const note_globale = parseInt(document.getElementById('reviewNote').value)
                const avis_texte = document.getElementById('reviewText').value
                
                messageDiv.innerHTML = '⏳ Envoi en cours...'
                messageDiv.style.color = 'blue'
                
                const { error } = await supabase
                    .from('avis')
                    .insert({
                        commerce_id: commerceId,
                        user_id: user.id,
                        note_globale: note_globale,
                        titre: titre,
                        avis_texte: avis_texte,
                        ville: currentCommerce?.ville || 'Monastir',
                        date_visite: new Date().toISOString().split('T')[0]
                    })
                
                if (error) {
                    messageDiv.innerHTML = '❌ Erreur: ' + error.message
                    messageDiv.style.color = 'red'
                } else {
                    messageDiv.innerHTML = '✅ Merci pour votre avis !'
                    messageDiv.style.color = 'green'
                    form.reset()
                    setTimeout(() => {
                        loadAvis()
                        messageDiv.innerHTML = ''
                    }, 2000)
                }
            })
        }
    }
}

// ============================================
// 5. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Gestion navbar
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
    
    // Charger les données
    await loadCommerce()
    await loadAvis()
    await addReviewForm()
})