# Checklist manuelle — Google Sign-In (GAP-02)

**Priorité :** P0 (GAP documenté)  
**Type :** Test manuel d'acceptation / confirmation  
**Objectif :** Valider le parcours OAuth Google sans stocker de secrets dans le dépôt.

## Compte de test (placeholders — ne pas committer de vrais identifiants)

| Champ | Valeur |
|-------|--------|
| Compte Google de test | `TEST_GOOGLE_ACCOUNT@example.com` |
| Mot de passe | *hors git — coffre-équipe / secrets manager* |
| Project OAuth / Web client | *voir `.env.example` / config Expo AuthSession* |
| SHA-1 debug / release | *EAS / Play Console — ne pas coller de clés ici* |

> **Règle :** aucun secret, token, refresh token ou mot de passe dans git, tickets publics ou captures d'écran commitées.

## Préconditions

- [ ] Build avec Google Sign-In configuré (`@react-native-google-signin/google-signin` / AuthSession)
- [ ] Device ou émulateur avec Play Services
- [ ] Session app déconnectée (`clearState` / Sign out)

## Procédure

| Étape | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 1 | Welcome / Login → **Continuer avec Google** (libellé i18n) | Feuille / écran compte Google | [ ] |
| 2 | Sélectionner `TEST_GOOGLE_ACCOUNT@example.com` | Consentement OAuth si première fois | [ ] |
| 3 | Accepter | Retour app connectée ; onglets principaux visibles | [ ] |
| 4 | Ouvrir Profile / Settings → Account | Identité cohérente (email / display name) | [ ] |
| 5 | Vérifier avatar (TC-AVATAR-03) | Pas de photo `googleusercontent` imposée ; initiales si pas de photo app | [ ] |
| 6 | Sign out | Retour welcome / état déconnecté | [ ] |
| 7 | Reconnexion Google | Session rétablie sans crash | [ ] |
| 8 | Annuler le flux OAuth (back / dismiss) | App stable ; pas de session partielle corrompue | [ ] |
| 9 | (Négatif) Réseau coupé pendant OAuth | Erreur gérée ; pas de crash | [ ] |

## Critères de réussite

- Connexion / déconnexion Google fiables
- Aucune fuite de credential dans logs commités
- Cohérence avatar (GAP avatar / TC-AVATAR)

## Non-couverture auto

Ce GAP reste **manuel** : pas de flow Maestro Google Sign-In dans le smoke predeploy (dépendances compte + Play Services).

## Traçabilité

- GAP-02
- TC-AVATAR-03
