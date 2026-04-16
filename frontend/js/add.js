// frontend/js/add.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. VÉRIFICATION ADMIN OU COMMERÇANT
// ============================================
// frontend/js/add.js - Modifier la vérification
async function checkCommerceAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        alert('🔐 Veuillez vous connecter pour ajouter un commerce.')
        window.location.href = 'login.html'
        return false
    }
    
    console.log('👤 Utilisateur connecté:', user.email)
    
    // Vérifier si c'est l'admin (avec le bon email)
    if (user.email === 'admin@localguid.com') {  // ← Correction ici
        console.log('✅ Admin reconnu, accès autorisé')
        return true
    }
    
    // Pour les autres utilisateurs, vérifier dans la base
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (profileError) {
        console.error(' Erreur lecture profil:', profileError)
        alert('Erreur de vérification des droits')
        return false
    }
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'commerçant')) {
        alert(`⛔ Accès refusé. Rôle: "${profile?.role || 'non défini'}"\nSeuls les commerçants ou administrateurs peuvent ajouter un commerce.`)
        window.location.href = 'accueil.html'
        return false
    }
    
    return true
}

// ============================================
// 2. GESTION DES FRAIS PUBLICITAIRES
// ============================================
function initPublicite() {
    const cards = document.querySelectorAll('.publicite-card')
    const publicitePrixInput = document.getElementById('publicitePrix')
    const publiciteDureeInput = document.getElementById('publiciteDuree')
    const totalMontantSpan = document.getElementById('totalMontant')
    
    if (!cards.length) return
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'))
            card.classList.add('selected')
            
            const prix = parseInt(card.dataset.prix) || 0
            const duree = parseInt(card.dataset.duree) || 0
            
            if (publicitePrixInput) publicitePrixInput.value = prix
            if (publiciteDureeInput) publiciteDureeInput.value = duree
            
            if (totalMontantSpan) {
                totalMontantSpan.textContent = prix + ' DT'
            }
            
            console.log(`Forfait: ${prix} DT pour ${duree} jours`)
        })
    })
    
    // Sélectionner la carte Standard par défaut
    const defaultCard = document.querySelector('.publicite-card[data-prix="0"]')
    if (defaultCard) {
        defaultCard.click()
    }
}

