// Configuration
const API_BASE_URL = '/api';
let currentFamilyId = '1';
let familyHistory = ['1'];

// Éléments DOM
const elements = {
    currentFamily: document.getElementById('currentFamily'),
    treeContainer: document.getElementById('tree-container'),
    backButton: document.getElementById('backButton')
};

// Initialisation
async function init() {
    console.log('🌳 Initialisation de l\'arbre généalogique...');
    
    // Afficher la famille initiale
    await displayFamily('1');
    
    // Écouteurs d'événements
    elements.backButton.addEventListener('click', goBack);
    
    // Bouton refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('🔄 Actualisation...');
            displayFamily(currentFamilyId);
        });
    }
}

// Afficher une famille
async function displayFamily(familyId) {
    console.log(`🔍 Chargement de la famille ${familyId}...`);
    
    // Afficher chargement
    elements.treeContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Chargement de l'arbre...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/families/${familyId}`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const family = await response.json();
        
        if (!family.success) {
            throw new Error(family.error || 'Erreur lors du chargement de la famille');
        }
        
        console.log('✅ Données reçues:', family);
        
        // Mettre à jour l'historique
        updateHistory(familyId);
        
        // Mettre à jour l'affichage
        updateFamilyDisplay(family);
        
        // Générer l'arbre
        generateTree(family);
        
        console.log(`✅ Famille "${family.name}" chargée avec succès`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        elements.treeContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de connexion</h3>
                <p>${error.message}</p>
                <p style="font-size: 0.9em; margin-top: 10px;">
                    Vérifiez que le serveur est démarré et que PostgreSQL est actif.
                </p>
                <button onclick="displayFamily('1')">Réessayer</button>
            </div>
        `;
    }
}

// Mettre à jour l'historique
function updateHistory(familyId) {
    if (!familyHistory.includes(familyId)) {
        familyHistory.push(familyId);
    }
    currentFamilyId = familyId;
    
    // Activer/désactiver bouton retour
    elements.backButton.disabled = familyHistory.length <= 1;
    
    console.log('📍 Historique:', familyHistory);
}

// Mettre à jour l'affichage
function updateFamilyDisplay(family) {
    elements.currentFamily.textContent = family.name;
}

// Générer l'arbre
function generateTree(family) {
    console.log('🎨 Génération de l\'arbre...');
    console.log('Parents:', family.parents);
    console.log('Enfants:', family.children);
    
    let html = '';
    
    // Parents
    if (family.parents && family.parents.length > 0) {
        html += `
            <div class="parents-row">
                ${family.parents.map((parent, index) => {
                    const hasOtherFamily = parent.hasOtherFamily && parent.otherFamilyId;
                    
                    return `
                        <div class="parent-card ${parent.gender === 'female' ? 'mother-card' : ''} 
                             ${hasOtherFamily ? 'clickable has-family' : ''}"
                             ${hasOtherFamily ? `data-target-family="${parent.otherFamilyId}"` : ''}>
                            <i class="fas fa-${parent.gender === 'female' ? 'female' : 'male'}"></i>
                            <div class="person-name">${parent.lastName} ${parent.firstName}</div>
                            <div class="person-birth">${formatDate(parent.birthDate)}</div>
                            <div class="person-role">${parent.role === 'mere' ? 'Mère' : 'Père'}</div>
                            ${hasOtherFamily ? `
                                <div class="family-indicator">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>Famille d'origine</span>
                                </div>
                            ` : ''}
                        </div>
                        ${index === 0 && family.parents.length > 1 ? '<div class="parents-connector"></div>' : ''}
                    `;
                }).join('')}
                ${family.parents.length > 0 ? '<div class="parents-vertical-line"></div>' : ''}
            </div>
        `;
    }
    
    // Enfants
    if (family.children && family.children.length > 0) {
        html += `
            <div class="children-row">
                <div class="children-connector"></div>
                ${family.children.map(child => {
                    const hasOtherFamily = child.hasOtherFamily && child.otherFamilyId;
                    
                    return `
                        <div class="enfant">
                            <div class="child-card ${hasOtherFamily ? 'clickable has-family' : ''}"
                                 ${hasOtherFamily ? `data-target-family="${child.otherFamilyId}"` : ''}>
                                <i class="fas fa-${child.gender === 'female' ? 'female' : 'male'}"></i>
                                <div class="person-name">${child.lastName} ${child.firstName}</div>
                                <div class="person-birth">${formatDate(child.birthDate)}</div>
                                ${hasOtherFamily ? `
                                    <div class="family-indicator">
                                        <i class="fas fa-arrow-down"></i>
                                        <span>A une famille</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    // Si pas de contenu
    if (!html) {
        html = `
            <div class="loading">
                <i class="fas fa-info-circle"></i>
                <p>Aucune donnée disponible pour cette famille</p>
            </div>
        `;
    }
    
    elements.treeContainer.innerHTML = html;
    
    // Ajouter les écouteurs d'événements
    addClickListeners();
    
    console.log('✅ Arbre généré');
}

// Ajouter les écouteurs d'événements pour les clics
function addClickListeners() {
    // Sélectionner toutes les cartes cliquables
    const clickableCards = document.querySelectorAll('.clickable');
    
    console.log(`🖱️ ${clickableCards.length} cartes cliquables détectées`);
    
    clickableCards.forEach(card => {
        card.addEventListener('click', function() {
            const targetFamilyId = this.getAttribute('data-target-family');
            if (targetFamilyId) {
                console.log(`🎯 Navigation vers famille ${targetFamilyId}`);
                displayFamily(targetFamilyId);
            }
        });
        
        // Ajouter le curseur pointer
        card.style.cursor = 'pointer';
        
        // Ajouter effet hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.03)';
            this.style.boxShadow = '0 15px 30px rgba(76, 175, 80, 0.4)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
        });
    });
}

// Formater une date
function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (e) {
        return dateString;
    }
}

// Revenir en arrière
function goBack() {
    if (familyHistory.length > 1) {
        familyHistory.pop();
        const previousFamilyId = familyHistory[familyHistory.length - 1];
        console.log(`⬅️ Retour à la famille ${previousFamilyId}`);
        displayFamily(previousFamilyId);
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, démarrage de l\'application...');
    init();
});

// Fonctions globales
window.displayFamily = displayFamily;
window.goBack = goBack;
