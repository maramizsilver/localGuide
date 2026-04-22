// frontend/js/guide.js
import { supabase } from './supabaseClient.js'
let allGuides = []
let activeFilter = "Tous"
let currentSort = "rating"
let currentUser = null

// IMAGES DE COUVERTURE PAR DÉFAUT (locales)
const DEFAULT_IMAGES = {
    'Gastronomie': '../images/gastronomie.jpg',
    'Nocturne': '../images/nocturne.jpg',
    'Pêche': '../images/peche.jpg',
    'Artisanat': '../images/artisanat.jpg',
    'Histoire': '../images/histoire.jpg',
    'Art': '../images/art.jpg',
    'Mer & Port': '../images/peche.jpg',
    'default': '../images/default.jpg'
}

//  AVATARS PAR DÉFAUT
const DEFAULT_AVATARS = {
    'Gastronomie': 'https://randomuser.me/api/portraits/men/32.jpg',
    'Nocturne': 'https://randomuser.me/api/portraits/men/91.jpg',
    'Mer & Port': 'https://randomuser.me/api/portraits/men/52.jpg',
    'Artisanat': 'https://randomuser.me/api/portraits/men/68.jpg',
    'Histoire': 'https://randomuser.me/api/portraits/men/45.jpg',
    'Art': 'https://randomuser.me/api/portraits/men/33.jpg',
    'default': 'https://randomuser.me/api/portraits/lego/1.jpg'
}

//  PRIX PAR CATÉGORIE
const CATEGORY_PRICES = {
    'Gastronomie': 60,
    'Histoire': 50,
    'Mer & Port': 70,
    'Artisanat': 45,
    'Nocturne': 65,
    'Art': 55,
    'default': 55
}
//  GUIDES PAR DÉFAUT
const DEFAULT_GUIDES = [
    {
        id: 'default-gastronomie',
        name: 'Jean Dupont',
        specialty: 'Cuisine traditionnelle',
        category: 'Gastronomie',
        description: 'Découvrez les meilleurs restaurants et spécialités culinaires de Monastir.',
        tags: ['Français', 'Anglais'],
        rating: 4.8,
        reviews: 127,
        price: 60,
        available: 'available',
        cover: DEFAULT_IMAGES['Gastronomie'],
        avatar: DEFAULT_AVATARS['Gastronomie'],
        featured: true,
        isDefault: true
    },
    {
        id: 'default-mer-port',
        name: 'Ahmed Khemiri',
        specialty: 'Pêche et navigation',
        category: 'Mer & Port',
        description: 'Passionné de la mer, je vous fais découvrir les plus beaux spots de pêche.',
        tags: ['Français', 'Arabe'],
        rating: 4.9,
        reviews: 98,
        price: 70,
        available: 'available',
        cover: DEFAULT_IMAGES['Mer & Port'],
        avatar: DEFAULT_AVATARS['Mer & Port'],
        featured: true,
        isDefault: true
    },

    {
        id: 'default-histoire',
        name: 'Mohamed Ali',
        specialty: 'Patrimoine historique',
        category: 'Histoire',
        description: 'Explorez avec moi les trésors cachés et les monuments historiques.',
        tags: ['Français', 'Arabe', 'Anglais'],
        rating: 4.9,
        reviews: 203,
        price: 50,
        available: 'available',
        cover: DEFAULT_IMAGES['Histoire'],
        avatar: DEFAULT_AVATARS['Histoire'],
        featured: true,
        isDefault: true
    },
    {
        id: 'default-artisanat',
        name: 'Fatima Ben Salah',
        specialty: 'Artisanat traditionnel',
        category: 'Artisanat',
        description: 'Découverte des métiers d\'art et produits locaux authentiques.',
        tags: ['Français', 'Arabe'],
        rating: 4.7,
        reviews: 156,
        price: 45,
        available: 'available',
        cover: DEFAULT_IMAGES['Artisanat'],
        avatar: DEFAULT_AVATARS['Artisanat'],
        featured: false,
        isDefault: true
    },
    {
        id: 'default-nocturne',
        name: 'Karim Bouazizi',
        specialty: 'Vie nocturne',
        category: 'Nocturne',
        description: 'Guide des meilleurs bars, clubs et soirées à Monastir.',
        tags: ['Français', 'Anglais'],
        rating: 4.6,
        reviews: 112,
        price: 65,
        available: 'available',
        cover: DEFAULT_IMAGES['Nocturne'],
        avatar: DEFAULT_AVATARS['Nocturne'],
        featured: false,
        isDefault: true
    },
    {
        id: 'default-art',
        name: 'Sophie Martin',
        specialty: 'Art et Culture',
        category: 'Art',
        description: 'Visite des galeries d\'art et découverte de la scène culturelle.',
        tags: ['Français', 'Italien'],
        rating: 4.8,
        reviews: 89,
        price: 55,
        available: 'available',
        cover: DEFAULT_IMAGES['Art'],
        avatar: DEFAULT_AVATARS['Art'],
        featured: false,
        isDefault: true
    }
]

