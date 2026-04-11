// frontend/js/admin.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. VÉRIFICATION ADMIN
// ============================================
// ============================================
// 1. VÉRIFICATION ADMIN (MODIFIÉE)
// ============================================
async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        window.location.href = 'login.html'
        return false
    }
    
    //ADMIN POUR CET EMAIL
    if (user.email === 'admin@localguide.com') {
        console.log(' Admin détecté par email')
        return true
    }
    
    // Sinon, vérifier dans la base
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (!profile || profile.role !== 'admin') {
        alert(' Accès interdit. Cette page est réservée aux administrateurs.')
        window.location.href = 'aceuil.html'
        return false
    }
    
    return true
}

// ============================================
// 2. CHARGER LES COMMERCES
// ============================================
async function loadCommerces() {
    const { data, error } = await supabase
        .from('commerces')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur chargement commerces:', error)
        return []
    }
    return data
}

// ============================================
// 3. APPROUVER UN COMMERCE (suspendu → actif)
// ============================================
async function approveCommerce(id) {
    if (!confirm('✅ Valider ce commerce ? Il sera visible sur le site.')) return
    
    const { error } = await supabase
        .from('commerces')
        .update({ statut: 'actif' })
        .eq('id', id)
    
    if (error) {
        alert('❌ Erreur: ' + error.message)
    } else {
        alert('✅ Commerce approuvé ! Il est maintenant visible sur le site.')
        renderCommerces()
    }
}

// ============================================
// 4. REFUSER UN COMMERCE (suspendu → fermé)
// ============================================
async function rejectCommerce(id) {
    const raison = prompt('❌ Pourquoi refusez-vous ce commerce ? (Optionnel)')
    
    if (!confirm('⛔ Refuser ce commerce ? Il ne sera pas visible sur le site.')) return
    
    const { error } = await supabase
        .from('commerces')
        .update({ 
            statut: 'fermé',
            raison_refus: raison || null
        })
        .eq('id', id)
    
    if (error) {
        alert('❌ Erreur: ' + error.message)
    } else {
        alert('❌ Commerce refusé.')
        renderCommerces()
    }
}

// ============================================
// 5. VOIR LE DÉTAIL D'UN COMMERCE
// ============================================
function viewCommerce(id) {
    window.location.href = `fichecomm.html?id=${id}`
}

// ============================================
// 6. AFFICHER LES COMMERCES
// ============================================
async function renderCommerces() {
    const commerces = await loadCommerces()
    
    // Récupérer le filtre actif
    let filterType = 'suspendu'
    const activeFilter = document.querySelector('.filter-btn.active')
    if (activeFilter) {
        const text = activeFilter.textContent
        if (text.includes('Tous')) filterType = 'all'
        else if (text.includes('Approuvés')) filterType = 'actif'
        else if (text.includes('Refusés')) filterType = 'fermé'
        else filterType = 'suspendu'
    }
    
    // Filtrer
    let filtered = commerces
    if (filterType === 'suspendu') {
        filtered = commerces.filter(c => c.statut === 'suspendu')
    } else if (filterType === 'actif') {
        filtered = commerces.filter(c => c.statut === 'actif')
    } else if (filterType === 'fermé') {
        filtered = commerces.filter(c => c.statut === 'fermé')
    }
    
    // Mettre à jour les compteurs dans les boutons
    const enAttente = commerces.filter(c => c.statut === 'suspendu').length
    const approuves = commerces.filter(c => c.statut === 'actif').length
    const refuses = commerces.filter(c => c.statut === 'fermé').length
    
    const filterBtns = document.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
        const text = btn.textContent
        if (text.includes('Tous')) btn.textContent = `Tous (${commerces.length})`
        if (text.includes('En attente')) btn.textContent = `En attente (${enAttente})`
        if (text.includes('Approuvés')) btn.textContent = `Approuvés (${approuves})`
        if (text.includes('Refusés')) btn.textContent = `Refusés (${refuses})`
    })
    
    // Mettre à jour le stats
    const statsElement = document.querySelector('.stats span')
    if (statsElement) {
        statsElement.textContent = `⏳ En attente : ${enAttente}`
    }
    
    // Afficher la liste des commerces
    const container = document.querySelector('.mod-header')?.parentElement
    if (!container) return
    
    // Supprimer les anciennes cartes
    const existingCards = container.querySelectorAll('.commerce-card')
    existingCards.forEach(card => card.remove())
    
    if (filtered.length === 0) {
        container.innerHTML += '<div style="padding:20px; text-align:center;">Aucun commerce dans cette catégorie</div>'
        return
    }
    
    filtered.forEach(commerce => {
        // Déterminer l'affichage selon le statut
        let statutBadge = ''
        let badgeColor = ''
        
        if (commerce.statut === 'actif') {
            statutBadge = '✅ Approuvé'
            badgeColor = '#d4edda'
        } else if (commerce.statut === 'suspendu') {
            statutBadge = '⏳ En attente'
            badgeColor = '#ffc107'
        } else if (commerce.statut === 'fermé') {
            statutBadge = '❌ Refusé'
            badgeColor = '#f8d7da'
        } else {
            statutBadge = '❓ Inconnu'
            badgeColor = '#e2e3e5'
        }
        
        const card = document.createElement('div')
        card.className = 'commerce-card'
        card.dataset.id = commerce.id
        card.innerHTML = `
            <div class="commerce-info">
                <h3>${commerce.nom}</h3>
                <p>📍 ${commerce.adresse}</p>
                <div class="commerce-meta">
                    <span class="badge">🏷️ ${commerce.categorie}</span>
                    <span class="badge" style="background-color: ${badgeColor};">${statutBadge}</span>
                </div>
                ${commerce.raison_refus ? `<p style="color:red; font-size:12px;">❌ Raison: ${commerce.raison_refus}</p>` : ''}
            </div>
            <div class="commerce-actions">
                <button class="btn btn-view" data-id="${commerce.id}">👁️ Voir</button>
                ${commerce.statut === 'suspendu' ? 
                    `<button class="btn btn-approve" data-id="${commerce.id}">✅ Valider</button>
                     <button class="btn btn-reject" data-id="${commerce.id}">❌ Refuser</button>` : ''}
                ${commerce.statut === 'actif' ? 
                    `<button class="btn btn-reject" data-id="${commerce.id}">🔒 Désactiver</button>` : ''}
            </div>
        `
        container.appendChild(card)
    })
    
    // Ajouter les événements
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => viewCommerce(btn.dataset.id))
    })
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => approveCommerce(btn.dataset.id))
    })
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => rejectCommerce(btn.dataset.id))
    })
}

