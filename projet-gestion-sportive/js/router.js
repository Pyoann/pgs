// Fichier: /projet-gestion-sportive/js/router.js

/**
 * Classe Router - Gestion de la navigation et des URLs
 * Responsable du routage côté client pour l'application SPA
 */
class Router {
    constructor(app) {
        this.app = app;
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.maxHistorySize = 50;
        
        // Configuration du routeur
        this.config = {
            hashMode: true,              // Utilise #hash ou HTML5 History API
            autoInit: true,              // Initialisation automatique
            scrollToTop: true,           // Scroll vers le haut lors des changements
            transitionDuration: 300      // Durée des transitions en ms
        };
        
        console.log('🧭 Router initialisé');
        
        if (this.config.autoInit) {
            this.init();
        }
    }

    /**
     * Initialisation du routeur
     */
    init() {
        // Enregistrer les routes depuis la configuration des menus
        this.registerRoutesFromConfig();
        
        // Écouter les événements de navigation
        this.bindEvents();
        
        // Gérer la route initiale
        this.handleInitialRoute();
        
        console.log(`📍 Router prêt avec ${this.routes.size} routes`);
    }

    /**
     * Enregistrement des routes depuis la configuration
     */
    registerRoutesFromConfig() {
        if (!this.app.menuConfig || !this.app.menuConfig.menuItems) {
            console.warn('⚠️ Configuration des menus non disponible pour le routage');
            return;
        }

        this.app.menuConfig.menuItems.forEach(item => {
            if (item.active) {
                this.registerRoute(item.module, {
                    path: item.url.replace('#', ''),
                    module: item.module,
                    title: item.label,
                    description: item.description,
                    icon: item.icon,
                    requiresAuth: item.requiresAuth || false
                });
            }
        });
    }

    /**
     * Enregistrement d'une route
     */
    registerRoute(routeId, routeConfig) {
        // Validation de la configuration de route
        if (!routeConfig.module) {
            throw new Error(`Configuration de route invalide pour: ${routeId}`);
        }

        // Normaliser le path
        let path = routeConfig.path || routeId;
        if (path.startsWith('#')) {
            path = path.substring(1);
        }

        const route = {
            id: routeId,
            path: path,
            module: routeConfig.module,
            title: routeConfig.title || routeId,
            description: routeConfig.description || '',
            icon: routeConfig.icon || 'fas fa-page',
            requiresAuth: routeConfig.requiresAuth || false,
            params: {},
            query: {}
        };

        this.routes.set(routeId, route);
        
        console.log(`📍 Route enregistrée: ${routeId} -> ${path}`);
    }

    /**
     * Navigation vers une route
     */
    async navigate(routeId, params = {}, query = {}) {
        try {
            console.log(`🧭 Navigation vers: ${routeId}`, { params, query });

            // Vérifier si la route existe
            if (!this.routes.has(routeId)) {
                throw new Error(`Route inexistante: ${routeId}`);
            }

            const route = this.routes.get(routeId);
            
            // Vérifier les autorisations
            if (route.requiresAuth && !this.checkAuthentication()) {
                console.warn('🔒 Accès refusé - Authentification requise');
                this.navigate('login');
                return false;
            }

            // Préparer la route avec les paramètres
            const preparedRoute = {
                ...route,
                params: { ...params },
                query: { ...query }
            };

            // Sauvegarder l'historique
            this.saveToHistory(this.currentRoute);

            // Exécuter les hooks avant navigation
            const canNavigate = await this.executeBeforeNavigationHooks(preparedRoute);
            if (!canNavigate) {
                console.log('🚫 Navigation annulée par les hooks');
                return false;
            }

            // Mettre à jour l'état actuel
            const previousRoute = this.currentRoute;
            this.currentRoute = preparedRoute;

            // Mettre à jour l'URL
            this.updateURL(preparedRoute);

            // Déclencher la navigation dans l'app
            await this.app.navigateToModule(route.module, false);

            // Exécuter les hooks après navigation
            await this.executeAfterNavigationHooks(preparedRoute, previousRoute);

            // Scroll vers le haut si configuré
            if (this.config.scrollToTop) {
                this.scrollToTop();
            }

            // Émettre un événement personnalisé
            this.emitNavigationEvent('navigate', preparedRoute, previousRoute);

            return true;

        } catch (error) {
            console.error('❌ Erreur lors de la navigation:', error);
            this.handleNavigationError(error, routeId);
            return false;
        }
    }

    /**
     * Navigation vers l'arrière dans l'historique
     */
    goBack() {
        if (this.history.length > 0) {
            const previousRoute = this.history.pop();
            if (previousRoute) {
                console.log('⬅️ Navigation arrière vers:', previousRoute.id);
                this.navigate(previousRoute.id, previousRoute.params, previousRoute.query);
                return true;
            }
        }
        
        // Fallback vers la route par défaut
        const defaultRoute = this.app.menuConfig?.settings?.defaultModule || 'accueil';
        this.navigate(defaultRoute);
        return false;
    }

    /**
     * Obtenir la route courante
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Obtenir toutes les routes
     */
    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    /**
     * Vérifier si une route existe
     */
    hasRoute(routeId) {
        return this.routes.has(routeId);
    }

