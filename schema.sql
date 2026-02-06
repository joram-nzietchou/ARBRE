-- Nettoyage
DROP TABLE IF EXISTS famille CASCADE;
DROP TABLE IF EXISTS personne CASCADE;
DROP TABLE IF EXISTS parent_enfant CASCADE;
DROP TABLE IF EXISTS personne_famille CASCADE;

-- Création des tables
CREATE TABLE famille(
    pk_famille SERIAL PRIMARY KEY NOT NULL,
    nom_famille VARCHAR(20)
);

CREATE TABLE personne(
    pk_personne SERIAL PRIMARY KEY NOT NULL,
    nom VARCHAR(20),
    prenom VARCHAR(20),
    date_naissance DATE,
    sexe CHAR(1) CHECK(sexe IN ('M','F'))
);

CREATE TABLE parent_enfant(
    fk_parent INTEGER,
    fk_enfant INTEGER,
    type_parent VARCHAR(20) CHECK(type_parent IN('pere','mere')),
    PRIMARY KEY(fk_parent, fk_enfant),
    FOREIGN KEY (fk_parent) REFERENCES personne(pk_personne),
    FOREIGN KEY (fk_enfant) REFERENCES personne(pk_personne)
);

CREATE TABLE personne_famille (
    fk_personne INTEGER,
    fk_famille INTEGER,
    role VARCHAR(20) CHECK (role IN ('enfant', 'mere', 'pere', 'conjoint')),
    PRIMARY KEY (fk_personne, fk_famille),
    FOREIGN KEY (fk_personne) REFERENCES personne(pk_personne),
    FOREIGN KEY (fk_famille) REFERENCES famille(pk_famille)
);

-- Insertion des familles
INSERT INTO famille VALUES
    (1, 'famille dedzo'),
    (2, 'famille nzietchou'),
    (3, 'famille tsapi');

-- Insertion des personnes
INSERT INTO personne(nom, prenom, sexe) VALUES
    -- Famille DEDZO
    ('dedzo', 'andré', 'M'),                    -- 1
    ('kamene', 'marie', 'F'),                   -- 2
    ('tsapi dedzo', 'théophile', 'M'),          -- 3
    ('tsamene dedzo', 'berlote', 'F'),          -- 4
    ('tumene dedzo', 'herodiade', 'F'),         -- 5
    ('fouodji dedzo', 'francisque', 'M'),       -- 6
    -- Famille NZIETCHOU
    ('nzietchou keyanyem', 'donatien', 'M'),    -- 7
    ('nzietchou keyanyem', 'joram', 'M'),       -- 8
    ('nzietchou dedzo', 'ares', 'M'),           -- 9
    ('nzietchou kamene', 'andric', 'M'),        -- 10
    ('nzietchou tedontsop', 'amida', 'F'),      -- 11
    ('nzietchou tsapi', 'erna', 'F'),           -- 12
    ('nzietchou demano', 'kerena', 'F'),        -- 13
    -- Famille TSAPI
    ('tsapi', 'arthur', 'M'),                   -- 14
    ('tsapi', 'andy', 'M'),                     -- 15
    ('tsapi', 'audrey', 'F'),                   -- 16
    ('tsapi', 'chloé', 'F'),                    -- 17
    ('tsapi', 'amalia', 'F'),                   -- 18
    ('tata', 'viviane', 'F'),                   -- 19
    -- Enfants supplémentaire DEDZO
    ('tchoumene dedzo', 'rolland', 'M'),         -- 20
    ('tchoumene', 'michelle', 'F');             -- 21