// ============================================
// 7. INITIALISATION DES FILTRES COMMERCES
// ============================================
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn')
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterButtons.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            await renderCommerces()
        })
    })
}

// ============================================
// 8. GESTION DES GUIDES EN ATTENTE (NOUVEAU)
// ============================================
async function loadGuidesEnAttente() {
    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('statut', 'inactif')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur chargement guides:', error)
        return []
    }
    return data
}

async function approveGuide(id) {
    if (!confirm('✅ Approuver ce guide ? Il sera visible sur le site.')) return
    
    const { error } = await supabase
        .from('guides')
        .update({ statut: 'disponible' })
        .eq('id', id)
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert('✅ Guide approuvé ! Il est maintenant visible sur le site.')
        renderGuidesEnAttente()
    }
}

async function rejectGuide(id) {
    const raison = prompt('❌ Pourquoi refusez-vous ce guide ? (Optionnel)')
    
    if (!confirm('⛔ Refuser ce guide ?')) return
    
    const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id)
    
    if (error) {
        alert('❌ Erreur: ' + error.message)
    } else {
        alert('❌ Guide refusé.')
        renderGuidesEnAttente()
    }
}

async function renderGuidesEnAttente() {
    const guides = await loadGuidesEnAttente()
    
    let guidesSection = document.getElementById('guidesEnAttenteSection')
    
    if (!guidesSection) {
        const container = document.querySelector('.admin-container')
        if (!container) return
        
        guidesSection = document.createElement('div')
        guidesSection.id = 'guidesEnAttenteSection'
        guidesSection.style.marginTop = '40px'
        guidesSection.innerHTML = '<h2>👨‍🦯 Candidatures Guides (à valider)</h2>'
        container.appendChild(guidesSection)
    }
    
    // Supprimer l'ancienne liste
    const oldList = document.getElementById('guidesListContainer')
    if (oldList) oldList.remove()
    
    const listContainer = document.createElement('div')
    listContainer.id = 'guidesListContainer'
    
    if (guides.length === 0) {
        listContainer.innerHTML = '<p>Aucune candidature en attente.</p>'
    } else {
        listContainer.innerHTML = guides.map(guide => `
            <div class="guide-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 10px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <h3>${escapeHtml(guide.prenom)} ${escapeHtml(guide.nom)}</h3>
                        <p>📧 ${escapeHtml(guide.email)} | 📞 ${escapeHtml(guide.phone)}</p>
                        <p>📍 ${escapeHtml(guide.ville)} |  ${escapeHtml(guide.specialite)}</p>
                        <p> Expérience: ${guide.experience} ans |  Langues: ${guide.langue?.join(', ')}</p>
                        <p> Motivation: ${escapeHtml(guide.motivation?.substring(0, 100))}...</p>
                        ${guide.abonnement_duree ? `<p> Abonnement: ${guide.abonnement_duree} mois (${guide.abonnement_prix} DT)</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn-approve-guide" data-id="${guide.id}" style="background: #47eb8e; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Approuver</button>
                        <button class="btn-reject-guide" data-id="${guide.id}" style="background: #981000; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;"> Refuser</button>
                    </div>
                </div>
            </div>
        `).join('')
    }
    
    guidesSection.appendChild(listContainer)
    
    // Ajouter les événements
    document.querySelectorAll('.btn-approve-guide').forEach(btn => {
        btn.addEventListener('click', () => approveGuide(btn.dataset.id))
    })
    document.querySelectorAll('.btn-reject-guide').forEach(btn => {
        btn.addEventListener('click', () => rejectGuide(btn.dataset.id))
    })
}

// Fonction utilitaire pour éviter les injections XSS
function escapeHtml(str) {
    if (!str) return ''
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// ============================================
// 9. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return
    
    initFilters()
    await renderCommerces()
    await renderGuidesEnAttente()
})