const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configuration BD
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arbre',
    password: process.env.DB_PASSWORD || 'joram18',
    port: process.env.DB_PORT || 5432
});

// Test BD avec retry pour attendre que PostgreSQL soit prêt
async function connectWithRetry() {
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await pool.connect();
            console.log('✅ PostgreSQL connecté');
            return;
        } catch (err) {
            retries++;
            console.log(`⏳ Tentative de connexion ${retries}/${maxRetries}...`);
            if (retries === maxRetries) {
                console.error('❌ Erreur DB:', err.message);
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

// ========== ROUTES API ==========

// 1. Test API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Arbre Généalogique' 
    });
});

// 2. Toutes les familles
app.get('/api/families', async (req, res) => {
    try {
        const result = await pool.query('SELECT pk_famille as id, nom_famille as name FROM famille ORDER BY nom_famille');
        res.json({ 
            success: true, 
            count: result.rows.length,
            families: result.rows 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Une famille avec 3 générations (grands-parents paternels uniquement)
app.get('/api/families/:id', async (req, res) => {
    try {
        const familyId = req.params.id;
        
        // 1. Récupérer la famille
        const family = await pool.query(
            'SELECT pk_famille as id, nom_famille as name FROM famille WHERE pk_famille = $1', 
            [familyId]
        );
        
        if (family.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Famille non trouvée' });
        }
        
        // 2. Récupérer les parents de cette famille (génération actuelle)
        const parents = await pool.query(`
            SELECT 
                p.pk_personne as id,
                p.nom as "lastName",
                p.prenom as "firstName", 
                p.sexe as gender, 
                p.date_naissance as "birthDate", 
                pf.role
            FROM personne p
            JOIN personne_famille pf ON p.pk_personne = pf.fk_personne
            WHERE pf.fk_famille = $1 AND pf.role IN ('pere', 'mere')
            ORDER BY pf.role DESC  -- 'pere' avant 'mere'
        `, [familyId]);
        
        // 3. Identifier le père de cette famille
        const father = parents.rows.find(p => p.role === 'pere');
        
        let grandparents = [];
        
        // 4. Si un père existe, récupérer ses parents (grands-parents paternels)
        if (father) {
            const grandparentsResult = await pool.query(`
                SELECT 
                    p.pk_personne as id,
                    p.nom as "lastName",
                    p.prenom as "firstName",
                    p.sexe as gender,
                    p.date_naissance as "birthDate",
                    pe.type_parent as role
                FROM parent_enfant pe
                JOIN personne p ON pe.fk_parent = p.pk_personne
                WHERE pe.fk_enfant = $1
                ORDER BY pe.type_parent
            `, [father.id]);
            
            grandparents = grandparentsResult.rows;
        }
        
        // 5. Récupérer les enfants
        const children = await pool.query(`
            SELECT 
                p.pk_personne as id,
                p.nom as "lastName", 
                p.prenom as "firstName",
                p.sexe as gender, 
                p.date_naissance as "birthDate"
            FROM personne p
            JOIN personne_famille pf ON p.pk_personne = pf.fk_personne
            WHERE pf.fk_famille = $1 AND pf.role = 'enfant'
            ORDER BY p.date_naissance
        `, [familyId]);
        
        // 6. Pour chaque enfant, vérifier s'il est parent ailleurs et récupérer ses enfants (petits-enfants)
        const childrenWithInfo = await Promise.all(
            children.rows.map(async (child) => {
                // Vérifier si cet enfant est parent (père OU mère) dans une autre famille
                const parentCheck = await pool.query(`
                    SELECT pf.fk_famille as "otherFamilyId"
                    FROM personne_famille pf
                    WHERE pf.fk_personne = $1 
                    AND pf.role IN ('pere', 'mere')
                    AND pf.fk_famille != $2
                    LIMIT 1
                `, [child.id, familyId]);
                
                // Récupérer les enfants de cet enfant (petits-enfants)
                const grandchildren = await pool.query(`
                    SELECT 
                        p.pk_personne as id,
                        p.nom as "lastName",
                        p.prenom as "firstName",
                        p.sexe as gender,
                        p.date_naissance as "birthDate"
                    FROM parent_enfant pe
                    JOIN personne p ON pe.fk_enfant = p.pk_personne
                    WHERE pe.fk_parent = $1
                    ORDER BY p.date_naissance
                `, [child.id]);
                
                return {
                    ...child,
                    hasOtherFamily: parentCheck.rows.length > 0,
                    otherFamilyId: parentCheck.rows[0]?.otherFamilyId || null,
                    grandchildren: grandchildren.rows
                };
            })
        );
        
        // 7. Pour chaque parent, vérifier s'il est enfant dans une autre famille
        const parentsWithInfo = await Promise.all(
            parents.rows.map(async (parent) => {
                // Vérifier si ce parent est enfant dans une autre famille
                const childCheck = await pool.query(`
                    SELECT pf.fk_famille as "otherFamilyId"
                    FROM personne_famille pf
                    WHERE pf.fk_personne = $1 AND pf.role = 'enfant'
                    LIMIT 1
                `, [parent.id]);
                
                return {
                    ...parent,
                    hasOtherFamily: childCheck.rows.length > 0,
                    otherFamilyId: childCheck.rows[0]?.otherFamilyId || null
                };
            })
        );
        
        // Formater la réponse
        const response = {
            success: true,
            id: parseInt(family.rows[0].id),
            name: family.rows[0].name,
            // Grands-parents paternels uniquement
            grandparents: grandparents.map(gp => ({
                id: gp.id,
                firstName: gp.firstName || '',
                lastName: gp.lastName || '',
                gender: gp.gender === 'M' ? 'male' : 'female',
                birthDate: gp.birthDate ? formatDate(gp.birthDate) : null,
                role: gp.role
            })),
            parents: parentsWithInfo.map(p => ({
                id: p.id,
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                gender: p.gender === 'M' ? 'male' : 'female',
                birthDate: p.birthDate ? formatDate(p.birthDate) : null,
                role: p.role,
                familyId: parseInt(familyId),
                hasOtherFamily: p.hasOtherFamily,
                otherFamilyId: p.otherFamilyId
            })),
            children: childrenWithInfo.map(c => ({
                id: c.id,
                firstName: c.firstName || '',
                lastName: c.lastName || '',
                gender: c.gender === 'M' ? 'male' : 'female',
                birthDate: c.birthDate ? formatDate(c.birthDate) : null,
                familyId: parseInt(familyId),
                hasOtherFamily: c.hasOtherFamily,
                otherFamilyId: c.otherFamilyId,
                grandchildren: c.grandchildren.map(gc => ({
                    id: gc.id,
                    firstName: gc.firstName || '',
                    lastName: gc.lastName || '',
                    gender: gc.gender === 'M' ? 'male' : 'female',
                    birthDate: gc.birthDate ? formatDate(gc.birthDate) : null
                }))
            }))
        };
        
        console.log(`📊 Famille ${familyId}: ${response.grandparents.length} grands-parents, ${response.parents.length} parents, ${response.children.length} enfants`);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fonction pour formater les dates
function formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
}

// Route de santé (health check)
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Toutes les autres routes vont au frontend
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur après connexion à la base
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'localhost';

connectWithRetry().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📍 Application accessible via: https://${DOMAIN}`);
        console.log(`🔐 BasicAuth activée`);
    });
});
