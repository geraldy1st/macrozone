const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const tableWidth = 9360;

function cell(text, width, header = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: header
      ? { fill: "D5E8F0", type: ShadingType.CLEAR }
      : { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: header, size: 20 })],
      }),
    ],
  });
}

function table(headers, rows, colWidths) {
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => cell(h, colWidths[i], true)) }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((value, i) => cell(String(value), colWidths[i])),
          }),
      ),
    ],
  });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(text)],
  });
}

function heading(text, level) {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({ heading: map[level], children: [new TextRun(text)] });
}

function body(text) {
  return new Paragraph({ children: [new TextRun(text)] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "MacroZone",
              bold: true,
              size: 40,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Stratégie de test & Plan de campagne QA",
              size: 28,
            }),
          ],
        }),
        table(
          ["Champ", "Valeur"],
          [
            ["Projet", "MacroZone"],
            ["Type", "React Native / Expo + API Vercel"],
            ["Version", "1.0.0"],
            ["Dépôt", "github.com/geraldy1st/macrozone"],
            ["API", "macrozone-navy.vercel.app/api/analyze-meal"],
            ["Date", "26 juin 2026"],
            ["Statut", "Draft v1.0"],
          ],
          [2800, 6560],
        ),
        heading("1. Contexte et objectifs", 1),
        body(
          "MacroZone est une application mobile de suivi nutritionnel (Android APK via EAS) avec analyse IA des photos de repas via une API Vercel (Google Gemini). Aucun test automatisé n'est en place à ce jour.",
        ),
        heading("Objectifs de la campagne", 2),
        bullet("bullets", "Fiabilité des parcours critiques : 0 bug bloquant P0"),
        bullet("bullets", "Stabilité IA : taux de succès API > 95 % (hors quota)"),
        bullet("bullets", "Non-régression : suite auto à chaque PR"),
        bullet("bullets", "Checklist manuelle < 30 min avant chaque release APK"),
        heading("2. Stratégie de test", 1),
        heading("Principes directeurs", 2),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Tester en priorité les parcours à forte valeur utilisateur")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Séparer tests déterministes (CI) et tests IA (hors CI)")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Adapter les outils à la stack mobile React Native")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Automatiser d'abord la logique métier (storage, photos, API)")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Compléter avec 10–15 scénarios E2E Maestro")],
        }),
        heading("Niveaux de test", 2),
        table(
          ["Niveau", "Outil", "Cible"],
          [
            ["Unitaire", "Jest", "Fonctions pures, parsing, validation"],
            ["Intégration", "Jest + mocks RN", "Storage, photos, client API"],
            ["API", "Jest + mock Gemini", "Endpoint /api/analyze-meal"],
            ["E2E mobile", "Maestro", "Parcours APK Android"],
            ["E2E web (optionnel)", "Playwright", "Version expo web"],
            ["Manuel", "Checklist", "Caméra, UX, devices"],
          ],
          [2200, 2800, 4360],
        ),
        heading("3. Périmètre et priorités", 1),
        heading("P0 — Bloquant", 2),
        table(
          ["ID", "Fonctionnalité"],
          [
            ["REQ-P0-01", "Ajout repas manuel (nom + calories)"],
            ["REQ-P0-02", "Ajout repas galerie + IA + enregistrement"],
            ["REQ-P0-03", "Affichage macros sur l'accueil"],
            ["REQ-P0-04", "Persistance après fermeture app"],
            ["REQ-P0-05", "API : authentification X-API-Key"],
            ["REQ-P0-06", "API : rejet image > 2 Mo"],
            ["REQ-P0-07", "API : réponse JSON valide"],
          ],
          [2200, 7160],
        ),
        heading("P1 — Important", 2),
        bullet("bullets", "Changement langue FR / EN"),
        bullet("bullets", "Objectifs macros personnalisés"),
        bullet("bullets", "Liste et suppression des repas"),
        bullet("bullets", "Messages d'erreur IA"),
        bullet("bullets", "Bouton submit toujours visible"),
        bullet("bullets", "Photo caméra (test manuel)"),
        heading("4. Outils recommandés", 1),
        table(
          ["Outil", "Verdict MacroZone"],
          [
            ["Jest + React Native Testing Library", "Recommandé — unitaire/intégration"],
            ["Maestro", "Recommandé — E2E mobile APK"],
            ["Jest (API)", "Recommandé — tests API Vercel"],
            ["Playwright", "Complément — web et API"],
            ["Cypress", "Non recommandé — web only, pas APK"],
            ["Selenium / Appium", "Alternative — setup lourd"],
          ],
          [4200, 5160],
        ),
        heading("5. Plan de campagne par phases", 1),
        table(
          ["Phase", "Durée", "Livrables"],
          [
            ["Phase 0 — Préparation", "3–5 jours", "testIDs, Jest, Maestro, fixtures"],
            ["Phase 1 — Unit/API", "5–7 jours", "__tests__/ complet P0"],
            ["Phase 2 — E2E Maestro", "3–5 jours", "5 flows YAML"],
            ["Phase 3 — Manuel", "Continu", "Checklist sprint"],
            ["Phase 4 — CI/CD", "2–3 jours", "GitHub Actions + EAS"],
          ],
          [3000, 1800, 4560],
        ),
        heading("6. Cas de test API (extrait)", 1),
        table(
          ["ID", "Titre", "Résultat attendu", "Priorité"],
          [
            ["TC-API-01", "POST sans X-API-Key", "HTTP 401", "P0"],
            ["TC-API-02", "Clé invalide", "HTTP 401", "P0"],
            ["TC-API-03", "Image valide FR", "HTTP 200 + JSON", "P0"],
            ["TC-API-05", "Image > 2 Mo", "HTTP 413", "P0"],
            ["TC-API-08", "Quota Gemini", "HTTP 429", "P1"],
          ],
          [1600, 3200, 2960, 1600],
        ),
        heading("7. Cas de test E2E Maestro (extrait)", 1),
        table(
          ["ID", "Scénario", "Priorité"],
          [
            ["TC-E2E-01", "Ajout repas manuel", "P0"],
            ["TC-E2E-02", "Galerie + IA + save", "P0"],
            ["TC-E2E-03", "Suppression repas", "P1"],
            ["TC-E2E-04", "Changement langue", "P1"],
            ["TC-E2E-05", "Persistance après relance", "P0"],
            ["TC-E2E-08", "Photo caméra", "P1 (manuel)"],
          ],
          [1800, 5760, 1800],
        ),
        heading("8. Critères Go / No Go release", 1),
        heading("Go Release", 2),
        bullet("bullets", "100 % des cas P0 passent"),
        bullet("bullets", "0 bug ouvert P0/P1"),
        bullet("bullets", "Rapport de test complété (build ID, commit)"),
        bullet("bullets", "Temps ajout repas IA < 15 secondes"),
        heading("No Go", 2),
        bullet("bullets", "Crash ou perte de données"),
        bullet("bullets", "Régression ajout repas galerie"),
        bullet("bullets", "API 502 systématique"),
        heading("9. Prochaines actions", 1),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Installer Jest + React Native Testing Library")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Tests sur meals.ts, photos.ts, analyze-meal.ts")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Ajouter testID sur les écrans critiques")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("Créer 3 flows Maestro P0")],
        }),
        new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun("GitHub Actions : lint + jest sur PR")],
        }),
        body(""),
        body("Document complet disponible en Markdown : MacroZone - Strategie et Plan de Test.md"),
        body("quality assurance v1.0 — 26 juin 2026"),
      ],
    },
  ],
});

const outPath = path.join(
  __dirname,
  "MacroZone - Strategie et Plan de Test.docx",
);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath);
});