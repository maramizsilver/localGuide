// frontend/js/common.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. GESTION DE LA NAVBAR (AFFICHAGE DYNAMIQUE)
// ============================================
async function updateNavbar() {
    console.log('Mise à jour de la navbar...')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const adminLink = document.getElementById('adminNavLink')
    const authBtn = document.getElementById('authBtn')
    
    if (user) {
        console.log(' Connecté:', user.email)
        
        // Vérifier si admin
        let isAdmin = false
        
        if (user.email === 'admin@localguide.com') {
            isAdmin = true
        } else {
            const { data: profile } = await supabase
                .from('users_profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            
            if (profile?.role === 'admin') isAdmin = true
        }
        
        // Afficher/masquer lien Admin
        if (adminLink) {
            adminLink.style.display = isAdmin ? 'block' : 'none'
        }
        
        // Changer bouton Connexion → Déconnexion
        if (authBtn) {
            authBtn.textContent = ' Déconnexion'
            authBtn.href = '#'
            authBtn.onclick = async (e) => {
                e.preventDefault()
                await supabase.auth.signOut()
                window.location.href = 'aceuil.html'
            }
        }
    } else {
        console.log(' Non connecté')
        
        if (adminLink) adminLink.style.display = 'none'
        
        if (authBtn) {
            authBtn.textContent = ' Connexion'
            authBtn.href = 'login.html'
            authBtn.onclick = null
        }
    }
}

// ============================================
// 2. GESTION DES BOUTONS DE LA PAGE ACCUEIL
// ============================================
async function updateHomeButtons() {
    const { data: { user } } = await supabase.auth.getUser()
    
    const loginBtn = document.getElementById('homeLoginBtn')
    const registerBtn = document.getElementById('homeRegisterBtn')
    const userInfo = document.getElementById('userInfo')
    const userNameSpan = document.getElementById('userName')
    const logoutHomeBtn = document.getElementById('logoutHomeBtn')
    
    if (user) {
        // Cacher les boutons connexion/inscription
        if (loginBtn) loginBtn.style.display = 'none'
        if (registerBtn) registerBtn.style.display = 'none'
        
        // Afficher les infos utilisateur
        if (userInfo) userInfo.style.display = 'block'
        if (userNameSpan) {
            userNameSpan.textContent = user.email?.split('@')[0] || 'Utilisateur'
        }
        
        // Gestion du bouton déconnexion
        if (logoutHomeBtn) {
            logoutHomeBtn.onclick = async (e) => {
                e.preventDefault()
                await supabase.auth.signOut()
                window.location.href = 'aceuil.html'
            }
        }
    } else {
        // Afficher les boutons connexion/inscription
        if (loginBtn) loginBtn.style.display = 'block'
        if (registerBtn) registerBtn.style.display = 'block'
        
        // Cacher les infos utilisateur
        if (userInfo) userInfo.style.display = 'none'
    }
}

// ============================================
// 3. GESTION DU SCROLL DE LA NAVBAR
// ============================================
function initNavbarScroll() {
    const nav = document.querySelector('.nav')
    if (!nav) return
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled')
        } else {
            nav.classList.remove('scrolled')
        }
    })
}

// ============================================
// 4. VÉRIFICATION ADMIN (pour page admin.html)
// ============================================
async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        window.location.href = 'login.html'
        return false
    }
    
    if (user.email === 'admin@localguide.com') {
        return true
    }
    
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (!profile || profile.role !== 'admin') {
        alert(' Accès interdit. Page réservée aux administrateurs.')
        window.location.href = 'aceuil.html'
        return false
    }
    
    return true
}

// ============================================
// 5. VÉRIFICATION CONNEXION (pour pages protégées)
// ============================================
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        alert(' Veuillez vous connecter.')
        window.location.href = 'login.html'
        return false
    }
    return true
}

// ============================================
// 6. EXPORT (AJOUT DE updateHomeButtons)
// ============================================
export { updateNavbar, updateHomeButtons, initNavbarScroll, checkAdminAccess, checkAuth }

// ============================================
// 7. INITIALISATION AUTO (AJOUT DE updateHomeButtons)
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await updateNavbar()
    await updateHomeButtons()  // ← AJOUTÉ
    initNavbarScroll()
    
    // Écouter les changements d'auth
    supabase.auth.onAuthStateChange(() => {
        updateNavbar()
        updateHomeButtons()  // ← AJOUTÉ
    })
})