// 1. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
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

// 2. MODIFIER UN GUIDE
async function modifierGuide(id) {
    const guide = allGuides.find(g => g.id === id)
    if (!guide) return
    
    // Vérifier les droits
    const canEdit = currentUser && (currentUser.isAdmin || (guide.user_id && currentUser.id === guide.user_id))
    
    if (!canEdit) {
        alert(' Vous n\'avez pas le droit de modifier ce guide')
        return
    }
    
    if (guide.isDefault) {
        alert(' Les guides par défaut ne peuvent pas être modifiés')
        return
    }
    
    const nouveauNom = prompt("Nouveau nom :", guide.name)
    if (nouveauNom && nouveauNom !== guide.name) {
        const { error } = await supabase
            .from('guides')
            .update({ nom: nouveauNom.split(' ')[1] || '', prenom: nouveauNom.split(' ')[0] || nouveauNom })
            .eq('id', id)
        
        if (error) {
            alert(' Erreur: ' + error.message)
        } else {
            guide.name = nouveauNom
            alert(' Guide modifié avec succès !')
            await renderGrid()
        }
    }
    
    const nouvelleSpecialite = prompt("Nouvelle spécialité :", guide.specialty)
    if (nouvelleSpecialite && nouvelleSpecialite !== guide.specialty) {
        const { error } = await supabase
            .from('guides')
            .update({ specialite: nouvelleSpecialite })
            .eq('id', id)
        
        if (error) {
            alert('Erreur: ' + error.message)
        } else {
            guide.specialty = nouvelleSpecialite
            alert(' Spécialité modifiée !')
            await renderGrid()
        }
    }
    
    const nouveauPrix = prompt("Nouveau prix (TND) :", guide.price)
    if (nouveauPrix && parseInt(nouveauPrix) !== guide.price) {
        const { error } = await supabase
            .from('guides')
            .update({ prix_guide: parseInt(nouveauPrix) })
            .eq('id', id)
        if (error) {
        
            alert(' Erreur: ' + error.message)
        } else {
            guide.price = parseInt(nouveauPrix)
            alert(' Prix modifié !')
            await renderGrid()
        }
    }
}


// 3. SUPPRIMER UN GUIDE

async function supprimerGuide(id) {
    const guide = allGuides.find(g => g.id === id)
    if (!guide) return
    
    // Vérifier les droits
    const canDelete = currentUser && (currentUser.isAdmin || (guide.user_id && currentUser.id === guide.user_id))
    
    if (!canDelete) {
        alert(' Vous n\'avez pas le droit de supprimer ce guide')
        return
    }
    
    if (guide.isDefault) {
        alert('Les guides par défaut ne peuvent pas être supprimés')
        return
    }
    
    if (!confirm(` Supprimer définitivement le guide "${guide.name}" ?`)) return
    
    const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id)
    
    if (error) {
        alert('Erreur: ' + error.message)
    } else {
        alert(' Guide supprimé avec succès !')
        await renderGrid()
    }
}
// 4. CHARGER LES GUIDES

async function loadGuidesFromSupabase() {
    console.log('Chargement des guides depuis Supabase...')
    
    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('statut', 'disponible')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Erreur Supabase:', error)
        return []
    }
    
    console.log('Guides disponibles chargés:', data.length)
    return data
}

function getCategory(specialite) {
    const categoryMap = {
        'gastronomie': 'Gastronomie',
        'restaurant': 'Gastronomie',
        'cuisine': 'Gastronomie',
        'art': 'Art',
        'peinture': 'Art',
        'culture': 'Art',
        'nightlife': 'Nocturne',
        'soiree': 'Nocturne',
        'bar': 'Nocturne',
        'peche': 'Mer & Port',
        'mer': 'Mer & Port',
        'port': 'Mer & Port',
        'artisanat': 'Artisanat',
        'shopping': 'Artisanat',
        'boutique': 'Artisanat',
        'histoire': 'Histoire',
        'patrimoine': 'Histoire'
    }
    const key = (specialite || '').toLowerCase()
    return categoryMap[key] || 'default'
}

function getDefaultImage(category) {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES['default']
}

function getDefaultAvatar(category) {
    return DEFAULT_AVATARS[category] || DEFAULT_AVATARS['default']
}

