// frontend/js/add.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. VÉRIFICATION ACCÈS
// ============================================
async function checkCommerceAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        alert('🔐 Veuillez vous connecter pour ajouter un commerce.')
        window.location.href = 'login.html'
        return false
    }
    
    console.log('👤 Utilisateur connecté:', user.email)
    
    // Admin par email
    if (user.email === 'admin@localguide.com') {
        console.log('✅ Admin reconnu')
        return true
    }
    
    // Vérifier rôle dans la base
    const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    
    if (profileError) {
        console.error('❌ Erreur lecture profil:', profileError)
        alert('Erreur de vérification des droits')
        return false
    }
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'commerçant')) {
        alert(' Accès refusé. Seuls les commerçants ou administrateurs peuvent ajouter un commerce.')
        window.location.href = 'accueil.html'
        return false
    }
    
    return true
}

// ============================================
// 2. GESTION PUBLICITÉ
// ============================================
function initPublicite() {
    const cards = document.querySelectorAll('.publicite-card')
    const publicitePrixInput = document.getElementById('publicitePrix')
    const publiciteDureeInput = document.getElementById('publiciteDuree')
    const totalMontantSpan = document.getElementById('totalMontant')
    
    if (!cards.length) {
        console.log('Aucune carte publicité trouvée')
        return
    }
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'))
            card.classList.add('selected')
            
            const prix = parseInt(card.dataset.prix) || 0
            const duree = parseInt(card.dataset.duree) || 0
            
            if (publicitePrixInput) publicitePrixInput.value = prix
            if (publiciteDureeInput) publiciteDureeInput.value = duree
            if (totalMontantSpan) totalMontantSpan.textContent = prix + ' DT'
            
            console.log(`Forfait sélectionné: ${prix} DT pour ${duree} jours`)
        })
    })
    
    // Sélection par défaut
    const defaultCard = document.querySelector('.publicite-card[data-prix="0"]')
    if (defaultCard) defaultCard.click()
}

// ============================================
// 3. UPLOAD PHOTO AVEC APERÇU
// ============================================
function initUploadPhoto() {
    const pictureInput = document.getElementById('picture')
    const previewDiv = document.getElementById('uploadPreview')
    const previewImg = document.getElementById('previewImg')
    const uploadZone = document.getElementById('uploadZone')
    
    if (!pictureInput) {
        console.error('❌ Input picture non trouvé')
        return
    }
    
    // Rendre la zone cliquable
    if (uploadZone) {
        uploadZone.addEventListener('click', (e) => {
            if (e.target === uploadZone || 
                e.target.classList.contains('upload-icon') ||
                e.target.classList.contains('upload-label') || 
                e.target.classList.contains('upload-hint')) {
                pictureInput.click()
            }
        })
    }
    
    // Afficher l'aperçu
    function displayPreview(file) {
        if (!file) return false
        
        console.log('📷 Fichier:', file.name, 'Taille:', file.size)
        
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Fichier trop lourd (max 5 MB)')
            pictureInput.value = ''
            return false
        }
        
        if (!file.type.match(/image\/(jpeg|png|webp)/)) {
            alert('❌ Format non supporté. JPG, PNG ou WEBP uniquement')
            pictureInput.value = ''
            return false
        }
        
        const reader = new FileReader()
        reader.onload = function(e) {
            if (previewImg) {
                previewImg.src = e.target.result
                if (previewDiv) previewDiv.style.display = 'block'
                console.log('✅ Aperçu affiché')
            }
        }
        reader.onerror = function() {
            console.error('❌ Erreur lecture fichier')
            alert('Erreur lors de la lecture du fichier')
        }
        reader.readAsDataURL(file)
        return true
    }
    
    // Supprimer l'image (fonction globale)
    window.removeImage = function() {
        pictureInput.value = ''
        if (previewImg) previewImg.src = ''
        if (previewDiv) previewDiv.style.display = 'none'
        console.log('🗑️ Image supprimée')
    }
    
    // Changement de fichier
    pictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) displayPreview(file)
    })
    
    // Drag & drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault()
            uploadZone.style.borderColor = '#d42b2b'
            uploadZone.style.background = 'rgba(212, 43, 43, 0.05)'
        })
        
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault()
            uploadZone.style.borderColor = 'rgba(212, 43, 43, 0.25)'
            uploadZone.style.background = 'rgba(212, 43, 43, 0.02)'
        })
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault()
            uploadZone.style.borderColor = 'rgba(212, 43, 43, 0.25)'
            uploadZone.style.background = 'rgba(212, 43, 43, 0.02)'
            
            const file = e.dataTransfer.files[0]
            if (file && displayPreview(file)) {
                const dt = new DataTransfer()
                dt.items.add(file)
                pictureInput.files = dt.files
            }
        })
    }
}

