// frontend/js/add.js
import { supabase } from './supabaseClient.js'

// ============================================
// 1. VÉRIFICATION ADMIN OU COMMERÇANT
// ============================================
async function checkCommerceAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        alert('🔐 Veuillez vous connecter pour ajouter un commerce.')
        window.location.href = 'login.html'
        return false
    }
    
    const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'commerçant')) {
        alert('⛔ Seuls les commerçants ou administrateurs peuvent ajouter un commerce.')
        window.location.href = 'aceuil.html'
        return false
    }
    
    return true
}

// ============================================
// 2. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🟢 add.js chargé et DOM prêt')
    
    // Vérifier accès
    const hasAccess = await checkCommerceAccess()
    if (!hasAccess) return
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    console.log('🟢 Utilisateur connecté:', user?.email)
    
    // ============================================
    // 3. COMPTEUR DE CARACTÈRES
    // ============================================
    const desc = document.getElementById('description')
    const count = document.getElementById('descCount')
    if (desc && count) {
        desc.addEventListener('input', () => count.textContent = desc.value.length)
    }
    
    // ============================================
    // 4. UPLOAD PHOTO
    // ============================================
    const picture = document.getElementById('picture')
    const preview = document.getElementById('uploadPreview')
    const previewImg = document.getElementById('previewImg')
    
    if (picture) {
        picture.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) { 
                alert('Fichier trop lourd (max 5 MB)')
                return 
            }
            const reader = new FileReader()
            reader.onload = (ev) => { 
                if (previewImg) previewImg.src = ev.target.result
                if (preview) preview.style.display = 'block'
            }
            reader.readAsDataURL(file)
        })
    }
    
    // Drag & drop
    const zone = document.getElementById('uploadZone')
    if (zone) {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over') })
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'))
        zone.addEventListener('drop', (e) => {
            e.preventDefault()
            zone.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) {
                const dt = new DataTransfer()
                dt.items.add(file)
                picture.files = dt.files
                picture.dispatchEvent(new Event('change'))
            }
        })
    }
    
    // ============================================
    // 5. VALIDATION
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
                console.log(`❌ Champ invalide: ${id}`)
                if (el) el.classList.add('invalid')
                if (errEl) errEl.classList.add('show')
                valid = false
            } else { 
                if (el) el.classList.remove('invalid')
                if (errEl) errEl.classList.remove('show')
            }
        })
        console.log(`🔍 Validation résultat: ${valid ? '✅ OK' : '❌ ÉCHEC'}`)
        return valid
    }
    
    // ============================================
    // 6. SOUMISSION À SUPABASE
    // ============================================
    const form = document.getElementById('businessForm')
    const overlay = document.getElementById('overlay')
    const successBox = document.getElementById('successBox')
    
    if (form) {
        console.log('✅ Formulaire trouvé, ajout de l\'écouteur')
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            console.log(' FORMULAIRE SOUMIS !')
            
            const isValid = validate()
            if (!isValid) {
                console.log('❌ Validation échouée, arrêt')
                retur
            }
            
            console.log('✅ Validation OK, envoi à Supabase...')
            
            const btn = document.getElementById('submitBtn')
            const txt = document.getElementById('submitText')
            const arr = document.getElementById('submitArrow')
            const spin = document.getElementById('submitSpinner')
            
            btn.disabled = true
            if (txt) txt.textContent = 'Envoi en cours…'
            if (arr) arr.style.display = 'none'
            if (spin) spin.style.display = 'block'
            
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
            
            console.log(' Données à envoyer:', { nom, categorie, fourchette, ville })
            
            // Upload image si présente
            let image_url = null
            if (picture && picture.files && picture.files[0]) {
                const file = picture.files[0]
                const fileName = `commerces/${Date.now()}_${file.name}`
                const { error: uploadError } = await supabase.storage
                    .from('commerces')
                    .upload(fileName, file)
                
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('commerces')
                        .getPublicUrl(fileName)
                    image_url = publicUrl
                }
            }
            
            // Insérer dans Supabase avec statut 'en_attente'
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
                    statut: 'suspendu'
                })
            
            btn.disabled = false
            if (txt) txt.textContent = 'Soumettre mon commerce'
            if (arr) arr.style.display = ''
            if (spin) spin.style.display = 'none'
            
            if (error) {
                console.error('❌ Erreur Supabase:', error)
                alert('❌ Erreur: ' + error.message)
            } else {
                console.log('✅ Commerce ajouté avec succès !')
                if (overlay) overlay.classList.add('show')
                if (successBox) successBox.classList.add('show')
            }
        })
    } else {
        console.error('❌ Formulaire non trouvé ! Vérifie id="businessForm"')
    }
    
    // ============================================
    // 7. FERMETURE SUCCÈS
    // ============================================
    window.closeSuccess = function() {
        if (overlay) overlay.classList.remove('show')
        if (successBox) successBox.classList.remove('show')
        window.location.href = 'aceuil.html'
    }
    
    // Annuler
    const cancelBtn = document.getElementById('cancelBtn')
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Annuler la saisie ?')) window.location.href = 'aceuil.html'
        })
    }
})