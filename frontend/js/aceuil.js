// ============================================
// HERO BACKGROUND (Slideshow)
// ============================================
(function () {
    const bgElements = document.querySelectorAll(".hero-bg");
    if (bgElements.length > 0) {
        let current = 0;
        bgElements[current].classList.add("active");
        setInterval(() => {
            bgElements[current].classList.remove("active");
            current = (current + 1) % bgElements.length;
            bgElements[current].classList.add("active");
        }, 4000);
    }
})();

// ============================================
// TICKER DYNAMIQUE (T4-6)
// ============================================

import { supabase } from './supabaseClient.js'

async function loadTickerNews() {
    // Chercher le ticker-track (sans l'ID, on le trouve par classe)
    const tickerTrack = document.querySelector('.ticker-track')
    if (!tickerTrack) {
        console.log('Ticker non trouvé')
        return
    }
    
    try {
        // Charger les actualités récentes
        const { data, error } = await supabase
            .from('actualites')
            .select('titre, type')
            .eq('statut', 'publié')
            .order('created_at', { ascending: false })
            .limit(6)
        
        if (error) {
            console.error('Erreur chargement ticker:', error)
            return
        }
        
        if (!data || data.length === 0) {
            console.log('Aucune actualité, ticker statique conservé')
            return
        }
        
        // Construire le ticker avec les vraies actualités
        const items = data.map(item => {
            let icon = '⭐'
            if (item.type === 'evenement') icon = '✨'
            else if (item.type === 'promotion') icon = '✨'
            else if (item.type === 'ouverture') icon = '✨'
            
            return `<span class="ti">${icon} ${escapeHtml(item.titre)} <span class="ti-dot">◆</span></span>`
        }).join('')
        
        // Mettre à jour le ticker (conserver l'animation)
        tickerTrack.innerHTML = items + items
        
        console.log(' Ticker mis à jour avec', data.length, 'actualités')
        
    } catch (err) {
        console.error('Erreur ticker:', err)
    }
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// Lancer le ticker au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTickerNews)
} else {
    loadTickerNews()
}

// Rafraîchir toutes les 5 minutes
setInterval(loadTickerNews, 300000)

// REDIRECTION VERS PAGE COMMERCES


function initTopCommerceCards() {
    // Sélectionner toutes les cartes commerces dans la section Top Commerces
    const topCommerceCards = document.querySelectorAll('.grid3 .card');
    
    console.log(` Initialisation des ${topCommerceCards.length} cartes Top commerces`);
    
    topCommerceCards.forEach((card) => {
        const commerceId = card.getAttribute('data-commerce-id');
        
        if (commerceId) {
            // Ajouter un style pour indiquer que c'est cliquable
            card.style.cursor = 'pointer';
            
            // Ajouter l'événement de clic
            card.addEventListener('click', (e) => {
                // Si on clique sur le bouton ♡ (favoris), ne pas rediriger
                if (e.target.closest('.card-save')) {
                    e.stopPropagation();
                    console.log(' Clic sur favoris, redirection annulée');
                    return;
                }
                
                console.log(`🔄Redirection vers: ${card.querySelector('.card-name')?.innerText} (ID: ${commerceId})`);
                // Rediriger vers fichecomm.html avec l'ID du commerce
                window.location.href = `fichecomm.html?id=${commerceId}`;
            });
            
            // Optionnel: Ajouter un effet au survol
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        }
    });
    
    console.log('✅ Cartes Top commerces initialisées avec succès');
}

// Exécuter après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopCommerceCards);
} else {
    initTopCommerceCards();
}