// ============================================
// 4. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('add.js chargé')
    
    // Vérifier accès
    const hasAccess = await checkCommerceAccess()
    if (!hasAccess) return
    
    // Initialiser les composants
    initPublicite()
    initUploadPhoto()
    
    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Utilisateur:', user?.email)
    
    // Compteur caractères
    const desc = document.getElementById('description')
    const count = document.getElementById('descCount')
    if (desc && count) {
        desc.addEventListener('input', () => count.textContent = desc.value.length)
        count.textContent = desc.value.length
    }
    
    // ============================================
    // 5. VALIDATION
    // ============================================
    function validate() {
        let valid = true
        const fields = [
            { id: 'name', err: 'nameError', check: v => v.trim().length > 0 },
            { id: 'categorie', err: 'categorieError', check: v => v !== '' },
            { id: 'adresse', err: 'adresseError', check: v => v.trim().length > 0 },
            { id: 'ville', err: 'villeError', check: v => v.trim().length > 0 },
            { id: 'codepostal', err: 'codepostalError', check: v => /^\d{4}$/.test(v) },
            { id: 'phone', err: 'phoneError', check: v => v.trim().length >= 8 },
            { id: 'email', err: 'emailError', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
            { id: 'hOpen', err: 'hOpenError', check: v => v.trim().length > 0 },
            { id: 'hClose', err: 'hCloseError', check: v => v.trim().length > 0 }
        ]
        
        fields.forEach(({ id, err, check }) => {
            const el = document.getElementById(id)
            const errEl = document.getElementById(err)
            const value = el ? el.value : ''
            if (!check(value)) {
                if (el) el.classList.add('invalid')
                if (errEl) errEl.classList.add('show')
                valid = false
            } else {
                if (el) el.classList.remove('invalid')
                if (errEl) errEl.classList.remove('show')
            }
        })
        
        return valid
    }
    
    // ============================================
    // 6. SOUMISSION À SUPABASE
    // ============================================
    const form = document.getElementById('businessForm')
    const overlay = document.getElementById('overlay')
    const successBox = document.getElementById('successBox')
    const pictureInput = document.getElementById('picture')
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            if (!validate()) {
                alert('Veuillez remplir tous les champs obligatoires')
                return
            }
            
            const btn = document.getElementById('submitBtn')
            const txt = document.getElementById('submitText')
            const arr = document.getElementById('submitArrow')
            const spin = document.getElementById('submitSpinner')
            
            btn.disabled = true
            if (txt) txt.textContent = 'Envoi en cours…'
            if (arr) arr.style.display = 'none'
            if (spin) spin.style.display = 'inline-block'
            
            try {
                // Récupérer les valeurs
                const nom = document.getElementById('name').value
                const categorie = document.getElementById('categorie').value
                let fourchette = document.querySelector('input[name="fourchette"]:checked')?.value || '€€'
                const description = document.getElementById('description').value || null
                const adresse = document.getElementById('adresse').value
                const ville = document.getElementById('ville').value
                const code_postal = document.getElementById('codepostal').value
                const phone = document.getElementById('phone').value
                const email = document.getElementById('email').value
                const h_ouverture = document.getElementById('hOpen').value
                const h_fermeture = document.getElementById('hClose').value
                const publicite_prix = parseInt(document.getElementById('publicitePrix')?.value || '0')
                const publicite_duree = parseInt(document.getElementById('publiciteDuree')?.value || '0')
                
                // Upload image vers Supabase Storage
                let image_url = null
                if (pictureInput && pictureInput.files && pictureInput.files[0]) {
                    const file = pictureInput.files[0]
                    const ext = file.name.split('.').pop()
                    const fileName = `commerce-images/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
                    
                    console.log('📤 Upload image...', fileName)
                    
                    const { error: uploadError } = await supabase.storage
                        .from('commerce-images')
                        .upload(fileName, file)
                    
                    if (uploadError) {
                        console.error('❌ Upload erreur:', uploadError)
                        alert('Erreur upload image: ' + uploadError.message)
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('commerce-images')
                            .getPublicUrl(fileName)
                        image_url = publicUrl
                        console.log('✅ Image uploadée:', image_url)
                    }
                }
                
                // Insérer dans Supabase avec statut 'suspendu'
                const { error } = await supabase
                    .from('commerces')
                    .insert({
                        owner_id: user.id,
                        nom: nom,
                        categorie: categorie,
                        fourchette_prix: fourchette,
                        description: description,
                        adresse: adresse,
                        ville: ville,
                        code_postal: code_postal,
                        phone: phone,
                        email: email,
                        h_ouverture: h_ouverture,
                        h_fermeture: h_fermeture,
                        image_url: image_url,
                        publicite_prix: publicite_prix,
                        publicite_duree: publicite_duree,
                        statut: 'suspendu',
                        created_at: new Date().toISOString()
                    })
                
                if (error) {
                    console.error(' Erreur Supabase:', error)
                    alert('Erreur: ' + error.message)
                } else {
                    console.log('✅ Commerce ajouté avec succès!')
                    if (overlay) overlay.classList.add('show')
                    if (successBox) successBox.classList.add('show')
                }
            } catch (err) {
                console.error(' Erreur inattendue:', err)
                alert('Une erreur est survenue: ' + err.message)
            } finally {
                btn.disabled = false
                if (txt) txt.textContent = 'Soumettre mon commerce'
                if (arr) arr.style.display = 'inline-block'
                if (spin) spin.style.display = 'none'
            }
        })
    }
    
    // ============================================
    // 7. FERMETURE SUCCÈS
    // ============================================
    window.closeSuccess = function() {
        const overlay = document.getElementById('overlay')
        const successBox = document.getElementById('successBox')
        if (overlay) overlay.classList.remove('show')
        if (successBox) successBox.classList.remove('show')
        window.location.href = 'accueil.html'
    }
    
    // ============================================
    // 8. ANNULER
    // ============================================
    const cancelBtn = document.getElementById('cancelBtn')
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Annuler la saisie ?')) window.location.href = 'accueil.html'
        })
    }
})