# Quality Assurance — MacroZone

Documentation de test du projet MacroZone, versionnée avec le code source.

## Fichiers

| Fichier | Description |
|---|---|
| [MacroZone - Strategie et Plan de Test.md](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.md) | Document complet : stratégie, plan, cas de test, outils, planning |
| [MacroZone - Strategie et Plan de Test.docx](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.docx) | Version Word (synthèse avec tableaux) |
| `generate-docx.js` | Script pour régénérer le `.docx` depuis le contenu structuré |

## Tests automatisés (implémentés)

```
macrozone/
├── __tests__/          # Jest — 29 tests (API, storage, client)
├── maestro/flows/      # 3 flows E2E P0/P1
└── .github/workflows/  # CI lint + jest
```

```bash
npm test              # tous les tests Jest
npm run test:api      # tests API uniquement
npm run test:e2e      # Maestro (device/émulateur requis)
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