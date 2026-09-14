# Get2School

Plateforme SaaS de gestion, de communication et de pilotage des établissements scolaires.
Maquette interactive, phase Conception et Maquettage.

---

## Démarrer

```bash
npm install
npm run dev
```

Puis `direction@lyceebafoussam.cm` avec n'importe quel mot de passe.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run verifier` | TypeScript + ESLint + Prettier |
| `npm run format` | Reformate le code |

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

**À construire**

Les routes des lots B et C affichent un écran « en construction ». Chacun remplace les siennes au fur et à mesure, dans son propre fichier de routes.

---

## Rappel de périmètre

Hors périmètre de cette version : application mobile, chatbot, comptes parents, Data Warehouse, Power BI, génération automatique d'emploi du temps. Ces sujets restent dans le mémoire comme perspectives.
