// Fichier: /projet-gestion-sportive/version.js

/**
 * Système de versioning pour éviter les problèmes de cache
 * À modifier à chaque mise à jour du code
 */

// Version principale de l'application
window.APP_VERSION = '1.0.0';

// Version détaillée avec timestamp pour développement
window.APP_BUILD = '2024.09.07.001';

// Configuration du cache busting
window.CACHE_CONFIG = {
    // Forcer le rechargement des fichiers critiques
    forceReload: false,
    
    // Types de fichiers à versionner
    versionedFiles: [
        'css',
        'js',
        'json',
        'html'
    ],
    
    // Durée de cache en minutes (0 = pas de cache)
    cacheTimeout: 0
};

/**
 * Fonction utilitaire pour générer des URLs avec version
 * @param {string} url - URL du fichier à charger
 * @param {boolean} forceVersion - Forcer l'ajout de version même si désactivé
 * @returns {string} URL avec paramètre de version
 */
window.getVersionedUrl = function(url, forceVersion = false) {
    const config = window.CACHE_CONFIG;
    const version = window.APP_BUILD;
    
    // Vérifier si le fichier doit être versionné
    const extension = url.split('.').pop().toLowerCase();
    const shouldVersion = config.versionedFiles.includes(extension) || forceVersion;
    
    if (shouldVersion) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${version}`;
    }
    
    return url;
};

/**
 * Fonction pour charger un fichier avec gestion de version
 * @param {string} url - URL du fichier
 * @param {string} type - Type de fichier ('json', 'text', 'html')
 * @returns {Promise} Promise avec le contenu du fichier
 */
window.loadVersionedFile = async function(url, type = 'text') {
    const versionedUrl = window.getVersionedUrl(url, true);
    
    try {
        const response = await fetch(versionedUrl);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        switch (type.toLowerCase()) {
            case 'json':
                return await response.json();
            case 'text':
            case 'html':
                return await response.text();
            default:
                return response;
        }
    } catch (error) {
        console.error(`Erreur lors du chargement de ${url}:`, error);
        throw error;
    }
};

/**
 * Fonction pour charger dynamiquement un script avec version
 * @param {string} url - URL du script
 * @returns {Promise} Promise résolue quand le script est chargé
 */
window.loadVersionedScript = function(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const versionedUrl = window.getVersionedUrl(url, true);
        
        script.src = versionedUrl;
        script.onload = resolve;
        script.onerror = reject;
        
        document.head.appendChild(script);
    });
};

/**
 * Fonction pour charger dynamiquement un CSS avec version
 * @param {string} url - URL du fichier CSS
 * @returns {Promise} Promise résolue quand le CSS est chargé
 */
window.loadVersionedCSS = function(url) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        const versionedUrl = window.getVersionedUrl(url, true);
        
        link.rel = 'stylesheet';
        link.href = versionedUrl;
        link.onload = resolve;
        link.onerror = reject;
        
        document.head.appendChild(link);
    });
};

// Logging pour debug (à désactiver en production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`🚀 Application chargée - Version: ${window.APP_VERSION} (Build: ${window.APP_BUILD})`);
    console.log('📦 Configuration cache:', window.CACHE_CONFIG);
}

// Export pour les modules ES6 si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_VERSION: window.APP_VERSION,
        APP_BUILD: window.APP_BUILD,
        getVersionedUrl: window.getVersionedUrl,
        loadVersionedFile: window.loadVersionedFile,
        loadVersionedScript: window.loadVersionedScript,
        loadVersionedCSS: window.loadVersionedCSS
    };
}