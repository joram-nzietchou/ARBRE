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
    user: 'postgres',
    host: 'localhost',
    database: 'arbre',
    password: 'joram18',
    port: 5432
});

// Test BD
pool.connect()
    .then(() => console.log('✅ PostgreSQL connecté'))
    .catch(err => console.error('❌ Erreur DB:', err.message));

// ========== ROUTES API ==========

// 1. Une famille avec ses membres
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
        
        // 2. Récupérer les parents
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
            ORDER BY pf.role
        `, [familyId]);
        
        // 3. Récupérer les enfants
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
        
        // 4. Pour chaque enfant, vérifier s'il est parent ailleurs
        const childrenWithFamilyInfo = await Promise.all(
            children.rows.map(async (child) => {
                // Vérifier si cet enfant est parent dans une autre famille
                const parentCheck = await pool.query(`
                    SELECT pf.fk_famille as "otherFamilyId"
                    FROM personne_famille pf
                    WHERE pf.fk_personne = $1 AND pf.role IN ('pere', 'mere')
                    LIMIT 1
                `, [child.id]);
                
                return {
                    ...child,
                    hasOtherFamily: parentCheck.rows.length > 0,
                    otherFamilyId: parentCheck.rows[0]?.otherFamilyId || null
                };
            })
        );
        
        // 5. Pour chaque parent, vérifier s'il est enfant dans une autre famille
        const parentsWithFamilyInfo = await Promise.all(
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
            parents: parentsWithFamilyInfo.map(p => ({
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
            children: childrenWithFamilyInfo.map(c => ({
                id: c.id,
                firstName: c.firstName || '',
                lastName: c.lastName || '',
                gender: c.gender === 'M' ? 'male' : 'female',
                birthDate: c.birthDate ? formatDate(c.birthDate) : null,
                familyId: parseInt(familyId),
                hasOtherFamily: c.hasOtherFamily,
                otherFamilyId: c.otherFamilyId
            }))
        };
        
        console.log(`📊 Famille ${familyId} chargée: ${response.parents.length} parents, ${response.children.length} enfants`);
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

// Toutes les autres routes vont au frontend
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré: http://localhost:${PORT}`);
});
