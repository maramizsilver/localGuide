// js/cache.js
// Système de cache pour LocalGuide

const CACHE_DURATION = 3600000 // 1 heure

// Sauvegarder en cache
export function setCache(key, data) {
    try {
        const item = {
            data: data,
            timestamp: Date.now(),
            duration: CACHE_DURATION
        }
        localStorage.setItem(`lg_cache_${key}`, JSON.stringify(item))
        console.log(` Cache sauvegardé: ${key}`)
    } catch (error) {
        console.error('Erreur cache:', error)
    }
}

// Récupérer du cache
export function getCache(key) {
    try {
        const item = localStorage.getItem(`lg_cache_${key}`)
        if (!item) return null
        
        const parsed = JSON.parse(item)
        const age = Date.now() - parsed.timestamp
        
        if (age > parsed.duration) {
            localStorage.removeItem(`lg_cache_${key}`)
            console.log(` Cache expiré: ${key}`)
            return null
        }
        
        console.log(` Cache valide: ${key}`)
        return parsed.data
    } catch (error) {
        console.error('Erreur lecture cache:', error)
        return null
    }
}

// Supprimer un cache spécifique
export function clearCache(key) {
    if (key) {
        localStorage.removeItem(`lg_cache_${key}`)
        console.log(` Cache supprimé: ${key}`)
    }
}

// Vider tout le cache
export function clearAllCache() {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lg_cache_')) {
            localStorage.removeItem(key)
        }
    })
    console.log(' Tous les caches supprimés')
}