# Maestro E2E — nutriFlow

Flows de test mobile pour l'APK Android (`com.geraldy.macrozone`).

## Prérequis

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Installer l'APK preview sur un émulateur ou device connecté.

## Lancer les tests

```bash
npm run test:e2e
```

Ou un flow précis :

```bash
maestro test maestro/flows/add-meal-manual.yaml
```

## Flows P0

| Fichier | Scénario |
|---|---|
| `add-meal-manual.yaml` | Ajout repas manuel + vérification accueil |
| `delete-meal.yaml` | Suppression d'un repas |
| `settings-language.yaml` | Changement de langue FR/EN |

> Le flow galerie + IA (`add-meal-gallery-ai.yaml`) sera ajouté quand un mock API ou fixture image stable sera configuré pour la CI.