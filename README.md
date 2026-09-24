# Get2School

Plateforme SaaS de gestion, de communication et de pilotage des établissements scolaires.
Maquette interactive, phase Conception et Maquettage.

---

## Démarrer

```bash
npm install
npm run dev
```


| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run verifier` | TypeScript, ESLint, Prettier et contrôle des écrans |
| `npm run format` | Reformate le code |

En développement, l'écran de connexion liste les comptes de démonstration : cliquez sur l'un d'eux
pour remplir le formulaire. Le mot de passe n'est pas vérifié tant que l'API est simulée. Ce bloc
disparaît automatiquement du bundle de production.

**Lisez `CONTRIBUTING.md` avant votre premier commit.** Il contient la table de propriété des fichiers et la règle du jeu à trois.

---

## Stack

| Couche | Choix |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Style | Tailwind CSS 4, charte dans `src/index.css` |
| Routage | React Router |
| État serveur | TanStack Query |
| État global | Zustand |
| Formulaires | React Hook Form + Zod |
| Interface | Design system maison + Headless UI + lucide-react |
| Backend cible | Spring Boot 3, PostgreSQL, JWT |

---

## Le backend n'existe pas encore, et ça ne se voit pas

Les modules appellent une vraie instance axios sur `/api/v1/**`. Un adaptateur intercepte ces requêtes et répond depuis une base en mémoire persistée dans `localStorage`, avec 300 ms de latence pour que les états de chargement soient visibles.

```
composant → hook React Query → api.ts du module → axios → simulation → localStorage
```

Le jour où Spring Boot est en ligne, on retire l'appel à `installerSimulation()` dans `src/main.tsx`. **Aucun composant, aucun hook, aucun fichier `api.ts` ne change.** C'est la raison pour laquelle personne ne doit lire la simulation depuis un écran.

---

## Architecture

```
src/
├── socle/                  fondations · Boris
│   ├── api/                instance axios unique
│   ├── simulation/         base en mémoire + routes simulées par lot
│   ├── modeles/            contrat de données, un fichier par domaine
│   ├── etat/               session, année et période courantes
│   ├── gardes/             authentification, rôles
│   └── services/           journal d'audit, notifications
├── ui/                     design system · Boris
├── gabarit/                coquille, barres, menu découpé par lot
├── routes/                 tables de routes découpées par lot
└── modules/                un dossier par module métier
        └── <module>/
            ├── pages/       écrans routés
            ├── composants/  composants du module
            ├── hooks/       React Query
            └── api.ts       appels HTTP
```

Le découpage par lot des fichiers autrement partagés (routes, menu, modèles, données, endpoints simulés) est ce qui rend les fusions indolores. Détail dans `CONTRIBUTING.md`, section 4.

---

## Répartition

| Lot | Personne | Modules |
|---|---|---|
| A | Boris | authentification, utilisateurs, établissement, années scolaires, journal d'audit, recherche, annonces, notifications, modèles de documents, centre documentaire |
| B | Alida | élèves, inscriptions, enseignants, classes, matières, salles, affectations, emploi du temps, frais, paiements, reçus, finances |
| C | Fabrice | évaluations, planning, notes, calculs, bulletins, absences, discipline, analyses |

---

## État d'avancement

**Livré**

- Projet, dépendances, configuration TypeScript, ESLint, Prettier
- Charte graphique en variables Tailwind
- Design system : bouton, champ, sélecteur, badge, tableau, modale, dialogue de confirmation, toast, en-tête de page, état vide, squelette, carte statistique
- Coquille applicative : barre latérale filtrée par rôle, sélecteur d'année et de période, sélecteur de rôle de démonstration, réinitialisation des données
- Contrat de données complet des trois lots
- Base simulée avec persistance et endpoints du lot A
- Gardes d'authentification et de rôle
- Service de journalisation d'audit
- Connexion, tableau de bord
- **Écran de référence** : `/utilisateurs`, patron à copier pour toutes les listes
- Établissement : identité, paramètres de calcul, assistant de configuration initiale
- Années scolaires : cycle de vie, périodes, verrouillage avec motif obligatoire
- Journal d'audit : filtres, comparaison avant/après, export
- Authentification : connexion, mot de passe oublié, réinitialisation, politique de mot de passe, sessions ouvertes, expiration d'inactivité
- Centre documentaire : catalogue de 11 types, génération unitaire et en lot, annulation avec motif, modèles documentaires, aperçu imprimable
- Vérification publique : `/v/:reference`, sans authentification, cible des QR codes imprimés
- Annonces : rédaction, ciblage avec comptage des destinataires, diffusion, retrait avec motif
- Notifications : centre, compteur dans la barre haute, catalogue de types partagé entre les trois lots
- Recherche globale : élèves, enseignants, classes, comptes et documents, cloisonnée par rôle côté serveur

- Utilisateurs : fiche à trois onglets (identité, permissions, activité), matrice rôles × permissions
- Annonces : écran de consultation ouvert à tous les rôles, distinct de l'administration des annonces

**Le lot A est complet.** Ses douze modules sont livrés et routés.

**Lot C, en cours** : Évaluations et Notes.

- Évaluations : liste filtrable par classe, matière et période, création en brouillon,
  publication (RG-09 : une évaluation non publiée n'entre jamais dans le calcul des moyennes).
  Le cloisonnement par enseignant est appliqué côté serveur : un enseignant ne voit et ne peut
  créer d'évaluations que sur les couples classe + matière où il est affecté — deux enseignants
  d'une même classe restent cloisonnés par matière.
- Notes : grille de saisie au clavier (Entrée passe à la ligne suivante), moyenne de la classe
  affichée en direct, avertissement avant de quitter une saisie non enregistrée. Sanction d'une
  note avec motif obligatoire (RG-07 : jamais de suppression). Blocage de toute saisie sur une
  période verrouillée (RG-08), vérifié côté serveur. Moteur de calcul (`modules/notes/calculs.ts`)
  isolé en fonctions pures et testé unitairement : moyenne pondérée, les deux politiques de note
  sanctionnée (`EXCLUDE_COEFFICIENT` / `COUNT_AS_ZERO`), classement avec ex aequo (RG-10), taux de
  réussite, appréciation automatique. Fonctions pures, sans accès au stockage — transposables
  telles quelles en Java côté Spring Boot.

- Bulletins : classement de classe et aperçu détaillé par élève, calculés en direct sur les
  évaluations publiées. Cet écran consulte le calcul, il ne génère aucun fichier : le document
  officiel (référence, QR code) se produit depuis le Centre documentaire de Boris, qui lit les
  mêmes données via le contrat `DonneesBulletin` fixé dans `socle/modeles/academique.ts`. Le calcul
  serveur (simulation) réutilise directement `modules/notes/calculs.ts` : ce n'est pas une logique
  dupliquée pour la démonstration, c'est exactement ce que Spring Boot devra reproduire.

- Absences : feuille d'appel (seules les exceptions sont saisies, pas une ligne « présent » par
  élève), registre filtrable, justification en deux temps avec motif obligatoire. Un second appel
  sur la même classe et la même date remplace l'état du jour — le contrat exige que l'écran envoie
  toujours l'ensemble de la classe, jamais une correction partielle, pour ne pas effacer par erreur
  les exceptions d'élèves absents de l'envoi. Le bulletin lit désormais ces données réelles,
  bornées aux dates de la période : les zéros du module précédent ont disparu là où de vraies
  absences existent.

- Discipline : signalement des faits et décision en deux temps distincts (RG-14 : les deux actions
  sont journalisées séparément). Le système ne prononce jamais de sanction lui-même — un rappel
  explicite apparaît quand le signalement porte sur une sanction ou une exclusion. Le bulletin lit
  désormais ces événements pour son résumé disciplinaire : c'était le dernier champ qui restait
  fabriqué à zéro faute de module, il est maintenant réel et borné aux dates de la période.

- Élèves à risque : indicateur calculé sur quatre facteurs (moyenne, tendance entre deux périodes,
  taux d'absence, incidents disciplinaires), pondérés par `riskWeights` réglé dans les paramètres
  de l'établissement. Fonction pure testée à part (`scoreRisque` dans `modules/notes/calculs.ts`),
  avec vérification manuelle du calcul et des deux saturations (20 % d'absence, 5 incidents).
  Le bandeau RG-16 fait partie de l'écran, pas une option : l'indicateur signale un dossier à
  examiner, il ne prononce et ne déclenche aucune décision.

- Évolution des apprenants : courbe de la moyenne de classe par période, comparaison possible à
  un élève. Calcul à la maille de la période (un point par trimestre ou semestre), en réutilisant
  exactement les mêmes fonctions déjà testées pour les bulletins et l'indicateur de risque —
  vérifié à la main sur un cas avec deux élèves et deux périodes.
- Planning des évaluations : vue transversale, toutes matières confondues, volontairement non
  restreinte à ses propres matières (contrairement aux écrans de notes) puisque son but est de
  voir ce que les autres enseignants ont déjà programmé sur la classe. Détection non bloquante des
  semaines chargées (plus de 3 évaluations) : un repère de coordination, pas un verrou comme la
  période verrouillée. Ne crée aucune évaluation, la création reste dans le module Évaluations.

**Le lot C est complet : ses huit modules sont livrés et routés.** Évaluations, Notes, Bulletins,
Absences, Discipline, Élèves à risque, Évolution des apprenants, Planning des évaluations.

**Lot B, premier module** : Élèves. Liste, création avec génération automatique du matricule
(RG-03 : format `<CODE_ETB>-<AA>-<NNNN>`, jamais saisi à la main), modification des coordonnées de
contact, archivage avec motif obligatoire (le dossier et son historique restent consultables,
seule l'inscription active se ferme). La création d'un élève crée son inscription active dans le
même geste : un élève sans inscription n'a pas de sens dans l'application.

**La fiche élève est le premier écran réellement intégré des trois lots.** Ses onglets Identité et
Scolarité sont à Alida ; Résultats et Vie scolaire lisent en direct les données déjà produites par
les modules de Fabrice (bulletins, absences, discipline), sans dupliquer aucune règle de calcul.
L'onglet Situation financière reste honnêtement vide : le module Finance n'existe pas encore, ce
n'est pas une donnée fabriquée mais un onglet non construit, assumé comme tel.

- Classes : liste filtrable par niveau, création, fiche à deux onglets (Informations modifiable,
  Élèves en lecture avec lien direct vers chaque dossier). RG-05 : une classe appartient à l'année
  scolaire ouverte, sa création est refusée si aucune n'est ouverte. La capacité ne peut jamais
  descendre sous l'effectif réellement inscrit — vérifié côté serveur, pas seulement dans le
  formulaire. L'effectif se met à jour automatiquement à chaque inscription, testé en réutilisant
  le module Élèves déjà livré plutôt qu'en le supposant.

- Enseignants : liste filtrable par nom et par matière, création avec sélection multiple de
  matières, fiche modifiable (téléphone, adresse, matières), activation et désactivation. Un
  compte utilisateur reste facultatif et découplé de la fiche enseignant. Vérifié : désactiver un
  enseignant ne fait disparaître aucune de ses évaluations déjà publiées, son historique reste
  intact et attribué à son nom.

- Matières : écran unique (liste + modale), code unique vérifié à la création et immuable ensuite,
  activation et désactivation. Vérifié à la main : modifier le coefficient d'une matière change
  immédiatement la moyenne générale déjà calculée par le module de Fabrice pour une période
  passée — (12,25×5 + 18×3)/8 = 14,406 avant, (12,25×20 + 18×3)/23 = 13,000 après. L'écran
  d'édition avertit explicitement de cet effet rétroactif plutôt que de le laisser passer inaperçu.

- Salles : écran unique, nom unique vérifié à la création, capacité et type modifiables,
  disponibilité déclarative (pas un calcul d'occupation, qui dépendrait d'un emploi du temps qui
  n'existe pas encore). Rendre une salle indisponible avertit sur les classes qui la référencent
  encore, sans jamais les en retirer de force : vérifié avec les deux classes du jeu de données
  qui partagent la même salle.

- Inscriptions : registre filtrable par classe et statut, réinscription avec recherche d'élève,
  transfert de classe en mouvement interne (même année scolaire). RG-04 vérifiée côté serveur :
  impossible de réinscrire un élève qui a déjà une inscription active sur l'année en cours. Le
  transfert maintient les effectifs de deux classes en cohérence dans la même opération —
  décrémente la source, incrémente la cible — jamais l'un sans l'autre.

- Affectations : registre (enseignant, matière, classe) filtrable, création avec matière limitée à
  celles réellement déclarées sur la fiche de l'enseignant choisi, retrait avec confirmation.
  Suppression réelle en base : une affectation ne porte aucune donnée à préserver pour l'audit,
  contrairement aux notes ou aux paiements.

  **Un bug cross-lot trouvé et corrigé en testant ce module.** Retirer une affectation fermait
  aussi l'accès de l'enseignant à ses propres évaluations déjà créées sur cette classe : le filtre
  de visibilité du lot C (`routes-academique.ts`) se basait uniquement sur l'affectation
  *actuelle*, pas sur qui avait réellement créé l'évaluation. Corrigé pour qu'un enseignant
  garde toujours accès à ce qu'il a lui-même produit, même après le retrait de son affectation —
  seule la capacité d'en créer de nouvelles se ferme, comme la désactivation d'un enseignant ou
  l'archivage d'un élève ailleurs dans le projet.

- Finance : moteur de calcul pur testé à part (14 cas), distinguant une tranche pas encore échue
  d'une tranche réellement en retard. Trois écrans : Frais et échéances (échéancier dynamique),
  Paiements (chaque paiement génère son reçu dans le même geste, annulation avec motif obligatoire
  qui invalide aussi le reçu associé), Listes financières (situation par classe, export CSV). Le
  jeu de données de démonstration, resté vide depuis le début du projet malgré un commentaire
  disant « à compléter », a été rempli avec les quatre statuts financiers réels.

  **Un défaut de conception trouvé et corrigé en testant.** Le serveur acceptait le montant total
  d'un frais tel qu'envoyé par le client, sans le recalculer depuis la somme des tranches — un
  appel incohérent aurait pu corrompre silencieusement le calcul de solvabilité de tous les
  élèves concernés. Corrigé pour que le montant soit toujours recalculé côté serveur, jamais
  accepté du client, même principe que la génération du matricule d'un élève.

  L'onglet Situation financière de la fiche élève, resté honnêtement vide depuis sa création,
  affiche maintenant les vraies données.

**Correctif** : « Saisie des notes » dans le menu redirigeait silencieusement vers Évaluations
sans explication — repéré par l'utilisateur, ça se comportait comme un écran cassé. Remplacé par
un vrai écran, `modules/notes/pages/SaisieNotes.tsx` : une file de travail personnelle qui répond
à « qu'est-ce qu'il me reste à faire », triée en brouillons à publier, saisies incomplètes, et
évaluations à jour. Endpoint dédié (`GET /evaluations/grading-queue`) qui calcule l'effectif et le
nombre de notes déjà saisies en une seule passe, sans requête répétée par évaluation. Enregistré
avant `GET /evaluations/:id` pour ne pas reproduire le bug d'ordre de routes déjà rencontré deux
fois dans ce projet — vérifié explicitement par un test dédié.

- Emploi du temps : grille hebdomadaire par classe, un conflit (enseignant, salle ou classe déjà
  occupés sur un créneau qui chevauche) est un impossible physique, donc bloqué côté serveur — pas
  un simple avertissement comme le Planning des évaluations. Moteur de détection testé à part (9
  cas, dont le cas limite des bornes adjacentes : deux cours qui s'enchaînent sans trou ne sont
  jamais signalés en conflit). Le message d'erreur détaille chaque raison en clair, parce que
  l'intercepteur d'erreurs global (`socle/api/client.ts`, Boris) ne transmet qu'un texte au client,
  jamais de donnée structurée — j'ai adapté la conception de l'API à cette contrainte réelle
  plutôt que de prévoir un format de réponse qui n'aurait jamais pu atteindre l'écran.

**Le projet est complet.** `npm run verifier` ne signale plus aucun écran en construction : 53
écrans routés, tous les trois lots (Boris, Alida, Fabrice) terminés.

## Balayage de cohérence (relecture croisée avec CONTRIBUTING.md)

Une relecture systématique du projet entier contre les règles documentées a trouvé et corrigé :

**Accentuation.** Le foyer principal était le module Années scolaires : messages de confirmation,
libellés de formulaire, et deux fautes grammaticales réelles (« à échoué » au lieu de « a échoué »).
Corrigé aussi dans `BadgeStatut.tsx` (table centrale utilisée par défaut dans une bonne partie du
projet — elle contenait un vrai bug caché, pas seulement un accent manquant : « Eleve » y désignait
« Élevé », un niveau de gravité, ambigu avec « Élève » ; l'entrée s'est avérée inutilisée, Discipline
et Élèves à risque ayant chacun reconstruit leur propre table plutôt que d'utiliser celle-ci — le
doublon que `CONTRIBUTING.md` interdit explicitement), et dans `GabaritDocument.tsx`, affiché sur
chaque document officiel généré dans toute l'application. Une catégorie entière (le texte JSX brut,
hors guillemets) avait échappé au premier balayage ; une seconde passe l'a couverte.

**Ordre des routes et ancrage des expressions régulières.** Vérification systématique des trois
fichiers de simulation par script : aucune régression sur les corrections des sessions précédentes.

## Multi-établissement (fondation du SaaS)

La maquette était mono-établissement de bout en bout : 14 endroits différents référençaient
littéralement `etb-1` en dur. Passage à un stockage partitionné par établissement, fait une seule
fois dans `socle/simulation/base.ts` et `index.ts` :

- Deux collections restent globales (`etablissements`, `utilisateurs`) — un compte doit pouvoir être
  retrouvé par adresse électronique à la connexion, avant même de savoir à quel établissement il
  appartient. Tout le reste (élèves, classes, notes, paiements, documents, journal d'audit...) vit
  dans la partition de son établissement.
- L'établissement de la requête est résolu à partir du jeton, par une enveloppe posée une fois
  autour de l'adaptateur de simulation (`envelopperAdapter` dans `index.ts`) — **aucun des trois
  gros fichiers de routes n'a eu besoin d'être réécrit endpoint par endpoint**. C'est le choix
  architectural qui rend ce changement supportable : le cloisonnement est un problème de couche de
  stockage, pas un problème à répéter (et donc à oublier) dans chaque route.
- 21 occurrences de `collection('etablissements')[0]` — qui supposaient toutes qu'il n'existait
  qu'un seul établissement, toujours au même index — recensées et corrigées vers un point de vérité
  unique (`etablissementCourantDonnees()`).
- Un second établissement de démonstration ajouté (« École Primaire La Colombe », catégorie
  PRIMARY), volontairement minimal, dans son propre fichier séparé (`donnees-etablissement-
  secondaire.ts`) pour ne prendre aucun risque de régression sur les données du Lycée déjà
  largement testées. Le champ `category` (`PRIMARY` | `SECONDARY`) a été ajouté au modèle
  Établissement ; le supérieur reste explicitement hors périmètre.
- Un cas transversal traité à part : la vérification publique d'un document (accessible sans
  connexion, donc sans établissement résolu par jeton) cherche désormais à travers toutes les
  partitions via `collectionToutesPartitions()`, puis résout le bon établissement à partir du
  document trouvé — pas l'inverse.

Vérifié par 14 tests d'isolation (connexion, lecture, écriture, génération de document, vérification
publique sans jeton) et 3 tests de non-régression sur le moteur de calcul pédagogique déjà validé
les sessions précédentes. Aucune fuite trouvée ; le moteur de calcul fonctionne à l'identique pour
les deux établissements sans qu'aucun module métier n'ait eu besoin de connaître l'existence du
multi-tenant.

## Onboarding : inscription d'un établissement et constitution de l'équipe

Un responsable peut désormais créer son propre établissement sans intervention : écran
d'inscription en trois étapes (`/inscription-etablissement`, accessible sans connexion), qui
crée dans le même geste l'établissement, son premier compte (toujours SCHOOL_ADMIN), une année
scolaire ouverte, les modèles de documents de base et la matrice de permissions par défaut — un
établissement flambant neuf n'est plus une coquille vide qui échouerait au premier document généré.

Les rôles ont été renommés avec la vraie terminologie scolaire (Directeur/Proviseur, Censeur,
Intendant) plutôt que des libellés génériques, en corrigeant un accent manquant au passage.

**Mot de passe par défaut, changement obligatoire.** Un compte créé pour l'équipe (écran « Équipe
fondatrice », juste après l'inscription, ou le module Utilisateurs à tout moment) reçoit un mot de
passe généré, conforme à la politique de sécurité déjà en place, affiché une seule fois pour que le
responsable puisse le communiquer. Le compte porte `mustChangePassword`, vérifié à un seul endroit
(`CoquilleApp.tsx`, même principe que le contrôle de rôle) : aucun écran de l'application n'est
accessible tant que ce changement n'a pas eu lieu.

**Deux vrais bugs trouvés en construisant, pas seulement des oublis d'accent :**
- `POST /users` acceptait `establishmentId` du client (placé avant l'étalement du corps de requête
  plutôt qu'après) — une faille d'élévation vers un autre établissement, corrigée en même temps que
  l'ajout du mot de passe par défaut.
- La trace d'audit de connexion/déconnexion écrivait dans une partition non résolue (aucun jeton
  n'existe encore au moment de se connecter) : les entrées auraient été silencieusement perdues.
  Nouvelle primitive d'écriture explicite par établissement (`ajouterEtablissement`) dans la couche
  de stockage, symétrique à celle déjà ajoutée pour la lecture transversale.
- Onze occurrences supplémentaires de `establishmentId: 'etb-1'` codées en dur, trouvées en
  cherchant systématiquement dans tout le projet plutôt qu'en supposant le multi-établissement
  complet après le premier passage : création d'évaluation, de note, de présence, d'événement
  disciplinaire, d'utilisateur, d'année scolaire, d'annonce, de notification. Une évaluation créée
  fixait même son année scolaire en dur (`an-2026`), peu importe l'établissement.

Vérifié par 13 tests de bout en bout : inscription, doublon d'adresse électronique refusé, génération
d'un document dès le premier jour, création de compte avec mot de passe par défaut, connexion,
changement obligatoire, persistance côté serveur, et absence de fuite vers les deux autres
établissements existants.

**Ce qu'il reste** : le choix de thème ne va pas plus loin qu'une couleur d'accent sur les documents
générés — pas un système de re-thématisation complète de l'interface. La hiérarchie reste bâtie sur
l'ensemble fixe de rôles existant (adapté à la terminologie réelle), pas un système de rôles
librement définis par chaque établissement.

## Essai gratuit et abonnement

Un trimestre gratuit à compter de la création de l'établissement, qui se termine au premier de
trois déclencheurs, exactement comme spécifié :

1. Le responsable verrouille lui-même le premier trimestre.
2. Les bulletins de tous les élèves actifs de l'établissement ont été générés pour une période.
3. Quatre mois se sont écoulés depuis la création — au cinquième mois, l'abonnement devient
   obligatoire.

Moteur de calcul pur testé à part (10 cas, bornes incluses : un trimestre verrouillé avant les 4
mois expire quand même, un abonnement déjà actif n'expire jamais, une seconde tentative de
verrouillage ne réécrit pas la raison déjà figée). Une fois l'essai expiré, l'application entière
est remplacée par un écran de blocage — même principe que le changement de mot de passe obligatoire,
un blocage réel et non un rappel contournable. Seul le Directeur ou Proviseur peut activer
l'abonnement ; le tarif dépend de la catégorie de l'établissement (primaire moins cher que
secondaire), et l'abonnement se termine avec l'année scolaire en cours, jamais reconduit
tacitement au-delà.

**Un vrai défaut trouvé avant même de tester** : l'endpoint d'abonnement ne vérifiait le rôle de
personne — n'importe quel compte de l'établissement aurait pu l'activer. Corrigé côté serveur, pas
seulement en désactivant le bouton à l'écran.

Vérifié par 8 tests de bout en bout, chaque déclencheur testé sur un établissement indépendant pour
ne jamais mélanger leurs effets : le Lycée et l'École Primaire, déjà abonnés, ne sont jamais
bloqués ; le verrouillage du trimestre déclenche la fin d'essai et la raison reste stable si on
verrouille une seconde période ; un compte non-directeur est refusé ; générer les bulletins du seul
élève actif d'un établissement neuf déclenche la fin d'essai avec la bonne raison. Le déclencheur
« 4 mois » n'a pu être vérifié qu'indirectement, honnêtement documenté comme tel dans le test : la
base vit en mémoire dans ce navigateur simulé, donc antidater artificiellement la date de départ en
réécrivant localStorage pendant que le serveur tourne ne fonctionne pas — ce qui est vérifié à la
place, c'est que l'endpoint transmet bien la vraie date d'inscription au calcul déjà éprouvé
unitairement, sans ajouter de porte dérobée réservée aux tests dans l'application elle-même.

**Ce qu'il reste** : aucun mode de paiement réel, décision explicite et assumée — l'abonnement
s'active en un clic en attendant. Aucun écran de gestion/résiliation de l'abonnement une fois actif.

## Emploi du temps automatique

Un algorithme glouton aléatoire, construit sur le détecteur de conflits déjà testé plutôt qu'une
seconde règle réécrite en double (`modules/emploi-du-temps/generation.ts`) : pour chaque couple
(classe, matière, enseignant) des affectations de l'année ouverte, on tente un créneau tiré au
hasard, on rejette tout essai en conflit, jusqu'à un nombre d'essais raisonnable. Ce n'est pas un
solveur de contraintes complet — décision assumée, pas un raccourci caché : un couple qui ne trouve
aucun créneau libre est signalé en échec, avec des noms lisibles, jamais silencieusement ignoré ni
laissé planter la génération des autres.

Testé à part (7 cas) : rien ne se place en trop quand il y a assez de place, aucun conflit entre les
créneaux produits, le même enseignant sur deux classes ne se retrouve jamais sur le même créneau,
un créneau déjà existant n'est jamais violé, la saturation totale produit des échecs propres plutôt
qu'un plantage (500 couples pour un seul enseignant → exactement 54 placés, la limite réelle de
créneaux hebdomadaires pour une personne), et le résultat est reproductible avec un générateur
aléatoire injecté pour les tests.

**Un vrai défaut trouvé en testant, pas en écrivant le code.** Relancer la génération après un
premier passage dupliquait les créneaux des couples déjà placés au lieu de ne combler que les
affectations manquantes — mon commentaire affirmait « sans toucher aux créneaux déjà posés », vrai
au sens où rien n'était modifié, mais pas ce qu'un responsable attend en relançant l'action après
avoir ajouté une nouvelle affectation. Corrigé : seules les affectations sans créneau existant sont
transmises à l'algorithme. Revérifié après coup : relancer deux fois de suite ne crée plus rien la
seconde fois.

Câblé dans l'écran Emploi du temps existant : un bouton « Générer automatiquement », une
confirmation avant de lancer (action à l'échelle de tout l'établissement), et un rapport qui
détaille chaque échec avec des noms lisibles plutôt que des identifiants bruts.

## Chronogramme et trois nouveaux documents imprimables

Le modèle `EvenementPlanifie` existait déjà depuis des sessions précédentes (pensé pour le Planning
des évaluations du lot C : réunions, activités, échéances, congés) mais n'était utilisé nulle part
dans le projet. Construit dessus plutôt que d'inventer un second modèle d'événement : un nouveau
module Chronogramme (CRUD complet, écran groupé par période, testé par 7 cas dont l'isolation entre
établissements).

Trois types ajoutés au catalogue de documents, avec un vrai rendu câblé dans `ApercuDocument.tsx` —
pas seulement une entrée de catalogue sans contenu, l'erreur déjà corrigée plus tôt dans cette
session pour d'autres types :
- **CHRONOGRAMME** : les événements groupés par période, comme l'écran de gestion.
- **LISTE_PERSONNEL** : nom, fonction, discipline (pour les enseignants, résolue depuis leurs
  matières), téléphone — les comptes actifs uniquement.
- **EMPLOI_DU_TEMPS_CLASSE** : la grille hebdomadaire d'une classe, imprimable pour affichage.

**Un vrai défaut trouvé par le test, pas supposé.** Les trois génèraient `statut=FAILED` à la
première vérification : j'avais ajouté les trois types au catalogue sans jamais semer leur modèle
actif correspondant, et la règle déjà en place (« sans modèle actif, échec plutôt que document
vide ») s'appliquait donc correctement — c'est elle qui a révélé l'oubli, pas un accident. Corrigé
aux trois endroits où des modèles sont semés : le Lycée, l'École Primaire, et la liste des modèles
de base fournis à tout nouvel établissement inscrit — sinon le même oubli aurait ressurgi à chaque
nouvelle inscription.

Revérifié après correction : les trois documents génèrent maintenant `GENERATED`, et chaque
requête que l'aperçu ferait réellement (événements par période, utilisateurs actifs avec leur
discipline, créneaux d'une classe avec matière et salle résolues) a été rejouée et donne un
résultat cohérent.

## Navigation : boutons retour, et un défaut plus sérieux trouvé en les cherchant

Quatre écrans de détail n'avaient aucun moyen de revenir en arrière (`GrilleSaisieNotes.tsx`,
`PeriodesAnnee.tsx`, `ApercuDocument.tsx`, `GenerationLot.tsx`) : corrigés, en suivant le patron
déjà établi ailleurs (`ApercuBulletin.tsx`) — chemin fixe quand l'écran n'a qu'un seul parent
possible, retour à l'historique du navigateur quand il est atteint depuis plusieurs endroits.

En cherchant systématiquement les écrans sans navigation visible, trois écrans entiers se sont
révélés invisibles depuis l'interface, dans aucun menu : **Affectations**, **Planning des
évaluations**, et **Identité de l'établissement**. Un responsable qui venait de créer ses
enseignants et ses classes n'avait aucun moyen d'atteindre l'écran des affectations sans deviner
l'URL. Les trois ajoutés à leur menu respectif. Un quatrième (`/etablissement/configuration`,
l'ancien assistant de première connexion en quatre étapes) est resté volontairement hors menu : son
propre commentaire d'en-tête le décrit comme déclenché automatiquement à la création d'un
établissement, mais rien dans `CoquilleApp.tsx` ne le fait réellement — il a très probablement été
remplacé par le vrai parcours d'inscription construit plus tôt dans cette session
(`InscriptionEtablissement.tsx` + `EquipeFondatrice.tsx`), qui gère déjà la création avec des
valeurs par défaut sensées. Le raccorder à un déclenchement automatique aurait fait cohabiter deux
systèmes d'onboarding concurrents ; mieux valait le signaler que le réactiver à l'aveugle.

**Un défaut plus grave, trouvé en cherchant pourquoi ces routes n'avaient pas de garde.**
`routes-scolarite.tsx` et `routes-academique.tsx` — les lots d'Alida et de Fabrice, donc la quasi-
totalité de l'application scolaire et académique — n'appliquaient **aucune restriction de rôle**
au niveau des routes, contrairement au fichier de Boris qui le fait systématiquement (35 fois). Le
menu cachait une entrée à un enseignant, mais rien n'empêchait cet enseignant d'atteindre l'écran
des paiements en tapant l'URL directement : un menu qui masque n'est pas un contrôle d'accès.

Corrigé : les deux fichiers de routes réécrits avec `ExigeRole` appliqué à chaque route, les rôles
repris exactement de ceux déjà déclarés dans le menu correspondant — le menu reste la source de
vérité, ce correctif ne fait que rendre son intention réelle plutôt que purement visuelle.

Vérifié par un script structurel (pas un rendu React, `ExigeRole` dépend du contexte de session) :
aucune route non protégée en dehors d'une seule exception assumée (la fiche élève, ouverte à tous
les rôles authentifiés puisque enseignants et secrétariat la consultent tous les deux, chacun via
ses propres onglets), et plus aucun écran de gestion absent de tout menu.

**Ce que ce correctif ne fait pas, et ce que je n'ai pas laissé croire qu'il faisait.** J'ai vérifié
que les endpoints serveur eux-mêmes (`routes-scolarite.ts`, `routes-academique.ts`) ne filtrent
toujours par aucun rôle : un compte qui appellerait l'API directement, en contournant l'écran,
obtiendrait quand même la donnée. Ce n'est pas un oubli de ma part ici — c'est exactement ce que
`docs/audit-production.md` documente déjà, ligne 91 : « le garde client ne fait que masquer
l'interface » ; la vraie autorisation devra être un `@PreAuthorize` sur chaque méthode de service
du futur backend, pas quelque chose à simuler côté client. Ce correctif rend le masquage cohérent
partout où il devrait déjà l'être — il ne prétend pas résoudre ce que ce document identifie déjà,
à juste titre, comme un chantier de backend réel.

## Audit fonctionnel complet, module par module

Suite de régression écrite dans `audits/`, avec sa propre documentation. 69 vérifications, chacune
avec une assertion réelle sur le résultat — pas seulement « ça n'a pas planté ». J'ai supprimé de
mes propres tests plusieurs faux « OK » repérés en cours de route (une erreur survenue pour la
mauvaise raison, un résultat attendu qui ne correspondait pas à ce que l'application renvoyait
réellement, un champ vérifié qui n'existait pas sur le modèle) : je ne voulais pas livrer un audit
qui se rassure lui-même.

**Trois défauts réels trouvés et corrigés en écrivant ces tests, au-delà des accents et libellés
habituels :**
- `fairelAppel` — faute de frappe dans un nom de fonction exportée (module Absences).
- La génération de documents ne renvoyait jamais `targetLabel`, contrairement aux endpoints de
  liste — incohérence de contrat, invisible à l'écran parce que les écrans contournaient le
  problème avec leurs propres recherches, mais un vrai piège pour quiconque consommerait
  directement cette réponse.
- **Un compte pouvait modifier son propre rôle ou désactiver son propre compte par un appel direct
  à l'API**, malgré l'écran qui l'interdisait visuellement. Corrigé sur les trois endpoints
  concernés — encore un cas où le client masquait sans que le serveur n'interdise, la même
  catégorie de défaut que le contrôle de rôle par route trouvé plus haut, mais cette fois sur une
  action individuelle sensible plutôt que sur la visibilité d'un écran entier.

Détail complet, y compris ce qui reste non couvert, dans `audits/README.md`.

**Suite (78/78) :** deux nouveaux défauts réels trouvés et corrigés.

- Les onglets Affectations des fiches classe et enseignant n'avaient jamais été construits, alors
  que leur propre commentaire d'en-tête le promettait explicitement une fois le module Affectations
  prêt — construit depuis, jamais raccordé. Les deux onglets existent maintenant.
- Les sessions actives affichées à l'écran étaient entièrement décoratives : deux entrées fictives
  identiques pour n'importe quel compte, une révocation qui ne changeait rien. Remplacé par un
  suivi réel, avec une limite du mock assumée et documentée en commentaire plutôt que masquée.

Total cumulé : 78 vérifications, toutes avec une assertion réelle sur le résultat.

**Suite (89/89) :** trois nouveaux défauts réels.

- Retirer une annonce était journalisé sous le même code que sa publication (`ANNOUNCEMENT_PUBLISH`)
  — la seule paire créer/annuler du projet à ne pas avoir deux codes distincts. Ajout de
  `ANNOUNCEMENT_WITHDRAW`.
- **Un abonnement actif ne vérifiait jamais sa propre date d'expiration.** `expireLe` était
  enregistré à la souscription mais jamais consulté : un abonnement, une fois actif, ne s'arrêtait
  donc jamais vraiment — en contradiction directe avec la règle explicite « l'abonnement se termine
  quand l'année scolaire se termine ». Corrigé dans le moteur de calcul. Mon premier correctif
  avait lui-même un défaut d'un jour (coupait l'accès dès minuit du jour d'échéance plutôt qu'à sa
  fin) : trouvé par le test écrit immédiatement après, pas supposé correct sur la seule relecture.
- Une fonction identité (`abonnementExpireLe`), définie mais jamais appelée nulle part dans le
  projet, retirée.

Total cumulé : 89 vérifications.

## Un défaut majeur trouvé en revérifiant contre la spécification initiale, pas contre le code

En revenant au tout premier cahier des charges plutôt qu'en continuant à tester le code existant,
une règle explicite n'avait jamais été construite : « le responsable peut désigner un enseignant
titulaire d'une classe, qui pourra générer les bulletins de cette classe ». `Classe.headTeacherId`
existait, réglable depuis la fiche classe — mais sans aucune conséquence. La route Bulletins
excluait purement et simplement les enseignants, et l'endpoint de classement par classe entière ne
vérifiait rien du tout.

```
avant désignation : Serge Mbala n'est titulaire d'aucune classe → refusé, correct
après désignation : Serge Mbala peut consulter SA classe → 2 élève(s) classé(s)
                     Serge Mbala ne peut toujours pas consulter cls-2 → refusé, correct
```

Corrigé aux trois niveaux : le menu, la route, et surtout le serveur — un enseignant ne peut
consulter et générer les bulletins que des classes dont il est le titulaire désigné, jamais une
autre. En creusant, un contrôle DIFFÉRENT existait déjà, dormant, sur le bulletin d'un seul élève
(basé sur l'affectation à une matière, pas le titulariat) : je l'ai laissé tel quel plutôt que de
l'uniformiser à tort, les deux relevant de règles distinctes et toutes les deux légitimes — voir/
générer le classement d'une classe entière est le privilège du titulaire ; consulter le bulletin
d'un élève qu'on note dans une matière est une chose plus large, déjà correcte.

Total cumulé : 95 vérifications.

## Un défaut de tarification, et une vraie faille de manipulation

En vérifiant si le tarif différencié primaire/secondaire fonctionnait vraiment, deux problèmes
empilés : `abonnement.planId` n'était jamais renseigné à l'inscription, donc l'écran d'abonnement
retombait sur le tarif SECONDARY par défaut — une école primaire aurait payé le tarif le plus cher
sans que rien ne le signale. Et l'endpoint d'abonnement acceptait `planId` directement du corps de
la requête envoyée par le client, sans jamais le comparer à la catégorie réelle de l'établissement.

```
un établissement secondaire envoie { planId: 'PRIMARY' } →
planId=SECONDARY, la tentative de manipulation a été ignorée, correct
```

Corrigé à la racine : le plan n'est plus jamais un choix du client, il est toujours dérivé côté
serveur de la catégorie réelle de l'établissement — la même règle appliquée partout ailleurs dans
ce projet pour tout ce qui touche à l'argent (jamais faire confiance à ce qu'envoie le client pour
un montant ou un tarif).

Total cumulé : 100 vérifications.

**Journalisation RG-14.** Croisement de tous les appels `journaliser()` avec la liste complète des
codes `ActionAudit`. Deux opérations sensibles ne journalisaient pas alors que leur code d'action
existait précisément pour elles : `accorderExoneration` (EXEMPTION_GRANT) et `transfererVersClasse`
(ENROLLMENT_TRANSFER). La déconnexion (`POST /auth/logout`) ne produisait aucune trace alors que
`LOGOUT` existe et apparaît dans les filtres du journal d'audit — une catégorie que l'écran
promettait de savoir afficher mais qui ne pouvait jamais contenir d'entrée. Les trois corrigés et
testés, y compris la capture avant/après du transfert de classe. `FEE_UPDATE` reste sans
correspondance : aucune fonction de modification d'un frais n'existe encore, ce n'est pas un oubli
de journalisation mais une fonctionnalité non construite.

## Défaut structurel trouvé et corrigé : le pipeline de documents ne fonctionnait pas réellement

Un signalement direct a mis le doigt sur un défaut que les tests API n'avaient jamais exercé :
`targetId`, sur `DocumentGenere`, stockait un **libellé mis en forme** (« LBK-26-0001 · KAMGA
Ariane ») au lieu d'un identifiant réel. Conséquence vérifiée par test : **aucun document généré,
pas même le certificat de scolarité, ne pouvait retrouver son élève à l'affichage** — la requête
`GET /students/${targetId}` échouait systématiquement. `ApercuDocument.tsx` compensait en affichant
le texte du certificat dès qu'un élève était trouvé, sans jamais distinguer le type réel du
document : un bulletin généré aurait affiché le texte d'une attestation de scolarité au lieu des
notes.

Corrigé à la racine :
- `targetId` est désormais toujours l'identifiant réel de la cible (élève, classe, établissement).
  Un champ `targetLabel`, résolu côté serveur à la lecture, porte l'affichage — jamais stocké.
- `targetType` reflète le vrai type de cible du document (`STUDENT`, `CLASS`, `ESTABLISHMENT`),
  au lieu d'être toujours `STUDENT` par erreur.
- `ApercuDocument.tsx` distingue maintenant le contenu par type réel : un bulletin affiche les
  vraies notes et la vraie moyenne (lues via le même module que l'aperçu de calcul de Fabrice,
  aucune règle dupliquée), une liste de classe affiche le vrai effectif, un certificat garde son
  texte d'attestation — et seuls les types sans contenu construit affichent le message honnête
  « fourni par le module concerné ».
- Trois autres écrans qui affichaient `targetId` brut (`GenerationLot.tsx`, `CentreDocumentaire.tsx`,
  la recherche globale, la vérification publique) résolvent maintenant un vrai nom.

Vérifié par un test qui génère un vrai bulletin après avoir saisi et publié une vraie note, puis
confirme que le document affiche la même moyenne que l'aperçu de calcul (15,25/20).

**Impression et export.** Le bouton « Imprimer » n'était pas assez explicite : choisir
« Enregistrer au format PDF » dans la boîte d'impression du navigateur produit un vrai fichier
téléchargeable, mais rien ne le disait. Libellé et note explicative ajoutés. Il n'existe pas de
génération PDF côté serveur — ce sera un chantier réel à l'arrivée du backend, pas quelque chose à
simuler côté client sans en informer clairement l'utilisateur.

**Limite méthodologique reconnue.** Cette session a exclusivement testé la couche API en script,
jamais l'affichage réel à l'écran. C'est précisément ce qui a laissé passer le défaut du pipeline
de documents pendant plusieurs sessions : les données étaient justes, l'écran affichait autre
chose. Un test qui vérifie une fonction sans vérifier ce que l'utilisateur voit réellement n'est
qu'une partie du travail.

## Correction de règle métier : sanction vs absence

Le réglage d'établissement `penaltyPolicy` (choix entre deux effets possibles d'une sanction sur la
moyenne) reposait sur une mauvaise compréhension de la règle réelle. Clarification directe reçue :
une note sanctionnée vaut **toujours** 0 avec son coefficient compté — ce n'est pas un choix
d'établissement, c'est la définition même d'une sanction. Une absence avec motif valable
(maladie...) est un cas distinct, qui sort la note du calcul entièrement, coefficient exclu — statut
« Absent » déjà existant dans la grille de saisie.

Retiré : le réglage `penaltyPolicy` et son écran de choix. `moyenneMatiere()` ne prend plus de
paramètre de politique. Huit fichiers mis à jour en cohérence (modèle de données, moteur de calcul,
simulation, écran de paramètres, assistant de configuration, modale de sanction). Vérifié : absence
motivée → note ignorée ; sanction → toujours comptée zéro, coefficient inclus, sans aucun réglage.

**À construire**

Les routes des lots B et C affichent un écran « en construction ». Chacun remplace les siennes au fur et à mesure, dans son propre fichier de routes.

---

## Rappel de périmètre

Hors périmètre de cette version : application mobile, chatbot, comptes parents, Data Warehouse, Power BI, génération automatique d'emploi du temps. Ces sujets restent dans le mémoire comme perspectives.
