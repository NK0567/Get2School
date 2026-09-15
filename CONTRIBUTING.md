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
| `src/ui/`, `src/communs/`, `src/gabarit/` (hors `menu/`) | Boris | lecture seule |
| `src/modules/erreurs/`, `src/modules/profil/` | Boris | lecture seule |
| `src/modules/tableaux-de-bord/pages/`, `registre.ts` | Boris | lecture seule |
| `src/modules/tableaux-de-bord/administration.tsx` | Boris | lecture seule |
| `src/modules/tableaux-de-bord/scolarite.tsx` | Alida | lecture seule |
| `src/modules/tableaux-de-bord/academique.tsx` | Fabrice | lecture seule |
| `src/routes/routes-communes.tsx` | Boris | lecture seule |
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
| Ajouter un bloc au tableau de bord | `src/modules/tableaux-de-bord/<lot>.tsx`, associés par `registre.ts` |
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

`npm run verifier` lance TypeScript, ESLint, Prettier et le contrôle des écrans. Si ça ne passe pas chez toi, ça ne passera pas en relecture.

Le contrôle des écrans (`outils/verifier-ecrans.mjs`) vérifie trois choses : chaque fichier de `pages/` est déclaré dans une table de routes, chaque entrée de menu pointe vers une route existante, et **chaque cible de navigation écrite dans le code** (`naviguer()`, `<Link to>`, `linkRoute`, `route`) correspond à une route déclarée. Ce troisième contrôle a révélé trois liens morts que les deux premiers laissaient passer.

**Un chemin fixe se déclare toujours avant un chemin paramétré.** `utilisateurs/permissions` avant `utilisateurs/:id`, `announcements/received` avant `announcements/:id`. Dans le cas contraire, le segment fixe est interprété comme un identifiant et la route n'est jamais atteinte. La même règle vaut pour les expressions régulières de la simulation, qui doivent en outre être ancrées avec `^`. Il existe parce qu'un module entier a été livré une fois sans être routé : le code compilait, le lint passait, et les écrans étaient inaccessibles. Un défaut invisible pour le compilateur doit être détecté par un contrôle explicite.

**Les chemins d'URL ne portent jamais d'accents.** `analyses/evolution`, pas `analyses/évolution`. Ils doivent rester copiables, saisissables au clavier et stables dans un lien partagé. Les libellés affichés, eux, sont accentués normalement.

Les PR vont vers `develop`, relues par au moins une autre personne. La description dit : ce qui est fait, les US couvertes, comment tester.

Un push par jour travaillé au minimum. Une branche qui vit plus de quatre jours sans être poussée est un risque.

---

## 6. Comment on écrit un écran

L'écran de référence est **`src/modules/utilisateurs/pages/ListeUtilisateurs.tsx`**. Copiez-le, ne réinventez rien. Il fait 120 lignes parce que le gabarit commun s'occupe du reste.

### La base commune, à utiliser systématiquement

Tout est exporté depuis `src/communs` :

```ts
import { GabaritListe, GabaritFiche, GabaritDocument } from '@/communs'
import { ChampRecherche, Pagination, BadgeStatut, LigneInfo, GrilleInfos } from '@/communs'
import { SelecteurClasse, SelecteurMatiere, SelecteurEnseignant, SelecteurPeriode } from '@/communs'
import { useDebounce, usePagination } from '@/communs'
import { formaterDate, formaterMontant, formaterMoyenne, formaterRang, formaterNomComplet } from '@/communs'
import { texteRequis, emailValide, telephoneValide, montantValide, motifRequis, noteValide } from '@/communs'
```

| Brique | Ce qu'elle vous évite |
|---|---|
| `GabaritListe` | Réécrire les quatre états, l'ordre des blocs et la pagination sur chaque liste |
| `GabaritFiche` | Réécrire les onglets. C'est ce qui permet à la fiche élève d'être alimentée par les trois lots |
| `GabaritDocument` | Réécrire l'en-tête institutionnel, le QR code, la référence et le format A4 |
| `BadgeStatut` | Choisir une couleur vous-même. La table statut → couleur est imposée par la charte |
| `SelecteurClasse` et les autres | Recoder un menu de classes qui ne filtrerait pas sur l'année courante |
| `formaterMontant`, `formaterMoyenne` | Trois façons différentes d'afficher `14,25` et `125 000 FCFA` |
| `useDebounce` | Un appel API à chaque frappe dans un champ de recherche |
| `useTri`, `useConfirmation` | Recréer les mêmes couples d'états sur chaque écran |
| `MenuActions` | La colonne d'actions à trois points, imposée par la charte |
| `GraphiqueLignes`, `GraphiqueBarres` | Configurer Recharts et retrouver les couleurs de la charte |
| `exporterCsv` | Un export illisible dans Excel français (séparateur et accents) |
| `Alerte` | Un bandeau maison. À réserver aux messages qui dépendent des données affichées |

**Si une brique vous manque, demandez-la à Boris. Ne la créez pas dans votre module.** Une fonction utile écrite dans `modules/eleves/` sera recopiée par les deux autres, et vous aurez trois versions divergentes.

Il montre déjà :

- les quatre états exigés (chargement, données, liste vide, erreur) ;
- les filtres avec recherche retardée ;
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

## 6 bis. Exigences de production

Get2School est destiné à être installé chez des établissements, pas à être montré une fois. Trois conséquences concrètes.

**Le français est correctement accentué.** Toute chaîne affichée à un utilisateur porte ses accents : « Désactiver », « Période », « Élève », « Barème », « Créé le ». Une interface sans accents passe pour un travail inachevé auprès d'un chef d'établissement. Les identifiants du code restent en anglais et sans accents, comme prévu section 9.

**Un contrôle qui n'existe que dans le navigateur n'est pas un contrôle.** Le composant `ExigeRole` masque un écran, il ne protège rien : la même règle devra exister côté Spring Boot. Même chose pour les validations Zod et pour l'isolation entre établissements. Quand vous écrivez une règle métier dans la simulation, écrivez-la comme le serveur devra le faire : refusez la requête, ne vous contentez pas de griser le bouton. Le module Années scolaires en donne l'exemple.

**Aucune action ne réussit en silence.** Une opération qui aboutit produit un toast. Une opération qui échoue affiche la raison, pas un message générique. Une action impossible est désactivée avec une infobulle qui dit pourquoi.

Un écart connu est documenté dans `docs/audit-production.md` : la journalisation d'audit est actuellement écrite par le client, ce qui n'est pas acceptable en exploitation. À traiter à l'arrivée du backend.

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
