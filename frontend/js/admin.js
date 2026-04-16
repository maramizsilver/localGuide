// frontend/js/admin.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. VÉRIFICATION ADMIN
// ============================================
async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        window.location.href = 'login.html'
        return false
    }
    
    // ADMIN PAR EMAIL
    if (user.email === 'admin@localguide.com') {
        console.log(' Admin détecté par email')
        return true
    }
    
    // Vérifier dans la base
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (!profile || profile.role !== 'admin') {
        alert(' Accès interdit. Cette page est réservée aux administrateurs.')
        window.location.href = 'accueil.html'
        return false
    }
    
    return true
}

// ============================================
// 2. FONCTIONS UTILITAIRES
// ============================================
function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// ============================================
// 3. GESTION DES COMMERCES
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

async function approveCommerce(id) {
    if (!confirm(' Valider ce commerce ? Il sera visible sur le site.')) return
    
    const { error } = await supabase
        .from('commerces')
        .update({ statut: 'actif' })
        .eq('id', id)
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert(' Commerce approuvé !')
        await renderCommerces()
        await renderGuidesEnAttente()
    }
}

async function rejectCommerce(id) {
    const raison = prompt('Pourquoi refusez-vous ce commerce ? (Optionnel)')
    
    if (!confirm(' Refuser ce commerce ?')) return
    
    const { error } = await supabase
        .from('commerces')
        .update({ 
            statut: 'fermé',
            raison_refus: raison || null
        })
        .eq('id', id)
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert(' Commerce refusé.')
        await renderCommerces()
        await renderGuidesEnAttente()
    }
}

async function renderCommerces() {
    const commerces = await loadCommerces()
    
    // Calcul des stats
    const total = commerces.length
    const enAttente = commerces.filter(c => c.statut === 'suspendu').length
    const approuves = commerces.filter(c => c.statut === 'actif').length
    const refuses = commerces.filter(c => c.statut === 'fermé').length
    
    // Mettre à jour les boutons de filtre
    const filterBtns = document.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
        const filter = btn.dataset.filter
        if (filter === 'all') btn.textContent = `Tous (${total})`
        else if (filter === 'suspendu') btn.textContent = `En attente (${enAttente})`
        else if (filter === 'actif') btn.textContent = `Approuvés (${approuves})`
        else if (filter === 'fermé') btn.textContent = `Refusés (${refuses})`
    })
    
    // Mettre à jour les stats en haut
    const statsElement = document.querySelector('.stats span')
    if (statsElement) {
        statsElement.textContent = ` Total: ${total} |  En attente: ${enAttente} |  Approuvés: ${approuves} |  Refusés: ${refuses}`
    }
    
    // Récupérer le filtre actif
    let filterType = 'suspendu'
    const activeFilter = document.querySelector('.filter-btn.active')
    if (activeFilter) {
        filterType = activeFilter.dataset.filter || 'suspendu'
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
    
    // Afficher dans le container
    const container = document.getElementById('commercesList')
    if (!container) return
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; background: white; border-radius: 12px;">Aucun commerce dans cette catégorie</div>'
        return
    }
    
    container.innerHTML = filtered.map(commerce => {
        let statutBadge = ''
        let badgeColor = ''
        
        if (commerce.statut === 'actif') {
            statutBadge = ' Approuvé'
            badgeColor = '#d4edda'
        } else if (commerce.statut === 'suspendu') {
            statutBadge = ' En attente'
            badgeColor = '#fff3cd'
        } else if (commerce.statut === 'fermé') {
            statutBadge = ' Refusé'
            badgeColor = '#f8d7da'
        }
        
        return `
            <div class="commerce-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div class="commerce-info">
                    <h3 style="margin: 0 0 10px 0;">${escapeHtml(commerce.nom)}</h3>
                    <p style="margin: 5px 0;">📍 ${escapeHtml(commerce.adresse)}</p>
                    <div class="commerce-meta" style="display: flex; gap: 10px; margin-top: 10px;">
                        <span class="badge" style="background: #e9ecef; padding: 4px 12px; border-radius: 20px;">🏷️ ${escapeHtml(commerce.categorie)}</span>
                        <span class="badge" style="background: ${badgeColor}; padding: 4px 12px; border-radius: 20px;">${statutBadge}</span>
                    </div>
                    ${commerce.raison_refus ? `<p style="color: #dc3545; font-size: 12px; margin-top: 10px;">❌ Raison: ${escapeHtml(commerce.raison_refus)}</p>` : ''}
                </div>
                <div class="commerce-actions" style="display: flex; gap: 10px;">
                    ${commerce.statut === 'suspendu' ? `
                        <button class="btn btn-approve" data-id="${commerce.id}" style="background: #10b981; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">✅ Approuver</button>
                        <button class="btn btn-reject" data-id="${commerce.id}" style="background: #ef4444; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"> Refuser</button>
                    ` : ''}
                    ${commerce.statut === 'actif' ? `
                        <button class="btn btn-reject" data-id="${commerce.id}" style="background: #ef4444; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"> Désactiver</button>
                    ` : ''}
                    ${commerce.statut === 'fermé' ? `
                        <button class="btn btn-approve" data-id="${commerce.id}" style="background: #10b981; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"> Réactiver</button>
                    ` : ''}
                </div>
            </div>
        `
    }).join('')
    
    // Ajouter les événements
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.removeEventListener('click', () => approveCommerce(btn.dataset.id))
        btn.addEventListener('click', () => approveCommerce(btn.dataset.id))
    })
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.removeEventListener('click', () => rejectCommerce(btn.dataset.id))
        btn.addEventListener('click', () => rejectCommerce(btn.dataset.id))
    })
}

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
// 4. GESTION DES GUIDES EN ATTENTE
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
    if (!confirm(' Approuver ce guide ? Il sera visible sur la page des guides.')) return
    
    const { error } = await supabase
        .from('guides')
        .update({ 
            statut: 'disponible',
            updated_at: new Date()
        })
        .eq('id', id)
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert('Guide approuvé ! Il est maintenant visible sur le site.')
        await renderGuidesEnAttente()
    }
}