    /**
     * Obtenir les informations d'une route
     */
    getRoute(routeId) {
        return this.routes.get(routeId);
    }

    /**
     * Parsing de l'URL courante
     */
    parseCurrentURL() {
        let path, query = {};

        if (this.config.hashMode) {
            // Mode hash (#/route)
            const hash = window.location.hash.substring(1);
            const [hashPath, queryString] = hash.split('?');
            path = hashPath || '';
            
            if (queryString) {
                query = this.parseQueryString(queryString);
            }
        } else {
            // Mode History API
            path = window.location.pathname.substring(1);
            query = this.parseQueryString(window.location.search.substring(1));
        }

        return { path, query };
    }

    /**
     * Parsing d'une query string
     */
    parseQueryString(queryString) {
        const params = {};
        if (!queryString) return params;

        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : true;
            }
        });

        return params;
    }

    /**
     * Construction d'une query string
     */
    buildQueryString(params) {
        const queryParts = [];
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                const encodedKey = encodeURIComponent(key);
                const encodedValue = value === true ? '' : `=${encodeURIComponent(value)}`;
                queryParts.push(encodedKey + encodedValue);
            }
        });

        return queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    }

    /**
     * Mise à jour de l'URL
     */
    updateURL(route) {
        const queryString = this.buildQueryString(route.query);
        
        if (this.config.hashMode) {
            const newHash = `#${route.path}${queryString}`;
            if (window.location.hash !== newHash) {
                window.location.hash = newHash;
            }
        } else {
            const newURL = `/${route.path}${queryString}`;
            if (window.location.pathname + window.location.search !== newURL) {
                history.pushState({ routeId: route.id }, route.title, newURL);
            }
        }

        // Mettre à jour le titre de la page
        document.title = `${route.title} - ${this.app.menuConfig?.application?.title || 'Application'}`;
    }

    /**
     * Gestion de la route initiale
     */
    handleInitialRoute() {
        const { path, query } = this.parseCurrentURL();
        
        // Trouver la route correspondante
        let targetRoute = null;
        
        for (const [routeId, route] of this.routes) {
            if (route.path === path) {
                targetRoute = routeId;
                break;
            }
        }

        // Si aucune route trouvée, utiliser la route par défaut
        if (!targetRoute) {
            targetRoute = this.app.menuConfig?.settings?.defaultModule || 'accueil';
        }

        // Naviguer vers la route initiale
        this.navigate(targetRoute, {}, query);
    }

    /**
     * Liaison des événements
     */
    bindEvents() {
        // Événement popstate pour le bouton retour du navigateur
        window.addEventListener('popstate', (event) => {
            console.log('🔙 Événement popstate détecté');
            
            if (event.state && event.state.routeId) {
                const routeId = event.state.routeId;
                if (this.routes.has(routeId)) {
                    this.navigate(routeId);
                }
            } else {
                // Parsing de l'URL courante
                this.handleInitialRoute();
            }
        });

        // Événement hashchange pour le mode hash
        if (this.config.hashMode) {
            window.addEventListener('hashchange', (event) => {
                console.log('🔗 Hash changé:', window.location.hash);
                this.handleInitialRoute();
            });
        }
    }

    /**
     * Sauvegarde dans l'historique
     */
    saveToHistory(route) {
        if (route && route.id !== this.currentRoute?.id) {
            this.history.push({
                id: route.id,
                params: { ...route.params },
                query: { ...route.query },
                timestamp: Date.now()
            });

            // Limiter la taille de l'historique
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            }
        }
    }

    /**
     * Hooks avant navigation
     */
    async executeBeforeNavigationHooks(route) {
        // À implémenter selon les besoins
        // Par exemple: vérification des permissions, sauvegarde de données
        return true;
    }

    /**
     * Hooks après navigation
     */
    async executeAfterNavigationHooks(newRoute, previousRoute) {
        // À implémenter selon les besoins
        // Par exemple: analytics, nettoyage de ressources
        console.log(`📊 Navigation: ${previousRoute?.id || 'none'} -> ${newRoute.id}`);
    }

    /**
     * Vérification d'authentification
     */
    checkAuthentication() {
        // À implémenter selon votre système d'auth
        // Pour le moment, retourner toujours true
        return true;
    }

    /**
     * Gestion des erreurs de navigation
     */
    handleNavigationError(error, routeId) {
        console.error(`❌ Erreur de navigation vers ${routeId}:`, error);
        
        // Tentative de navigation vers la route d'erreur ou par défaut
        const fallbackRoute = this.app.menuConfig?.settings?.defaultModule || 'accueil';
        if (routeId !== fallbackRoute) {
            this.navigate(fallbackRoute);
        }
    }

    /**
     * Scroll vers le haut
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Émission d'événements personnalisés
     */
    emitNavigationEvent(eventName, currentRoute, previousRoute = null) {
        const event = new CustomEvent(`router:${eventName}`, {
            detail: {
                currentRoute,
                previousRoute,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Nettoyage et destruction du routeur
     */
    destroy() {
        // Nettoyer les événements
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('hashchange', this.handleHashChange);
        
        // Vider les routes et l'historique
        this.routes.clear();
        this.history = [];
        this.currentRoute = null;
        
        console.log('🧹 Router détruit');
    }
}

// Rendre la classe Router disponible globalement
window.Router = Router;