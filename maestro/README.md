# Maestro E2E — nutriFlow (A007c)

Flows de test mobile pour l’APK Android (`com.geraldy.macrozone`).

## Prérequis

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Installer le dernier APK preview sur un device / émulateur.

## Avant chaque déploiement

```bash
npm run predeploy
```

| Situation | Comportement |
|-----------|----------------|
| Toujours | Jest unit tests |
| Device + app installés | Smoke Maestro (guest) |
| `RUN_FULL_E2E=1` | + auth Faker + community share/like/comment |
| `SKIP_MAESTRO=1` | Jest seulement |

```bash
# Smoke + unit (recommandé avant push)
npm run predeploy

# Suite e2e complète (device + Supabase)
npm run test:e2e:full
```

## Utilisateur de test (Faker)

```bash
eval $(node maestro/generate-test-user.cjs)
echo $EMAIL $PASSWORD $DISPLAY_NAME $MEAL_NAME
```

Variables exportées :

| Variable | Usage |
|----------|--------|
| `EMAIL` | Signup / login |
| `PASSWORD` | Mot de passe valide |
| `WRONG_PASSWORD` | Login en échec |
| `DISPLAY_NAME` | Nom profil |
| `MEAL_NAME` | Repas Community |
| `COMMENT_TEXT` | Commentaire |

## Lancer les flows

```bash
# Auth — création de compte
npm run test:e2e:auth

# Auth — mauvais mot de passe
npm run test:e2e:auth:wrong

# Auth — suppression de compte (destructif)
npm run test:e2e:auth:delete

# Community — invité (feed)
npm run test:e2e:community

# Community — share + like + comment + delete post
npm run test:e2e:community:full
```

Manuellement :

```bash
bash scripts/run-maestro-with-user.sh maestro/flows/community-share-like-comment.yaml
```

## Alert buttons (share / delete)

Les dialogues utilisent le texte i18n :

| Action | EN | FR | ES |
|--------|----|----|-----|
| Share now | Share | Partager | Compartir |
| Later | Not now | Plus tard | Ahora no |
| Confirm delete | Delete | Supprimer | Eliminar |

## Catalogue des flows

| Fichier | Scénario |
|---------|----------|
| `subflows/signup-and-open-app.yaml` | Signup + save profile |
| `auth-signup-login.yaml` | Création de compte (Faker) |
| `auth-login-success.yaml` | Connexion |
| `auth-login-wrong-password.yaml` | Échec login |
| `auth-delete-account.yaml` | Delete account |
| `community-smoke.yaml` | Onglet Community (invité) |
| `community-share-like-comment.yaml` | Share / like / comment / delete |
| `settings-account.yaml` | Settings Account (invité) |
| `add-meal-manual.yaml` | Ajout repas manuel |
| `delete-meal.yaml` | Suppression repas |
| `settings-language.yaml` | Langue |

## Ajouter un nouveau cas de test

1. Ajouter des `testID` stables dans l’UI (ex. `testIndex` pour le feed).
2. Créer `maestro/flows/mon-cas.yaml`.
3. Documenter ici.
4. Si smoke critique : l’ajouter dans `scripts/predeploy.sh`.
5. Si besoin d’un user unique : utiliser `run-maestro-with-user.sh`.

## Notes

- Les flows Community **full** nécessitent les tables Supabase (`posts`, `likes`, `comments`, `profiles`) et le réseau.
- `clearState: true` sur signup évite les sessions résiduelles.
- Après un build EAS, réinstalle l’APK avant de relancer Maestro.
