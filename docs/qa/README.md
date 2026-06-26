# Quality Assurance — MacroZone

Documentation de test du projet MacroZone, versionnée avec le code source.

## Fichiers

| Fichier | Description |
|---|---|
| [MacroZone - Strategie et Plan de Test.md](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.md) | Document complet : stratégie, plan, cas de test, outils, planning |
| [MacroZone - Strategie et Plan de Test.docx](./MacroZone%20-%20Strategie%20et%20Plan%20de%20Test.docx) | Version Word (synthèse avec tableaux) |
| `generate-docx.js` | Script pour régénérer le `.docx` depuis le contenu structuré |

## Tests automatisés (à implémenter dans le repo)

```
macrozone/
├── __tests__/          # Jest — unitaires & API
├── maestro/flows/      # E2E mobile Android
└── fixtures/meals/     # Photos de test
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