async function rejectGuide(id) {
    if (!confirm(' Refuser définitivement cette candidature ?')) return
    
    const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id)
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert(' Candidature refusée et supprimée.')
        await renderGuidesEnAttente()
    }
}

async function renderGuidesEnAttente() {
    const guides = await loadGuidesEnAttente()
    
    let guidesSection = document.getElementById('guidesEnAttenteSection')
    
    if (!guidesSection) {
        const container = document.querySelector('.admin-container') || document.querySelector('.container')
        if (!container) {
            console.error('Container non trouvé')
            return
        }
        
        guidesSection = document.createElement('div')
        guidesSection.id = 'guidesEnAttenteSection'
        guidesSection.style.marginTop = '40px'
        guidesSection.style.padding = '20px'
        guidesSection.style.background = '#f8f9fa'
        guidesSection.style.borderRadius = '12px'
        guidesSection.innerHTML = '<h2 style="margin-bottom: 20px;">👨‍🦯 Candidatures Guides (à valider)</h2>'
        container.appendChild(guidesSection)
    }
    
    const oldList = document.getElementById('guidesListContainer')
    if (oldList) oldList.remove()
    
    const listContainer = document.createElement('div')
    listContainer.id = 'guidesListContainer'
    
    if (guides.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px; text-align: center; background: white; border-radius: 8px;" Aucune candidature en attente.</p>'
    } else {
        listContainer.innerHTML = guides.map(guide => {
            let languesDisplay = ''
            if (Array.isArray(guide.langue) && guide.langue.length > 0) {
                languesDisplay = guide.langue.join(', ')
            } else if (typeof guide.langue === 'string' && guide.langue) {
                languesDisplay = guide.langue
            } else {
                languesDisplay = 'Non spécifié'
            }
            
            return `
            <div class="guide-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${escapeHtml(guide.prenom)} ${escapeHtml(guide.nom)}</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-top: 10px;">
                            <div>📧 <strong>Email:</strong> ${escapeHtml(guide.email)}</div>
                            <div>📞 <strong>Téléphone:</strong> ${escapeHtml(guide.telephone || guide.phone)}</div>
                            <div> <strong>Ville:</strong> ${escapeHtml(guide.ville)}</div>
                            <div> <strong>Spécialité:</strong> ${escapeHtml(guide.specialite)}</div>
                            <div> <strong>Expérience:</strong> ${guide.experience || 0} ans</div>
                            <div> <strong>Langues:</strong> ${escapeHtml(languesDisplay)}</div>
                        </div>
                        <div style="margin-top: 10px;">
                            <strong>💬 Motivation:</strong>
                            <p style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-top: 5px;">${escapeHtml(guide.motivation || 'Non renseignée')}</p>
                        </div>
                        ${guide.abonnement_duree ? `<div style="margin-top: 10px;"><strong>💰 Abonnement:</strong> ${guide.abonnement_duree} mois (${guide.abonnement_prix} DT)</div>` : ''}
                        ${guide.image_url ? `<div style="margin-top: 10px;"><strong>🖼️ Photo:</strong> <a href="${guide.image_url}" target="_blank" style="color: #4f46e5;">Voir la photo</a></div>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-approve-guide" data-id="${guide.id}" style="background: #286d56; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Approuver</button>
                        <button class="btn-reject-guide" data-id="${guide.id}" style="background: #812d2d; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Refuser</button>
                    </div>
                </div>
            </div>
        `}).join('')
    }
    
    guidesSection.appendChild(listContainer)
    
    // Ajouter les événements
    document.querySelectorAll('.btn-approve-guide').forEach(btn => {
        btn.removeEventListener('click', () => approveGuide(btn.dataset.id))
        btn.addEventListener('click', () => approveGuide(btn.dataset.id))
    })
    document.querySelectorAll('.btn-reject-guide').forEach(btn => {
        btn.removeEventListener('click', () => rejectGuide(btn.dataset.id))
        btn.addEventListener('click', () => rejectGuide(btn.dataset.id))
    })
}

// ============================================
// 5. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return
    
    initFilters()
    await renderCommerces()
    await renderGuidesEnAttente()
})