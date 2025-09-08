// Fichier: /projet-gestion-sportive/js/app.js

/**
 * Classe principale de l'application
 * Gère l'initialisation, la navigation et les modules
 */
class App {
    constructor() {
        this.version = window.APP_VERSION || '1.0.0';
        this.build = window.APP_BUILD || Date.now();
        this.currentModule = null;
        this.menuConfig = null;
        this.loadedModules = new Map(); // Cache des modules chargés
        this.router = null;
        
        // Éléments DOM
        this.elements = {
            menuList: null,
            mainContent: null,
            loadingOverlay: null,
            welcomeScreen: null
        };
        
        console.log(`🚀 Application initialisée - Version: ${this.version}`);
    }

    /**
     * Initialisation de l'application
     */
    async init() {
        try {
            // Récupérer les éléments DOM
            this.initDOMElements();
            
            // Charger la configuration des menus
            await this.loadMenuConfiguration();
            
            // Générer le menu de navigation
            this.generateNavigation();
            
            // Initialiser le routeur
            this.initRouter();
            
            // Charger le module par défaut
            await this.loadDefaultModule();
            
            // Écouter les événements
            this.bindEvents();
            
            console.log('✅ Application initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement de l\'application');
        }
    }

    /**
     * Récupération des éléments DOM
     */
    initDOMElements() {
        this.elements = {
            menuList: document.getElementById('menu-list'),
            mainContent: document.getElementById('main-content'),
            loadingOverlay: document.getElementById('loading-overlay'),
            welcomeScreen: document.getElementById('welcome-screen')
        };

        // Vérifier que tous les éléments sont présents
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`Élément DOM manquant: ${key}`);
            }
        });
    }

    /**
     * Chargement de la configuration des menus
     */
    async loadMenuConfiguration() {
        try {
            this.showLoading(true);
            this.menuConfig = await window.loadVersionedFile('data/menu-config.json', 'json');
            
            // Trier les éléments par ordre
            this.menuConfig.menuItems.sort((a, b) => a.order - b.order);
            
            console.log('📋 Configuration des menus chargée:', this.menuConfig.menuItems.length, 'éléments');
            
        } catch (error) {
            throw new Error(`Impossible de charger la configuration des menus: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Génération de la navigation
     */
    generateNavigation() {
        if (!this.menuConfig || !this.menuConfig.menuItems) {
            throw new Error('Configuration des menus non disponible');
        }

        // Vider le menu existant
        this.elements.menuList.innerHTML = '';

        // Générer chaque élément de menu
        this.menuConfig.menuItems.forEach(item => {
            if (item.active) {
                const menuItem = this.createMenuElement(item);
                this.elements.menuList.appendChild(menuItem);
            }
        });

        console.log('🧭 Navigation générée avec', this.elements.menuList.children.length, 'éléments');
    }

    /**
     * Création d'un élément de menu
     */
    createMenuElement(item) {
        const li = document.createElement('li');
        li.className = 'menu-item';

        const a = document.createElement('a');
        a.href = item.url;
        a.className = 'menu-link';
        a.dataset.module = item.module;
        a.title = item.description || item.label;

        // Icône
        const icon = document.createElement('i');
        icon.className = item.icon;
        a.appendChild(icon);

        // Texte
        const span = document.createElement('span');
        span.textContent = item.label;
        a.appendChild(span);

        li.appendChild(a);

        // Événement de clic
        a.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToModule(item.module);
        });

        return li;
    }

    /**
     * Initialisation du routeur
     */
    initRouter() {
        this.router = new Router(this);
        
        // Écouter les changements d'URL
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.module) {
                this.navigateToModule(e.state.module, false);
            }
        });
    }

    /**
     * Navigation vers un module
     */
    async navigateToModule(moduleId, updateHistory = true) {
        try {
            console.log(`🧭 Navigation vers: ${moduleId}`);
            
            // Vérifier si le module existe
            const moduleConfig = this.menuConfig.menuItems.find(item => item.module === moduleId);
            if (!moduleConfig) {
                throw new Error(`Module introuvable: ${moduleId}`);
            }

            // Afficher le loading
            this.showLoading(true);

            // Désactiver le menu actuel
            this.setActiveMenu(null);

            // Masquer l'écran d'accueil si visible
            if (this.elements.welcomeScreen) {
                this.elements.welcomeScreen.style.display = 'none';
            }

            // Charger le module
            await this.loadModule(moduleId);

            // Activer le nouveau menu
            this.setActiveMenu(moduleId);

            // Mettre à jour l'historique
            if (updateHistory) {
                const url = moduleConfig.url || `#${moduleId}`;
                history.pushState(
                    { module: moduleId }, 
                    moduleConfig.label, 
                    url
                );
            }

            // Mettre à jour le titre de la page
            document.title = `${moduleConfig.label} - ${this.menuConfig.application.title}`;

            this.currentModule = moduleId;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la navigation vers ${moduleId}:`, error);
            this.showError(`Impossible de charger le module: ${moduleId}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Chargement d'un module
     */
    async loadModule(moduleId) {
        try {
            // Vérifier si le module est déjà en cache
            if (this.loadedModules.has(moduleId)) {
                const cachedModule = this.loadedModules.get(moduleId);
                this.renderModule(cachedModule.html, cachedModule.instance);
                return;
            }

            // Charger le template HTML
            const htmlPromise = window.loadVersionedFile(`templates/modules/${moduleId}.html`, 'html');
            
            // Charger le script JavaScript (optionnel)
            let moduleInstance = null;
            try {
                await window.loadVersionedScript(`js/modules/${moduleId}.js`);
                
                // Tenter d'instancier le module s'il existe
                const ModuleClass = window[this.getModuleClassName(moduleId)];
                if (ModuleClass) {
                    moduleInstance = new ModuleClass();
                }
            } catch (jsError) {
                console.warn(`⚠️ Script du module ${moduleId} non trouvé ou erreur:`, jsError.message);
            }

            const html = await htmlPromise;

            // Mettre en cache
            this.loadedModules.set(moduleId, {
                html: html,
                instance: moduleInstance
            });

            // Rendre le module
            this.renderModule(html, moduleInstance);
            
        } catch (error) {
            throw new Error(`Erreur lors du chargement du module ${moduleId}: ${error.message}`);
        }
    }

    /**
     * Rendu d'un module dans le DOM
     */
    renderModule(html, moduleInstance) {
        // Injecter le HTML
        this.elements.mainContent.innerHTML = html;

        // Initialiser le module s'il a une méthode init
        if (moduleInstance && typeof moduleInstance.init === 'function') {
            try {
                moduleInstance.init();
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation du module:', error);
            }
        }
    }

    /**
     * Génération du nom de classe du module
     */
    getModuleClassName(moduleId) {
        return moduleId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Module';
    }

    /**
     * Gestion du menu actif
     */
    setActiveMenu(moduleId) {
        // Retirer la classe active de tous les menus
        this.elements.menuList.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
        });

        // Ajouter la classe active au menu courant
        if (moduleId) {
            const activeLink = this.elements.menuList.querySelector(`[data-module="${moduleId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    /**
     * Chargement du module par défaut
     */
    async loadDefaultModule() {
        const defaultModule = this.menuConfig.settings.defaultModule || 'accueil';
        
        // Vérifier l'URL pour un module spécifique
        const hash = window.location.hash.substring(1);
        const targetModule = hash || defaultModule;
        
        await this.navigateToModule(targetModule, false);
    }

    /**
     * Affichage/masquage du loading
     */
    showLoading(show) {
        if (this.elements.loadingOverlay) {
            if (show) {
                this.elements.loadingOverlay.classList.remove('hidden');
            } else {
                this.elements.loadingOverlay.classList.add('hidden');
            }
        }
    }

    /**
     * Affichage d'une erreur
     */
    showError(message) {
        this.elements.mainContent.innerHTML = `
            <div class="error-container">
                <div class="error-card">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h2>Erreur</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="fas fa-refresh"></i> Recharger la page
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Liaison des événements
     */
    bindEvents() {
        // Rafraîchissement forcé avec Ctrl+F5
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'F5') {
                localStorage.clear();
                sessionStorage.clear();
                location.reload(true);
            }
        });

        // Gestion de la fermeture de l'application
        window.addEventListener('beforeunload', () => {
            console.log('👋 Fermeture de l\'application');
        });
    }

    /**
     * Méthodes utilitaires publiques
     */
    getCurrentModule() {
        return this.currentModule;
    }

    getMenuConfig() {
        return this.menuConfig;
    }

    clearCache() {
        this.loadedModules.clear();
        console.log('🧹 Cache des modules nettoyé');
    }
}

// Rendre la classe App disponible globalement
window.App = App;