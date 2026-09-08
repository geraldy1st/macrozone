# Backlog P0 -- Gaps repas / macros / persistance

Document de suivi ISTQB (priorité risque produit). Quatre items P0 livrés ou outillés dans la branche `test/p0-meal-gaps`.

## Items

| ID | Exigence | Couverture | Comment exécuter |
|----|---------|----------|---------------|
| **P0-1** | REQ-P0-01 + REQ-P0-03 — Ajout manuel + macros accueil | `maestro/flows/add-meal-manual.yaml` + testIDs `macro-grid` / `macro-calories*` | `bash scripts/run-maestro.sh maestro/flows/add-meal-manual.yaml` ou `npm run predeploy` |
| **P0-2** | REQ-P0-04 — Persistance après relance | `maestro/flows/meal-persistence-relaunch.yaml` | Inclus dans smoke guest predeploy ; ou `npm run test:e2e:meal:persist` |
| **P0-3** | REQ-P0-02 — Galerie + chemin IA | `maestro/flows/add-meal-gallery-ai.yaml` + fixture JPEG ; **hors** smoke | `npm run test:e2e:meal:gallery` |
| **P0-4** | CT-MEAL-11 + GAP-02 — Permissions caméra & Google Sign-In | Checklists manuelles | Voir ci-dessous |

## Checklists manuelles

```yaml
# Lire / exécuter sur device
docs/qa/checklist-camera-permissions-p0.md   # CT-MEAL-11
docs/qa/checklist-google-signin-p0.md        # GAP-02
```

## Scripts npm

| Script | Usage |
|--------|------|
| `npm run predeploy` | Jest + smoke Maestro guest (community, settings, add-meal-manual, **meal-persistence-relaunch**) |
| `npm run test:e2e:meal:manual` | Ajout manuel + assert macros |
| `npm run test:e2e:meal:persist` | Persistance stopApp / relaunch |
| `npm run test:e2e:meal:gallery` | Galerie / picker (flaky ; pas CI bloquant) |

## testIDs ajoutés

- `macro-grid`, `macro-calories`, `macro-calories-value`, `macro-protein`, `macro-carbs`, `macro-fat`
- `analyze-photo-btn`, `remove-photo-btn`
- `meal-protein-input`, `meal-carbs-input`, `meal-fat-input`

## Notes

- Pas de secrets dans git.
- Le flow galerie ne doit pas faire échouer le predeploy si Gemini / picker OEM est indisponible.
