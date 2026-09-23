# Suite de régression fonctionnelle

Neuf scripts : un par lot (A, B, C), un pour les systèmes transversaux
(documents, chronogramme, abonnement, onboarding, multi-établissement), un
pour la deuxième vague de modules (modèles documentaires, notifications,
recherche globale, matrice de permissions, emploi du temps, sanctions,
absences, authentification), un pour les onglets Affectations des fiches
classe et enseignant, un pour les sessions actives, un pour la troisième
vague (annonces, archivage, transfert, génération en lot par classe, cycle
de vie d'une année), un pour le correctif d'expiration d'abonnement. Chacun
s'exécute contre la simulation en mémoire (`socle/simulation`), pas contre
un vrai serveur : ils documentent le contrat métier attendu, à reproduire
fidèlement côté backend — pas des tests d'intégration au sens strict.

Exécution (depuis la racine du projet, après `npm install`) :

```bash
npm i -D jsdom --silent   # dépendance de test uniquement, pas de l'application
for f in audits/audit-*.mjs; do node "$f"; done
npm uninstall jsdom --silent
```

Chaque script affiche OK/FAIL ligne par ligne, avec le détail exact vérifié —
jamais juste « n'a pas planté ». Le total de chaque lot est affiché à la fin.

État au dernier passage : 89/89 vérifications réussies, plus une vérification
structurelle séparée confirmant que les 32 entrées de menu correspondent
exactement aux rôles appliqués sur chaque route.

## Défauts réels trouvés et corrigés grâce à cette suite

- `fairelAppel` : faute de frappe dans un nom de fonction exportée (module
  Absences), corrigée en `faireAppel`.
- La génération de documents ne renvoyait jamais `targetLabel`, contrairement
  aux endpoints de liste — incohérence de contrat corrigée.
- **Un compte pouvait modifier son propre rôle, ses propres permissions ou
  son propre statut actif/inactif par un appel direct à l'API**, malgré
  l'interdiction affichée à l'écran. Corrigée sur les trois endpoints
  concernés.
- **Les onglets Affectations des fiches classe et enseignant n'ont jamais
  été construits** alors que leur propre commentaire d'en-tête le promettait
  explicitement. Les deux onglets existent maintenant.
- **Les sessions actives étaient entièrement décoratives.** Remplacé par un
  suivi réel, avec une limite du mock assumée et documentée en commentaire.
- **Retirer une annonce était journalisé sous le même code que la
  publication** (`ANNOUNCEMENT_PUBLISH`), contrairement à toutes les autres
  paires créer/annuler du projet qui ont chacune deux codes distincts. Ajout
  de `ANNOUNCEMENT_WITHDRAW`.
- **Un abonnement actif ne vérifiait jamais sa propre date d'expiration** :
  `expireLe` était enregistré à la souscription mais jamais consulté nulle
  part — un abonnement, une fois actif, ne s'arrêtait donc jamais vraiment,
  contredisant la règle explicite « l'abonnement se termine quand l'année
  scolaire se termine ». Corrigé dans le moteur de calcul, avec un premier
  correctif encore imparfait (coupait l'accès dès minuit du jour d'échéance
  plutôt qu'à la fin de cette journée) trouvé et corrigé par le test suivant
  immédiatement après.
- `abonnementExpireLe` : une fonction identité, définie mais jamais appelée
  nulle part dans le projet. Retirée.

## Modules non encore couverts

Écran d'assistant de configuration hérité (`etablissement/configuration`,
volontairement hors menu, voir le README principal). Aucun rendu visuel réel
(souris, clavier) n'a été vérifié — uniquement la couche données.
