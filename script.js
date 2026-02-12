// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
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
    console.log('🌳 Initialisation de l\'arbre généalogique (compatible polygamie)...');
    
    // Afficher la famille initiale
    await displayFamily('3');
    
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
        
        // Générer l'arbre avec 3 générations (compatible polygamie)
        generateTreeWith3Generations(family);
        
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

// Générer l'arbre avec 3 générations (COMPATIBLE POLYGAMIE)
function generateTreeWith3Generations(family) {
    console.log('🎨 Génération de l\'arbre 3 générations (polygamie supportée)...');
    
    // Analyser la structure familiale
    const fathers = family.parents.filter(p => p.role === 'pere');
    const mothers = family.parents.filter(p => p.role === 'mere');
    const isPolygamous = mothers.length > 1 || fathers.length > 1;
    
    console.log(`👨 Pères: ${fathers.length}, 👩 Mères: ${mothers.length}, Polygame: ${isPolygamous}`);
    
    let html = '';
    
    // GÉNÉRATION 1 : GRANDS-PARENTS (au niveau de la famille, pas doublons)
    if (family.grandparents && family.grandparents.length > 0) {
        html += `
            <div class="generation-label">
                <i class="fas fa-users"></i> Grands-parents
            </div>
            <div class="grandparents-row">
                ${family.grandparents.map(gp => `
                    <div class="grandparent-card ${gp.gender === 'female' ? 'grandmother-card' : 'grandfather-card'}">
                        <i class="fas fa-${gp.gender === 'female' ? 'female' : 'male'}"></i>
                        <div class="person-name">${gp.lastName} ${gp.firstName}</div>
                        <div class="person-birth">${formatDate(gp.birthDate)}</div>
                        <div class="person-role">${gp.role === 'mere' ? 'Grand-mère' : 'Grand-père'}</div>
                    </div>
                `).join('')}
            </div>
            <div class="generation-connector"></div>
        `;
    }
    
    // GÉNÉRATION 2 : PARENTS (COMPATIBLE POLYGAMIE)
    if (family.parents && family.parents.length > 0) {
        html += `
            <div class="generation-label">
                <i class="fas fa-user-friends"></i> Parents
                ${isPolygamous ? '<span class="polygamy-badge"><i class="fas fa-users"></i> Polygamie</span>' : ''}
            </div>
        `;
        
        if (isPolygamous) {
            // MODE POLYGAMIE : Affichage flexible
            html += `<div class="parents-row-polygamy">`;
            
            // Afficher les pères d'abord
            html += fathers.map(father => {
                const hasOtherFamily = father.hasOtherFamily && father.otherFamilyId;
                return `
                    <div class="parent-card father-card ${hasOtherFamily ? 'clickable has-family' : ''}"
                         ${hasOtherFamily ? `data-target-family="${father.otherFamilyId}"` : ''}>
                        <i class="fas fa-male"></i>
                        <div class="person-name">${father.lastName} ${father.firstName}</div>
                        <div class="person-birth">${formatDate(father.birthDate)}</div>
                        <div class="person-role">Père</div>
                        ${hasOtherFamily ? `
                            <div class="family-indicator">
                                <i class="fas fa-arrow-up"></i>
                                <span>Famille d'origine</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            // Afficher les mères
            html += mothers.map((mother, index) => {
                const hasOtherFamily = mother.hasOtherFamily && mother.otherFamilyId;
                return `
                    <div class="parent-card mother-card ${hasOtherFamily ? 'clickable has-family' : ''}"
                         ${hasOtherFamily ? `data-target-family="${mother.otherFamilyId}"` : ''}>
                        <i class="fas fa-female"></i>
                        <div class="person-name">${mother.lastName} ${mother.firstName}</div>
                        <div class="person-birth">${formatDate(mother.birthDate)}</div>
                        <div class="person-role">Mère ${mothers.length > 1 ? (index + 1) : ''}</div>
                        ${hasOtherFamily ? `
                            <div class="family-indicator">
                                <i class="fas fa-arrow-up"></i>
                                <span>Famille d'origine</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            html += `</div>`;
            
        } else {
            // MODE NORMAL : Affichage classique (2 parents)
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
    }
    
    // GÉNÉRATION 3 : ENFANTS
    if (family.children && family.children.length > 0) {
        console.log('👶 Enfants détectés:', family.children.length);
        
        html += `
            <div class="generation-label">
                <i class="fas fa-child"></i> Enfants
            </div>
            <div class="children-row">
                <div class="children-connector"></div>
                ${family.children.map(child => {
                    const hasOtherFamily = child.hasOtherFamily && child.otherFamilyId;
                    const hasGrandchildren = child.grandchildren && child.grandchildren.length > 0;
                    
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
                                ${hasGrandchildren ? `
                                    <div class="grandchildren-count">
                                        <i class="fas fa-baby"></i> ${child.grandchildren.length}
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${hasGrandchildren ? `
                                <div class="grandchildren-mini">
                                    ${child.grandchildren.map(gc => `
                                        <div class="grandchild-mini" title="${gc.lastName} ${gc.firstName}">
                                            <i class="fas fa-${gc.gender === 'female' ? 'female' : 'male'}"></i>
                                            <span>${gc.firstName}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
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
    
    console.log('✅ Arbre 3 générations généré (polygamie: ' + isPolygamous + ')');
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