-- Insertion dans personne_famille
INSERT INTO personne_famille VALUES
    -- Famille DEDZO (ID: 1)
    (1, 1, 'pere'),      -- André (père)
    (2, 1, 'mere'),      -- Marie (mère)
    (3, 1, 'enfant'),    -- Théophile (enfant), PÈRE dans famille TSAPI
    (4, 1, 'enfant'),    -- Berlote (enfant)
    (5, 1, 'enfant'),    -- Herodiade (enfant), MÈRE dans famille NZIETCHOU
    (6, 1, 'enfant'),    -- Francisque (enfant)
    (20, 1, 'enfant'),   -- Rolland (enfant)
    -- Famille NZIETCHOU (ID: 2)
    (7, 2, 'pere'),      -- Donatien (père)
    (5, 2, 'mere'),      -- Herodiade (mère), ENFANT dans famille DEDZO
    (8, 2, 'enfant'),    -- Joram (enfant)
    (9, 2, 'enfant'),    -- Ares (enfant)
    (10, 2, 'enfant'),   -- Andric (enfant)
    (11, 2, 'enfant'),   -- Amida (enfant)
    (12, 2, 'enfant'),   -- Erna (enfant)
    (13, 2, 'enfant'),   -- Kerena (enfant)
    -- Famille TSAPI (ID: 3)
    (3, 3, 'pere'),      -- Théophile (père), ENFANT dans famille DEDZO
    (19, 3, 'mere'),     -- Viviane (mère)
    (14, 3, 'enfant'),   -- Arthur (enfant)
    (15, 3, 'enfant'),   -- Andy (enfant)
    (16, 3, 'enfant'),   -- Audrey (enfant)
    (17, 3, 'enfant'),   -- Chloé (enfant)
    (18, 3, 'enfant');   -- Amalia (enfant)

-- Insertion dans parent_enfant
INSERT INTO parent_enfant VALUES
    -- Parents de la famille DEDZO
    (1, 3, 'pere'),      -- André → Théophile
    (1, 4, 'pere'),      -- André → Berlote
    (1, 5, 'pere'),      -- André → Herodiade
    (1, 6, 'pere'),      -- André → Francisque
    (1, 20, 'pere'),     -- André → Rolland
    (2, 3, 'mere'),      -- Marie → Théophile
    (2, 4, 'mere'),      -- Marie → Berlote
    (2, 5, 'mere'),      -- Marie → Herodiade
    (2, 6, 'mere'),      -- Marie → Francisque
    (2, 20, 'mere'),     -- Marie → Rolland
    -- Parents de la famille NZIETCHOU
    (7, 8, 'pere'),      -- Donatien → Joram
    (7, 9, 'pere'),      -- Donatien → Ares
    (7, 10, 'pere'),     -- Donatien → Andric
    (7, 11, 'pere'),     -- Donatien → Amida
    (7, 12, 'pere'),     -- Donatien → Erna
    (7, 13, 'pere'),     -- Donatien → Kerena
    (5, 8, 'mere'),      -- Herodiade → Joram
    (5, 9, 'mere'),      -- Herodiade → Ares
    (5, 10, 'mere'),     -- Herodiade → Andric
    (5, 11, 'mere'),     -- Herodiade → Amida
    (5, 12, 'mere'),     -- Herodiade → Erna
    (5, 13, 'mere'),     -- Herodiade → Kerena
    -- Parents de la famille TSAPI
    (3, 14, 'pere'),     -- Théophile → Arthur
    (3, 15, 'pere'),     -- Théophile → Andy
    (3, 16, 'pere'),     -- Théophile → Audrey
    (3, 17, 'pere'),     -- Théophile → Chloé
    (3, 18, 'pere'),     -- Théophile → Amalia
    (19, 14, 'mere'),    -- Viviane → Arthur
    (19, 15, 'mere'),    -- Viviane → Andy
    (19, 16, 'mere'),    -- Viviane → Audrey
    (19, 17, 'mere'),    -- Viviane → Chloé
    (19, 18, 'mere');    -- Viviane → Amalia

    
--------grand-parents famille nzietchou------
insert into personne(nom, prenom, sexe) values
('keyanyim','marc','M'),
('tedontsop','genevieve','F');

--insert into personne_famille values
--(22,2,'pere')
INSERT INTO parent_enfant VALUES
    (24, 7, 'pere'),   -- Marc → Donatien
    (25, 7, 'mere');   -- Geneviève → Donatien