// ============================================
// 3. GESTION DE L'UPLOAD PHOTO (CORRIGÉE)
// ============================================
function initUploadPhoto() {
    const pictureInput = document.getElementById('picture')
    const previewDiv = document.getElementById('uploadPreview')
    const previewImg = document.getElementById('previewImg')
    const uploadZone = document.getElementById('uploadZone')
    
    console.log('🔍 Upload elements:', { 
        picture: !!pictureInput, 
        preview: !!previewDiv, 
        previewImg: !!previewImg 
    })
    
    if (!pictureInput) {
        console.error('❌ Input picture non trouvé')
        return
    }
    
    // Fonction pour afficher l'aperçu
    function displayPreview(file) {
        if (!file) return false
        
        // Vérifier taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Fichier trop lourd (max 5 MB)')
            pictureInput.value = ''
            return false
        }
        
        // Vérifier type
        if (!file.type.match(/image\/(jpeg|png|webp)/)) {
            alert('❌ Format non supporté. Utilisez JPG, PNG ou WEBP')
            pictureInput.value = ''
            return false
        }
        
        const reader = new FileReader()
        reader.onload = function(e) {
            if (previewImg) {
                previewImg.src = e.target.result
                console.log('✅ Image chargée dans le preview')
            }
            if (previewDiv) {
                previewDiv.style.display = 'block'
                console.log('✅ Preview affiché')
            }
        }
        reader.onerror = function() {
            console.error(' Erreur lecture fichier')
            alert('Erreur lors de la lecture du fichier')
        }
        reader.readAsDataURL(file)
        return true
    }
    
    // Écouter le changement de fichier
    pictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0]
        console.log('📷 Fichier sélectionné:', file?.name)
        if (file) {
            displayPreview(file)
        }
    })
    
    // Drag & drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault()
            uploadZone.style.borderColor = '#d42b2b'
            uploadZone.style.background = 'rgba(212, 43, 43, 0.05)'
        })
        
        uploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault()
            uploadZone.style.borderColor = 'rgba(212, 43, 43, 0.25)'
            uploadZone.style.background = 'rgba(212, 43, 43, 0.02)'
        })
        
        uploadZone.addEventListener('drop', function(e) {
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
    console.log('add.js chargé et DOM prêt')
    
    // Vérifier accès
    const hasAccess = await checkCommerceAccess()
    if (!hasAccess) return
    
    // Initialiser les composants
    initPublicite()
    initUploadPhoto()  
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    console.log(' Utilisateur connecté:', user?.email)
    
    // ============================================
    // 5. COMPTEUR DE CARACTÈRES
    // ============================================
    const desc = document.getElementById('description')
    const count = document.getElementById('descCount')
    if (desc && count) {
        desc.addEventListener('input', () => count.textContent = desc.value.length)
    }
    
    // ============================================
    // 6. VALIDATION
    // ============================================
    function validate() {
        console.log('🔍 Validation en cours...')
        let valid = true
        const fields = [
            { id:'name',       err:'nameError',       check: v => v.length > 0 },
            { id:'categorie',  err:'categorieError',  check: v => v !== '' },
            { id:'adresse',    err:'adresseError',    check: v => v.length > 0 },
            { id:'ville',      err:'villeError',      check: v => v.length > 0 },
            { id:'codepostal', err:'codepostalError', check: v => /^\d{4}$/.test(v) },
            { id:'phone',      err:'phoneError',      check: v => v.length >= 8 },
            { id:'email',      err:'emailError',      check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
            { id:'hOpen',      err:'hOpenError',      check: v => v.length > 0 },
            { id:'hClose',     err:'hCloseError',     check: v => v.length > 0 },
        ]
        
        fields.forEach(({ id, err, check }) => {
            const el = document.getElementById(id)
            const errEl = document.getElementById(err)
            const value = el ? el.value.trim() : ''
            if (!check(value)) { 
                if (el) el.classList.add('invalid')
                if (errEl) errEl.classList.add('show')
                valid = false
            } else { 
                if (el) el.classList.remove('invalid')
                if (errEl) errEl.classList.remove('show')
            }
        })
        
        console.log(`🔍 Validation: ${valid ? ' OK' : ' ÉCHEC'}`)
        return valid
    }
    
    // ============================================
    // 7. SOUMISSION À SUPABASE
    // ============================================
    const form = document.getElementById('businessForm')
    const overlay = document.getElementById('overlay')
    const successBox = document.getElementById('successBox')
    const pictureInput = document.getElementById('picture')
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            console.log('Formulaire soumis')
            
            if (!validate()) {
                console.log('Validation échouée')
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
                fourchette = fourchette.trim()
                
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
                
                console.log(' Envoi:', { nom, categorie, ville, publicite_prix, statut: 'suspendu' })
                
                // Upload image
                let image_url = null
                if (pictureInput && pictureInput.files && pictureInput.files[0]) {
                    const file = pictureInput.files[0]
                    const fileName = `commerce-images/${Date.now()}_${file.name}`
                    
                    console.log(' Upload de l\'image...', fileName)
                    
                    const { error: uploadError } = await supabase.storage
                        .from('commerce-images')  
                        .upload(fileName, file)
                    
                    if (uploadError) {
                        console.error(' Upload erreur:', uploadError)
                        alert('Erreur upload image: ' + uploadError.message)
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('commerce-images')
                            .getPublicUrl(fileName)
                        image_url = publicUrl
                        console.log('image uploadée:', image_url)
                    }
                } else {
                    console.log(' Aucune image sélectionnée')
                }
                
                // Insérer dans Supabase avec statut 'suspendu'
                const { data, error } = await supabase
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
                        statut: 'suspendu'
                    })
                    .select()
                
                if (error) {
                    console.error(' Erreur Supabase:', error)
                    alert('Erreur: ' + error.message)
                } else {
                    console.log('Commerce ajouté avec succès!', data)
                    alert('✅ Commerce soumis avec succès ! En attente de validation par l\'administrateur.')
                    
                    // Afficher le succès
                    if (overlay) overlay.classList.add('show')
                    if (successBox) successBox.classList.add('show')
                }
            } catch (err) {
                console.error('Erreur inattendue:', err)
                alert('Une erreur est survenue: ' + err.message)
            } finally {
                btn.disabled = false
                if (txt) txt.textContent = 'Soumettre mon commerce'
                if (arr) arr.style.display = 'inline-block'
                if (spin) spin.style.display = 'none'
            }
        })
    } else {
        console.error(' Formulaire non trouvé !')
    }
    
    // ============================================
    // 8. FERMETURE SUCCÈS
    // ============================================
    window.closeSuccess = function() {
        const overlay = document.getElementById('overlay')
        const successBox = document.getElementById('successBox')
        if (overlay) overlay.classList.remove('show')
        if (successBox) successBox.classList.remove('show')
        window.location.href = 'accueil.html'
    }
    
    // Annuler
    const cancelBtn = document.getElementById('cancelBtn')
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Annuler la saisie ?')) window.location.href = 'accueil.html'
        })
    }
})