function adaptGuideData(supabaseGuide) {
    const category = getCategory(supabaseGuide.specialite)
    
    let coverImage = supabaseGuide.image_url && supabaseGuide.image_url.trim() !== '' 
        ? supabaseGuide.image_url 
        : getDefaultImage(category)
    
    let avatarImage = supabaseGuide.image_url && supabaseGuide.image_url.trim() !== ''
        ? supabaseGuide.image_url
        : getDefaultAvatar(category)
    
    let tags = supabaseGuide.langue || []
    if (typeof tags === 'string') {
        tags = tags.split(',').map(t => t.trim())
    }
    if (!tags.length) tags = ['Français']
    
    return {
        id: supabaseGuide.id,
        name: `${supabaseGuide.prenom || ''} ${supabaseGuide.nom || ''}`.trim() || 'Guide Local',
        specialty: supabaseGuide.specialite || 'Guide local',
        category: category,
        description: supabaseGuide.motivation || 'Passionné par Monastir',
        tags: tags,
        rating: supabaseGuide.note_moyenne || (4.0 + Math.random() * 0.9),
        reviews: supabaseGuide.nb_avis || Math.floor(Math.random() * 50) + 5,
        price: supabaseGuide.prix_guide || CATEGORY_PRICES[category] || 55,
        available: 'available',
        cover: coverImage,
        avatar: avatarImage,
        featured: supabaseGuide.mise_en_avant || false,
        phone: supabaseGuide.phone,
        email: supabaseGuide.email,
        user_id: supabaseGuide.user_id,
        created_at: supabaseGuide.created_at,
        isDefault: false
    }
}

