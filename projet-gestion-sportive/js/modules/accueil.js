// Fichier: /projet-gestion-sportive/js/modules/accueil.js

/**
 * Module Accueil - Page d'accueil du système
 * Affiche les statistiques, accès rapides et activités récentes
 */
class AccueilModule {
    constructor() {
        this.stats = {};
        this.activities = [];
        this.refreshInterval = null;
        this.elements = {};
        
        console.log('🏠 Module Accueil initialisé');
    }

    /**
     * Initialisation du module
     */
    async init() {
        try {
            console.log('🏠 Initialisation du module Accueil');
            
            // Récupérer les éléments DOM
            this.initDOMElements();
            
            // Charger les données
            await this.loadDashboardData();
            
            // Rendre les statistiques
            this.renderStats();
            
            // Rendre les activités récentes
            this.renderRecentActivities();
            
            // Lier les événements
            this.bindEvents();
            
            // Démarrer le rafraîchissement automatique
            this.startAutoRefresh();
            
            console.log('✅ Module Accueil initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du module Accueil:', error);
            this.showError('Erreur lors du chargement du tableau de bord');
        }
    }

    /**
     * Récupération des éléments DOM
     */
    initDOMElements() {
        this.elements = {
            statsGrid: document.getElementById('stats-grid'),
            activityList: document.getElementById('activity-list'),
            refreshBtn: document.getElementById('refresh-stats'),
            quickCards: document.querySelectorAll('.quick-card')
        };

        // Vérifier que les éléments existent
        if (!this.elements.statsGrid || !this.elements.activityList) {
            throw new Error('Éléments DOM du module Accueil manquants');
        }
    }

    /**
     * Chargement des données du tableau de bord
     */
    async loadDashboardData() {
        try {
            // Simuler le chargement de données (à remplacer par vos vraies données)
            await this.delay(500); // Simule une requête réseau
            
            // Données simulées - remplacez par vos vraies données
            this.stats = {
                tournois: {
                    total: 12,
                    actifs: 3,
                    termines: 9,
                    icon: 'fas fa-trophy',
                    color: '#f39c12',
                    trend: '+2'
                },
                equipes: {
                    total: 48,
                    actives: 42,
                    inactives: 6,
                    icon: 'fas fa-users',
                    color: '#3498db',
                    trend: '+5'
                },
                joueurs: {
                    total: 284,
                    actifs: 267,
                    inactifs: 17,
                    icon: 'fas fa-user-friends',
                    color: '#2ecc71',
                    trend: '+12'
                },
                ecoles: {
                    total: 15,
                    actives: 14,
                    inactives: 1,
                    icon: 'fas fa-school',
                    color: '#9b59b6',
                    trend: '0'
                },
                gymnases: {
                    total: 8,
                    disponibles: 6,
                    occupes: 2,
                    icon: 'fas fa-dumbbell',
                    color: '#e74c3c',
                    trend: '+1'
                },
                terrains: {
                    total: 22,
                    disponibles: 18,
                    occupes: 4,
                    icon: 'fas fa-map-marked-alt',
                    color: '#1abc9c',
                    trend: '+3'
                }
            };

            // Activités récentes simulées
            this.activities = [
                {
                    id: 1,
                    type: 'tournoi',
                    action: 'Nouveau tournoi créé',
                    description: 'Championnat interscolaire 2024',
                    icon: 'fas fa-trophy',
                    time: '2 minutes',
                    color: '#f39c12'
                },
                {
                    id: 2,
                    type: 'equipe',
                    action: 'Équipe inscrite',
                    description: 'Les Aigles - École Saint-Joseph',
                    icon: 'fas fa-users',
                    time: '15 minutes',
                    color: '#3498db'
                },
                {
                    id: 3,
                    type: 'joueur',
                    action: 'Nouveau joueur',
                    description: 'Marie Tremblay inscrite',
                    icon: 'fas fa-user-plus',
                    time: '1 heure',
                    color: '#2ecc71'
                },
                {
                    id: 4,
                    type: 'gymnase',
                    action: 'Réservation gymnase',
                    description: 'Gymnase Principal - École Polyvalente',
                    icon: 'fas fa-calendar-check',
                    time: '2 heures',
                    color: '#e74c3c'
                }
            ];

        } catch (error) {
            throw new Error(`Erreur lors du chargement des données: ${error.message}`);
        }
    }

