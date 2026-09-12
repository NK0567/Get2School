# Travailler à trois sur Get2School

Ce fichier est la règle du jeu. Il est court exprès, tout le monde doit l'avoir lu.

---

## 1. Le principe

Ce n'est pas trois projets, c'est **une seule application** dans **un seul dépôt**. Chacun travaille dans ses dossiers, sur sa branche, et ne touche jamais à ceux des autres. Le découpage a été fait pour qu'une fusion soit un non-événement.

| Lot | Personne | Domaine |
|---|---|---|
| A | Boris | Socle, sécurité, administration, documents, communication |
| B | Alida | Scolarité, organisation, finance |
| C | Fabrice | Académique, vie scolaire, pilotage |

Boris est l'intégrateur : il arbitre les décisions techniques, merge les PR, maintient le design system.

---

## 2. Démarrer

```bash
git clone <url-du-depot> get2school
cd get2school
npm install
npm run dev
```

Comptes de démonstration (le mot de passe n'est pas vérifié) :

| Adresse | Rôle |
|---|---|
| `direction@lyceebafoussam.cm` | Super Administrateur |
| `secretariat@lyceebafoussam.cm` | Secrétaire |
| `pedagogie@lyceebafoussam.cm` | Responsable pédagogique |
| `comptabilite@lyceebafoussam.cm` | Comptable |
| `smbala@lyceebafoussam.cm` | Enseignant |

Le sélecteur de rôle en haut à droite permet de basculer sans se reconnecter, pour tester les permissions. Le bouton de réinitialisation à côté vide les données de démonstration et recharge la page.

---

## 3. Qui possède quoi

**Tu ne modifies un fichier que si ton nom est en face.** En cas de besoin, tu ouvres une issue, le propriétaire le fait.

| Chemin | Propriétaire | Les autres |
|---|---|---|
| `src/socle/api/`, `src/socle/etat/`, `src/socle/gardes/`, `src/socle/services/` | Boris | lecture seule |
| `src/socle/simulation/base.ts`, `index.ts` | Boris | lecture seule |
| `src/ui/`, `src/gabarit/` (hors `menu/`) | Boris | lecture seule |
| `src/routes/index.tsx`, `src/App.tsx`, `src/main.tsx`, `src/index.css` | Boris | lecture seule |
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` | Boris | lecture seule |
| `src/socle/modeles/administration.ts` | Boris | lecture seule |
| `src/socle/modeles/scolarite.ts`, `finances.ts` | Alida | lecture seule |
| `src/socle/modeles/academique.ts` | Fabrice | lecture seule |
| `src/socle/simulation/donnees-<lot>.ts` | le lot | lecture seule |
| `src/socle/simulation/routes-<lot>.ts` | le lot | lecture seule |
| `src/routes/routes-<lot>.tsx` | le lot | lecture seule |
| `src/gabarit/menu/menu-<lot>.ts` | le lot | lecture seule |
| `src/modules/<son module>/` | le lot | lecture seule |

`lot` vaut `administration` (Boris), `scolarite` (Alida) ou `academique` (Fabrice).

Le fichier `.github/CODEOWNERS` fait appliquer cette table automatiquement : GitHub demande la relecture du propriétaire dès qu'une PR touche un de ses fichiers.

---

## 4. Pourquoi il n'y aura pas de conflits

Les conflits ne viennent jamais des écrans, ils viennent des fichiers que tout le monde doit modifier. Il y en avait six, ils ont tous été découpés :

| Besoin commun | Découpage |
|---|---|
| Déclarer une route | `src/routes/routes-<lot>.tsx`, assemblés par `routes/index.tsx` |
| Ajouter une entrée de menu | `src/gabarit/menu/menu-<lot>.ts`, assemblés par `menu/index.ts` |
| Déclarer un type métier | `src/socle/modeles/<domaine>.ts` |
| Ajouter des données de démonstration | `src/socle/simulation/donnees-<lot>.ts` |
| Simuler un endpoint | `src/socle/simulation/routes-<lot>.ts` |
| Installer une librairie | Boris uniquement. Après chaque `git pull`, les autres font `npm install` |

Les trois fichiers d'assemblage (`routes/index.tsx`, `menu/index.ts`, `simulation/index.ts`) sont figés. Ils ne changent que si un lot est ajouté ou retiré.

---

## 5. Git

```
main       aucun commit direct, uniquement des merges de PR
develop    branche d'intégration
feat/<module>-<description-courte>
fix/<module>-<description-courte>
```

Exemples : `feat/eleves-fiche-a-onglets`, `fix/notes-calcul-rang-ex-aequo`

Messages de commit en français, format Conventional Commits :

```
feat(eleves): ajout de la fiche élève à onglets
fix(notes): correction du rang en cas d'ex aequo
docs(paiements): rédaction des user stories du module
style(ui): harmonisation des espacements
refactor(socle): extraction du calcul de solde
```

**Avant chaque push :**

```bash
git pull --rebase origin develop
npm run verifier
```

`npm run verifier` lance TypeScript, ESLint et Prettier. Si ça ne passe pas chez toi, ça ne passera pas en relecture.

Les PR vont vers `develop`, relues par au moins une autre personne. La description dit : ce qui est fait, les US couvertes, comment tester.

Un push par jour travaillé au minimum. Une branche qui vit plus de quatre jours sans être poussée est un risque.

---

## 6. Comment on écrit un écran

L'écran de référence est **`src/modules/utilisateurs/pages/ListeUtilisateurs.tsx`**. Copiez-le, ne réinventez rien. Il montre déjà :

- les quatre états exigés (chargement, données, liste vide, erreur) ;
- les filtres et la pagination ;
- le contrôle de rôle ;
- la modale de création avec validation Zod et messages en français ;
- le toast de confirmation ;
- l'appel au journal d'audit.

La chaîne est toujours la même :

```
pages/MonEcran.tsx     l'affichage, aucun appel HTTP direct
   └─ hooks/useX.ts    React Query : cache, états, invalidation
        └─ api.ts      axios + appel à journaliser() si l'opération est sensible
             └─ simulation/routes-<lot>.ts   la réponse simulée
```

Un composant ne fait jamais d'appel `axios` lui-même et ne lit jamais la simulation.

### Definition of Done

- [ ] l'écran est atteignable depuis le menu
- [ ] tous les critères d'acceptation de l'US passent à la main
- [ ] les données viennent de l'API, aucune donnée en dur dans un composant
- [ ] les quatre états sont gérés
- [ ] les formulaires valident, messages en français
- [ ] le contrôle de rôle est en place et testé en changeant de rôle
- [ ] aucun lien mort : un bouton non implémenté est désactivé
- [ ] les composants viennent de `src/ui`, aucun style inventé
- [ ] les opérations sensibles appellent `journaliser()`
- [ ] `npm run verifier` passe
- [ ] la PR est mergée dans `develop`

---

## 7. Interdits

- Une couleur qui n'est pas dans `src/index.css`
- Un composant d'interface recodé au lieu d'être importé de `src/ui`
- `alert()`, `confirm()`, `prompt()`
- Un tableau sans état vide
- Une action destructive sans confirmation nommée explicitement
- Du texte anglais dans l'interface
- Une icône qui ne vient pas de `lucide-react`
- Du lorem ipsum dans un écran présenté
- Installer une dépendance sans passer par Boris

---

## 8. Vocabulaire imposé

Les synonymes créent des bugs. Ces termes s'emploient dans l'interface comme dans le code.

Établissement, année scolaire, période, élève, inscription, classe (pédagogique), salle (physique), matière, affectation, évaluation, note, moyenne, rang, bulletin, frais, paiement, solde, reçu.

**Code en anglais, interface en français.** Les routes sont en français parce qu'elles sont visibles par l'utilisateur.

---

## 9. Règles de gestion à citer dans les US

| N° | Règle |
|---|---|
| RG-01 | Toute donnée est rattachée à un établissement |
| RG-02 | Un utilisateur ne voit jamais les données d'un autre établissement |
| RG-03 | Le matricule est unique dans l'établissement et immuable |
| RG-04 | Au plus une inscription active par élève et par année |
| RG-05 | Une classe appartient à une année scolaire |
| RG-06 | Une note est comprise entre 0 et le barème de l'évaluation |
| RG-07 | Une note ne se supprime pas : elle se corrige ou se sanctionne, avec motif |
| RG-08 | Une période verrouillée interdit toute modification de note |
| RG-09 | Le calcul ignore les évaluations non publiées |
| RG-10 | Ex aequo : même rang, rang suivant sauté (1, 2, 2, 4) |
| RG-11 | Un paiement a une référence unique et génère exactement un reçu |
| RG-12 | Un paiement ne se supprime pas, il s'annule avec motif |
| RG-13 | Le statut financier est calculé, jamais saisi |
| RG-14 | Les opérations sensibles sont journalisées |
| RG-15 | Le journal d'audit est en lecture seule |
| RG-16 | Une recommandation algorithmique ne déclenche jamais d'action |
| RG-17 | Un document généré porte une référence unique et un QR code |