function renderStars(r) {
    const f = Math.floor(r)
    return "★".repeat(f) + "☆".repeat(5 - f)
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

// ============================================
// 5. RÉSERVATION
// ============================================
async function bookGuide(id) {
    const guide = allGuides.find((x) => String(x.id) === String(id))
    
    if (!guide) {
        alert('Guide non trouvé')
        return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        const confirmLogin = confirm(' Vous devez être connecté pour réserver.\nVoulez-vous vous connecter ?')
        if (confirmLogin) {
            window.location.href = 'login.html'
        }
        return
    }
    
    const clientName = prompt('Votre nom complet :', '')
    if (!clientName) return
    
    const clientPhone = prompt('Votre numéro de téléphone :', '')
    if (!clientPhone) return
    
    const dateReservation = prompt('Date souhaitée (JJ/MM/AAAA) :', new Date().toLocaleDateString('fr-FR'))
    if (!dateReservation) return
    
    const dateParts = dateReservation.split('/')
    if (dateParts.length !== 3) {
        alert('Format de date invalide. Utilisez JJ/MM/AAAA')
        return
    }
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    
    const finalConfirm = confirm(` Confirmation de réservation :\n\n` +
        `Guide: ${guide.name}\n` +
        `Client: ${clientName}\n` +
        `Date: ${dateReservation}\n` +
        `Prix: ${guide.price} TND\n\n` +
        `Confirmer ?`)
    
    if (!finalConfirm) return
    
    const { error } = await supabase
        .from('reservations')
        .insert({
            guide_id: guide.isDefault ? null : guide.id,
            user_id: user.id,
            guide_nom: guide.name,
            guide_specialite: guide.specialty,
            client_nom: clientName,
            client_phone: clientPhone,
            date: formattedDate,
            prix_total: guide.price,
            statut: 'confirmee'
        })
    
    if (error) {
        alert(' Erreur: ' + error.message)
    } else {
        alert(` Réservation confirmée !\n\nGuide: ${guide.name}\nDate: ${dateReservation}\nTotal: ${guide.price} TND`)
    }
}

function viewProfile(id) {
    const g = allGuides.find((x) => String(x.id) === String(id))
    if (g) {
        alert(`FICHE GUIDE\n\n` +
            `Nom: ${g.name}\n` +
            ` Spécialité: ${g.specialty}\n` +
            ` Tarif: ${g.price} TND\n` +
            ` Note: ${g.rating.toFixed(1)} (${g.reviews} avis)\n` +
            `📞 Téléphone: ${g.phone || 'Non renseigné'}\n\n` +
            ` Description:\n${g.description}`)
    }
}

// ============================================
// 6. AFFICHAGE DES GUIDES
// ============================================
async function renderGrid() {
    const supabaseGuides = await loadGuidesFromSupabase()
    const adaptedGuides = supabaseGuides.map(adaptGuideData)
    
    if (adaptedGuides.length === 0) {
        allGuides = [...DEFAULT_GUIDES]
    } else if (adaptedGuides.length < 6) {
        allGuides = [...adaptedGuides, ...DEFAULT_GUIDES.slice(0, 6 - adaptedGuides.length)]
    } else {
        allGuides = adaptedGuides
    }
    
    let list = [...allGuides]
    
    if (activeFilter !== "Tous") {
        list = list.filter((g) => g.category === activeFilter)
    }
    
    const search = document.getElementById("searchInput")?.value.toLowerCase() || ""
    if (search) {
        list = list.filter(
            (g) =>
                g.name.toLowerCase().includes(search) ||
                g.specialty.toLowerCase().includes(search) ||
                g.description.toLowerCase().includes(search)
        )
    }
    
    if (currentSort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
    else if (currentSort === "price") list.sort((a, b) => a.price - b.price)
    else if (currentSort === "reviews") list.sort((a, b) => b.reviews - a.reviews)
    else list.sort((a, b) => b.rating - a.rating)
    
    const guideCount = document.getElementById("guideCount")
    if (guideCount) guideCount.textContent = list.length
    
    const grid = document.getElementById("guidesGrid")
    if (!grid) return
    
    if (!list.length) {
        grid.innerHTML = `<div style="text-align:center;padding:40px;">Aucun guide trouvé</div>`
        return
    }
    
    grid.innerHTML = list.map((g) => {
        const tags = (g.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")
        const fallbackImage = getDefaultImage(g.category)
        const fallbackAvatar = getDefaultAvatar(g.category)
        
        // Vérifier si l'utilisateur peut modifier/supprimer ce guide
        const canEdit = currentUser && (currentUser.isAdmin || (g.user_id && currentUser.id === g.user_id)) && !g.isDefault
        
        const adminButtons = canEdit ? `
            <div class="guide-actions">
                <button class="btn-edit-guide" onclick="modifierGuide('${g.id}')"> Modifier</button>
                <button class="btn-delete-guide" onclick="supprimerGuide('${g.id}')"> Supprimer</button>
            </div>
        ` : ''
        
        return `
            <article class="card ${g.featured ? "featured" : ""}" data-id="${g.id}" style="height: 100%; display: flex; flex-direction: column;">
                <div class="card-image" style="height: 200px; flex-shrink: 0;">
                    <img src="${g.cover}" alt="${escapeHtml(g.name)}" loading="lazy" onerror="this.src='${fallbackImage}'" style="width: 100%; height: 100%; object-fit: cover;">
                    <span class="card-badge">${escapeHtml(g.specialty)}</span>
                </div>
                <div class="card-body" style="flex: 1; display: flex; flex-direction: column;">
                    ${g.featured ? '<span class="featured-label">⭐ Guide en vedette</span>' : ''}
                    <div class="card-header">
                        <img src="${g.avatar}" alt="${escapeHtml(g.name)}" class="guide-avatar" onerror="this.src='${fallbackAvatar}'">
                        <div class="card-meta">
                            <div class="card-name">${escapeHtml(g.name)}</div>
                            <div class="card-specialty">${escapeHtml(g.category)}</div>
                        </div>
                    </div>
                    <p class="card-desc" style="flex: 1;">${escapeHtml(g.description.substring(0, 100))}...</p>
                    <div class="card-tags">${tags}</div>
                    <div class="card-footer">
                        <div class="card-rating">
                            <span class="stars">${renderStars(g.rating)}</span>
                            <span class="rating-num">${g.rating.toFixed(1)}</span>
                            <span class="review-count">(${g.reviews} avis)</span>
                        </div>
                        <div class="card-price" style="font-size: 1.1rem; font-weight: bold; color: #d42b2b;">
                            ${g.price} TND <span style="font-size: 0.75rem;">/ pers.</span>
                        </div>
                    </div>
                    <div class="card-cta" style="margin-top: 16px; display: flex; gap: 10px;">
                        <button class="btn-book" onclick="bookGuide('${g.id}')" style="flex: 2;">📅 Réserver</button>
                        <button class="btn-profile" onclick="viewProfile('${g.id}')" style="width: 40px;">👤</button>
                    </div>
                    ${adminButtons}
                </div>
            </article>`
    }).join("")
}

function setFilter(cat, el) {
    activeFilter = cat
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"))
    el.classList.add("active")
    renderGrid()
}

// Exposer globalement
window.bookGuide = bookGuide
window.viewProfile = viewProfile
window.setFilter = setFilter
window.renderGrid = renderGrid
window.modifierGuide = modifierGuide
window.supprimerGuide = supprimerGuide

// INITIALISATION
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await getCurrentUser()
    console.log('👤 Utilisateur:', currentUser?.email || 'Non connecté')
    await renderGrid()
    
    supabase
        .channel('guides_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guides' }, () => {
            console.log('Changement détecté, rechargement...')
            renderGrid()
        })
        .subscribe()
})