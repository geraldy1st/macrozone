# Quality Assurance — MacroZone

Documentation de test du projet MacroZone, versionnée avec le code source.

## Fichiers

| Fichier | Description |
|---|---|
| [MacroZone - Strategie et Plan de Test.md](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.md) | Document complet : stratégie, plan, cas de test, outils, planning |
| [MacroZone - Strategie et Plan de Test.docx](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.docx) | Version Word (synthèse avec tableaux) |
| `generate-docx.js` | Script pour régénérer le `.docx` depuis le contenu structuré |
| [BACKLOG-P0.md](./BACKLOG-P0.md) | Backlog P0 repas / macros / persistance |
| [checklist-camera-permissions-p0.md](./checklist-camera-permissions-p0.md) | CT-MEAL-11 permissions camera/galerie |
| [checklist-google-signin-p0.md](./checklist-google-signin-p0.md) | GAP-02 OAuth Google (placeholders) |

## Tests automatisés (implémentés)

```
macrozone/
├── __tests__/          # Jest — 29 tests (API, storage, client)
├── maestro/flows/      # flows E2E P0/P1 (manual, persist, gallery)
└── .github/workflows/  # CI lint + jest
```

```bash
npm test              # tous les tests Jest
npm run test:api      # tests API uniquement
npm run test:e2e      # Maestro (device/émulateur requis)
npm run test:e2e:meal:manual
npm run test:e2e:meal:persist
npm run test:e2e:meal:gallery   # hors smoke predeploy
```

## Régénérer le fichier Word

```bash
cd docs/qa
npm install docx
node generate-docx.js
```

## Liens utiles

- API : https://macrozone-navy.vercel.app/api/analyze-meal
- Builds EAS : https://expo.dev/accounts/geraldy/projects/macrozone/builds
