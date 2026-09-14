# Journalisation d'audit : ce qui doit changer avant la mise en production

Ce document décrit un écart connu entre l'implémentation actuelle et ce qu'exige un système d'information scolaire en exploitation réelle. Il est à traiter avant la première installation chez un établissement.

---

## L'écart

Aujourd'hui, l'entrée d'audit est écrite **par le navigateur**, après l'opération métier :

```ts
// modules/<module>/api.ts
const { data } = await api.patch(`/users/${id}/status`, { isActive: false })
await journaliser({ action: 'USER_DEACTIVATE', ... })   // ← deuxième appel, côté client
```

Trois problèmes en découlent.

**L'opération peut réussir sans être tracée.** Si le second appel échoue, si le navigateur se ferme, si le réseau coupe entre les deux, le compte est désactivé et le journal n'en garde aucune trace. Or c'est exactement ce que RG-14 interdit.

**Le contenu de la trace vient du client.** Un utilisateur qui manipule les appels réseau peut écrire une entrée avec l'auteur, la date ou les valeurs de son choix. Un journal falsifiable n'a aucune valeur probante, et c'est précisément ce qu'on attend d'un journal d'audit lors d'un contrôle sur une modification de note ou un encaissement.

**La trace n'est pas atomique avec l'opération.** Il n'existe aucune garantie que les deux aient lieu ensemble.

Cette implémentation a été retenue parce qu'aucun backend n'existe encore : la simulation ne peut pas intercepter une opération qu'elle ne connaît pas. Elle ne doit pas survivre à l'arrivée de Spring Boot.

---

## La cible

L'audit est écrit **côté serveur, dans la même transaction que l'opération métier**. Le client n'écrit plus rien : il ne fait que lire le journal.

### Principe

```
@Transactional
  1. l'opération métier s'exécute
  2. l'entrée d'audit est insérée
  3. commit unique
```

Si l'insertion de l'audit échoue, l'opération métier est annulée. On préfère refuser une désactivation de compte plutôt que de l'effectuer sans trace.

### Mise en œuvre proposée

Une annotation portée par les méthodes de service, interceptée par un aspect :

```java
@Audite(action = ActionAudit.USER_DEACTIVATE, entite = "Utilisateur")
@Transactional
public Utilisateur desactiver(UUID id) { ... }
```

L'aspect capture :

| Champ | Origine |
|---|---|
| `userId`, `userLabel` | le jeton JWT, jamais le corps de la requête |
| `ipAddress` | `X-Forwarded-For` derrière Nginx, sinon l'adresse distante |
| `createdAt` | l'horloge du serveur, en UTC |
| `before` | l'entité chargée avant modification |
| `after` | l'entité après modification, dans la même transaction |
| `establishmentId` | le contexte de tenant, jamais un paramètre client |

### Immuabilité

RG-15 exige que le journal soit en lecture seule. Cela se garantit au niveau de la base, pas seulement dans le code :

- l'entité JPA est annotée `@Immutable`, sans `update` ni `delete` dans le repository ;
- le rôle applicatif PostgreSQL ne reçoit que `INSERT` et `SELECT` sur `audit_log` ;
- un trigger `BEFORE UPDATE OR DELETE` lève une exception ;
- les sauvegardes de cette table suivent la politique de conservation légale de l'établissement.

### Ce qui disparaît côté client

- `socle/services/journalAudit.ts` : supprimé
- tous les appels à `journaliser()` dans les fichiers `api.ts` des modules : supprimés
- l'endpoint `POST /api/v1/audit-logs` : n'existe pas côté Spring Boot

Seul `GET /api/v1/audit-logs` subsiste, réservé au rôle `SCHOOL_ADMIN` et filtré sur l'établissement du jeton.

---

## Autres points de sécurité à traiter en même temps

| Sujet | État actuel | Cible |
|---|---|---|
| Stockage du jeton | `localStorage` | cookie `HttpOnly`, `Secure`, `SameSite=Strict`, avec jeton de rafraîchissement |
| Validation | schémas Zod côté client uniquement | Bean Validation côté serveur, le client ne fait que du confort |
| Isolation multi-établissements | filtrée dans la simulation | filtre Hibernate global sur `establishment_id`, alimenté par le JWT, jamais par un paramètre de requête |
| Contrôle de rôle | composant `ExigeRole` | `@PreAuthorize` sur chaque méthode de service ; le garde client ne fait que masquer l'interface |
| Mots de passe | non vérifiés par la simulation | BCrypt (coût 12), politique de `communs/motDePasse.ts` répliquée en Bean Validation |
| Verrouillage après échecs | compteur en mémoire, perdu au rechargement | compteur persisté et partagé entre instances, sinon un redémarrage contourne la protection |
| Jetons de réinitialisation | `Map` en mémoire | table dédiée, jeton haché, usage unique, expiration 30 min, purge planifiée |
| Envoi du lien de réinitialisation | affiché dans la console du navigateur | courrier électronique, le lien n'apparaît jamais côté client |
| Sessions ouvertes | liste fictive | table de sessions avec identifiant d'appareil, révocation effective du jeton de rafraîchissement |
| Expiration d'inactivité | minuteur dans le navigateur | durée de vie courte du jeton d'accès, rafraîchissement explicite ; le minuteur client reste un confort |
| Journalisation des refus | `ACCESS_DENIED` écrit par le client | écrit par le filtre de sécurité Spring |

La règle commune à toutes ces lignes : **un contrôle qui n'existe que dans le navigateur n'est pas un contrôle.** Le client masque, le serveur interdit.