    /**
     * Rendu des statistiques
     */
    renderStats() {
        if (!this.elements.statsGrid) return;

        const statsHTML = Object.entries(this.stats).map(([key, stat]) => `
            <div class="stat-card" data-type="${key}">
                <div class="stat-icon" style="color: ${stat.color}">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">${stat.total}</div>
                    <div class="stat-label">${this.getStatLabel(key)}</div>
                    <div class="stat-details">
                        ${this.getStatDetails(key, stat)}
                    </div>
                </div>
                <div class="stat-trend ${this.getTrendClass(stat.trend)}">
                    <i class="fas ${this.getTrendIcon(stat.trend)}"></i>
                    ${stat.trend}
                </div>
            </div>
        `).join('');

        this.elements.statsGrid.innerHTML = statsHTML;

        // Ajouter les événements de clic sur les cartes statistiques
        this.elements.statsGrid.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.navigateToModule(type);
            });
        });
    }

    /**
     * Rendu des activités récentes
     */
    renderRecentActivities() {
        if (!this.elements.activityList) return;

        const activitiesHTML = this.activities.map(activity => `
            <div class="activity-item" data-activity-id="${activity.id}">
                <div class="activity-icon" style="color: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.action}</strong></p>
                    <small>${activity.description}</small>
                    <span class="activity-time">Il y a ${activity.time}</span>
                </div>
            </div>
        `).join('');

        this.elements.activityList.innerHTML = activitiesHTML;
    }

    /**
     * Liaison des événements
     */
    bindEvents() {
        // Bouton de rafraîchissement
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Cartes d'accès rapide
        this.elements.quickCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const module = e.currentTarget.dataset.module;
                if (module) {
                    this.navigateToModule(module);
                }
            });

            // Effet hover
            card.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
            });

            card.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * Démarrage du rafraîchissement automatique
     */
    startAutoRefresh() {
        // Rafraîchir toutes les 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard(false); // Sans animation
        }, 5 * 60 * 1000);
    }

    /**
     * Rafraîchissement du tableau de bord
     */
    async refreshDashboard(showLoading = true) {
        try {
            if (showLoading && this.elements.refreshBtn) {
                this.elements.refreshBtn.disabled = true;
                this.elements.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualisation...';
            }

            // Recharger les données
            await this.loadDashboardData();
            
            // Re-rendre les composants
            this.renderStats();
            this.renderRecentActivities();

            console.log('🔄 Tableau de bord actualisé');

        } catch (error) {
            console.error('❌ Erreur lors de l\'actualisation:', error);
            this.showError('Erreur lors de l\'actualisation');
        } finally {
            if (showLoading && this.elements.refreshBtn) {
                this.elements.refreshBtn.disabled = false;
                this.elements.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualiser';
            }
        }
    }

    /**
     * Navigation vers un module
     */
    navigateToModule(moduleId) {
        if (window.app && typeof window.app.navigateToModule === 'function') {
            window.app.navigateToModule(moduleId);
        } else {
            console.warn('⚠️ Application principale non disponible pour la navigation');
        }
    }

    /**
     * Affichage d'une erreur
     */
    showError(message) {
        const errorHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="this.parentElement.remove()" class="btn-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Ajouter l'erreur au début du conteneur
        const container = document.querySelector('.accueil-container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', errorHTML);
        }
    }

    /**
     * Utilitaires pour les statistiques
     */
    getStatLabel(key) {
        const labels = {
            tournois: 'Tournois',
            equipes: 'Équipes', 
            joueurs: 'Joueurs',
            ecoles: 'Écoles',
            gymnases: 'Gymnases',
            terrains: 'Terrains'
        };
        return labels[key] || key;
    }

    getStatDetails(key, stat) {
        switch (key) {
            case 'tournois':
                return `${stat.actifs} actifs • ${stat.termines} terminés`;
            case 'equipes':
                return `${stat.actives} actives • ${stat.inactives} inactives`;
            case 'joueurs':
                return `${stat.actifs} actifs • ${stat.inactifs} inactifs`;
            case 'ecoles':
                return `${stat.actives} actives • ${stat.inactives} inactives`;
            case 'gymnases':
                return `${stat.disponibles} disponibles • ${stat.occupes} occupés`;
            case 'terrains':
                return `${stat.disponibles} disponibles • ${stat.occupes} occupés`;
            default:
                return '';
        }
    }

    getTrendClass(trend) {
        const num = parseInt(trend);
        if (num > 0) return 'positive';
        if (num < 0) return 'negative';
        return 'neutral';
    }

    getTrendIcon(trend) {
        const num = parseInt(trend);
        if (num > 0) return 'fa-arrow-up';
        if (num < 0) return 'fa-arrow-down';
        return 'fa-minus';
    }

    /**
     * Utilitaire pour simuler un délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Nettoyage du module
     */
    destroy() {
        // Arrêter le rafraîchissement automatique
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Nettoyer les événements
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                element.removeEventListener('click', null);
            }
        });

        console.log('🧹 Module Accueil nettoyé');
    }
}