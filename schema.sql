

DROP TABLE IF EXISTS personne_famille CASCADE;
DROP TABLE IF EXISTS parent_enfant CASCADE;
DROP TABLE IF EXISTS personne CASCADE;
DROP TABLE IF EXISTS famille CASCADE;

----------- table famille-----------
create table famille(
	pk_famille serial primary key not null ,
	nom_famille varchar(20)
);

---------- table personne ----------
create table personne(
	pk_personne serial primary key not null,
	nom varchar(20),
	prenom varchar(20),
	date_naissance date,
	sexe char(1) check(sexe in ('M','F'))
);

---------table parent-enfant---------------
create table parent_enfant(
	fk_parent integer,
	fk_enfant integer,
	type_parent varchar(20) check(type_parent in('pere','mere')),
	primary key(fk_parent,fk_enfant),
	foreign key (fk_parent) references personne(pk_personne),
	foreign key (fk_enfant) references personne(pk_personne)
);

---------table personne-famille------------

CREATE TABLE personne_famille (
    fk_personne INTEGER,
    fk_famille INTEGER,
    role VARCHAR(20)
        CHECK (role IN ('enfant', 'mere', 'pere', 'conjoint')),

    PRIMARY KEY (fk_personne, fk_famille),

    FOREIGN KEY (fk_personne) REFERENCES personne(pk_personne),
    FOREIGN KEY (fk_famille) REFERENCES famille(pk_famille)
);



------------------ insertion des famille -------------------
insert into famille
values
	(1,'famille dedzo'),
	(2,'famille nzietchou');

-------------- insertion des personnes --------------- 
insert into personne(nom,prenom,sexe)
values
	('dedzo','andré','M'),
	('kamene','marie','F'),
	('tsapi dedzo','théophile','M'),
	('tsamene dedzo','berlote','F'),
	('tumene dedzo','herodiade','F'),
	('fouodji dedzo','francisque','M'),
	('nzietchou keyanyem','donatien','M'),
	('nzietchou keyanyem','joram','M'),
	('nzietchou dedzo','ares','M'),
	('nzietchou kamene','andric','M'),
	('nzietchou tedontsop','amida','F'),
	('nzietchou tsapi','erna','F'),
	('nzietchou demano','kerena','F');

--------------- insertion dans personne-famille-----------

insert into personne_famille
values
	(1,1,'pere'),
	(2,1,'mere'),
	(3,1,'enfant'),
	(4,1,'enfant'),
	(5,1,'enfant'),
	(5,2,'mere'),
	(6,1,'enfant'),
	(7,2,'pere'),
	(9,2,'enfant'),
	(10,2,'enfant'),
	(11,2,'enfant'),
	(12,2,'enfant'),
	(13,2,'enfant'),
	(8,2,'enfant');

--------------- insertion dans parent-enfant----------
insert into parent_enfant
values
	(1,3,'pere'),
	(1,4,'pere'),
	(1,5,'pere'),
	(1,6,'pere'),
	(2,3,'mere'),
	(2,4,'mere'),
	(2,5,'pere'),
	(2,6,'pere'),
	(7,8,'pere'),
	(7,9,'pere'),
	(7,10,'pere'),
	(7,11,'pere'),
	(7,12,'pere'),
	(7,13,'pere'),
	(5,8,'pere'),
	(5,9,'pere'),
	(5,10,'pere'),
	(5,11,'pere'),
	(5,12,'pere'),
	(5,13,'pere');


insert into personne(nom,prenom,sexe)
values
('tchoumene dedzo','roland','M');

insert into personne(nom,prenom,sexe)
values
('tchoumene','michelle','F');

insert into parent_enfant
values
(1,14,'pere'),
(2,14,'mere');

insert into personne_famille
values
(14,1,'enfant');
