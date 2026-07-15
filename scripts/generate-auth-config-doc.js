const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const SUPABASE_PROJECT = "fkxyydxupseaontihoss";
const SUPABASE_URL = `https://${SUPABASE_PROJECT}.supabase.co`;
const REDIRECT_URI = "macrozone://auth/callback";
const GOOGLE_CALLBACK = `${SUPABASE_URL}/auth/v1/callback`;
const OUTPUT = path.join(
  __dirname,
  "..",
  "docs",
  "nutriFlow - Configuration Authentification.docx",
);

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    ...opts,
    children: [new TextRun(text)],
  });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}

function codeLine(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Courier New", size: 20 })],
  });
}

function linkPara(label, url) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun(`${label} `),
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text: url, style: "Hyperlink" })],
      }),
    ],
  });
}

function tableRow(cells, header = false) {
  const width = 9360;
  const colWidths = [3200, 6160];
  return new TableRow({
    children: cells.map((text, index) =>
      new TableCell({
        borders,
        width: { size: colWidths[index], type: WidthType.DXA },
        margins: cellMargins,
        shading: {
          fill: header ? "D5E8F0" : "FFFFFF",
          type: ShadingType.CLEAR,
        },
        children: [new Paragraph({ children: [new TextRun(text)] })],
      }),
    ),
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
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
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun("nutriFlow — Configuration authentification — Page "),
                new TextRun({ children: [PageNumber.CURRENT] }),
              ],
            }),
          ],
        }),
      },
      children: [
        heading("nutriFlow — Guide de configuration de l'authentification"),
        para(
          "Ce document décrit la configuration à effectuer dans Supabase et Google Cloud pour que l'inscription, la confirmation par e-mail, la connexion Google et la récupération de mot de passe fonctionnent correctement dans l'application mobile nutriFlow.",
        ),
        para("Date : mars 2026 — Offre gratuite Supabase"),
        para(
          "Important : si un lien reçu par e-mail ne fonctionne pas, la cause est presque toujours une URL de redirection mal configurée dans Supabase (par exemple localhost:3000 au lieu du deep link de l'application).",
          { spacing: { after: 240 } },
        ),

        heading("1. Informations du projet", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3200, 6160],
          rows: [
            tableRow(["Élément", "Valeur"], true),
            tableRow(["Nom de l'application", "nutriFlow"]),
            tableRow(["Slug Expo / EAS", "macrozone"]),
            tableRow(["Scheme (deep link)", "macrozone"]),
            tableRow(["URI de redirection auth", REDIRECT_URI]),
            tableRow(["Package Android", "com.geraldy.macrozone"]),
            tableRow(["Bundle iOS", "com.geraldy.macrozone"]),
            tableRow(["URL Supabase", SUPABASE_URL]),
            tableRow(["Callback Google (Supabase)", GOOGLE_CALLBACK]),
          ],
        }),
        new Paragraph({ spacing: { after: 240 }, children: [] }),

        heading("2. Configuration Supabase — URLs (étape la plus critique)", HeadingLevel.HEADING_2),
        para(
          "Menu : Authentication → URL Configuration dans le tableau de bord Supabase.",
        ),
        linkPara("Tableau de bord :", `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/url-configuration`),
        heading("2.1 Site URL", HeadingLevel.HEADING_2),
        bullet("bullets", "Remplacez http://localhost:3000 par la valeur suivante :"),
        codeLine(REDIRECT_URI),
        heading("2.2 Redirect URLs", HeadingLevel.HEADING_2),
        bullet("bullets", "Ajoutez explicitement cette URL dans la liste (une ligne par URL) :"),
        codeLine(REDIRECT_URI),
        bullet(
          "bullets",
          "Ne supprimez pas l'URL Google de Supabase si elle existe déjà ; elle est utilisée en interne par OAuth.",
        ),
        para(
          "Sans cette configuration, les liens des e-mails (confirmation, mot de passe oublié) et Google OAuth redirigent vers localhost:3000 et affichent « Ce site est inaccessible ».",
        ),

        heading("3. E-mails : inscription et mot de passe oublié", HeadingLevel.HEADING_2),
        para("Menu : Authentication → Providers → Email"),
        linkPara("Lien direct :", `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/providers`),
        bullet("numbers", "Activez le provider Email."),
        bullet("numbers", "Activez « Confirm email » pour l'inscription par e-mail et mot de passe."),
        bullet("numbers", "Désactivez « Confirm email » uniquement si vous acceptez que les comptes soient utilisables sans confirmation (non recommandé en production)."),
        heading("3.1 Modèles d'e-mails", HeadingLevel.HEADING_2),
        para("Menu : Authentication → Email Templates"),
        linkPara("Lien direct :", `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/templates`),
        bullet("bullets", "Vérifiez le template « Confirm signup » : le lien doit utiliser la variable {{ .ConfirmationURL }} fournie par Supabase."),
        bullet("bullets", "Vérifiez le template « Reset password » : le lien doit utiliser {{ .ConfirmationURL }} (ou l'équivalent du template)."),
        bullet("bullets", "Ne remplacez pas {{ .ConfirmationURL }} par une URL fixe type localhost."),
        heading("3.2 Envoi d'e-mails (offre gratuite)", HeadingLevel.HEADING_2),
        bullet("bullets", "Supabase envoie les e-mails via son service par défaut (limité en volume)."),
        bullet("bullets", "Les e-mails peuvent arriver en retard ou en dossier spam / promotions."),
        bullet("bullets", "Pour une meilleure délivrabilité, configurez un SMTP personnalisé (Resend, Brevo, SendGrid…) dans Project Settings → Authentication → SMTP Settings (optionnel sur offre gratuite)."),
        heading("3.3 Pourquoi le lien « mot de passe oublié » ne fonctionne pas", HeadingLevel.HEADING_2),
        bullet("numbers", "L'e-mail est bien envoyé : le problème vient en général du lien généré, pas de l'envoi."),
        bullet("numbers", "Le lien doit ouvrir l'application via macrozone://auth/callback?..."),
        bullet("numbers", "Si Site URL ou Redirect URLs pointent vers localhost, le lien dans l'e-mail sera incorrect."),
        bullet("numbers", "Corrigez la section 2, renvoyez un e-mail de réinitialisation, puis testez sur le téléphone avec l'APK installé (pas dans un navigateur desktop seul)."),

        heading("4. Connexion Google (OAuth)", HeadingLevel.HEADING_2),
        heading("4.1 Supabase", HeadingLevel.HEADING_2),
        para("Menu : Authentication → Providers → Google"),
        bullet("numbers", "Activez le provider Google."),
        bullet("numbers", "Renseignez le Client ID et le Client Secret créés dans Google Cloud (section 4.2)."),
        bullet("numbers", "Enregistrez les modifications."),
        heading("4.2 Google Cloud Console", HeadingLevel.HEADING_2),
        linkPara("Console :", "https://console.cloud.google.com/"),
        bullet("numbers", "Créez ou ouvrez un projet Google Cloud."),
        bullet("numbers", "APIs & Services → OAuth consent screen :"),
        bullet("bullets", "Type : External (ou Internal si compte Google Workspace)."),
        bullet("bullets", "App name : nutriFlow (c'est le nom affiché en haut de l'écran Google)."),
        bullet("bullets", "User support email et Developer contact : votre adresse."),
        bullet("numbers", "APIs & Services → Credentials → Create Credentials → OAuth client ID :"),
        bullet("bullets", "Application type : Web application."),
        bullet("bullets", "Authorized redirect URIs — ajoutez exactement :"),
        codeLine(GOOGLE_CALLBACK),
        bullet("numbers", "Copiez le Client ID et le Client Secret dans Supabase (section 4.1)."),
        heading("4.3 Nom affiché pendant la connexion Google", HeadingLevel.HEADING_2),
        para(
          "Sur l'offre gratuite Supabase, Google affiche aussi le domaine fkxyydxupseaontihoss.supabase.co car c'est lui qui reçoit l'autorisation OAuth. Le nom nutriFlow apparaît dans le titre de l'écran de consentement, mais l'URL Supabase reste visible : c'est normal et ne peut pas être entièrement masqué sans domaine personnalisé Supabase (offre payante).",
        ),

        heading("5. Variables d'environnement (EAS / Expo)", HeadingLevel.HEADING_2),
        para("Vérifiez que ces variables sont définies dans EAS (profil preview) :"),
        bullet("bullets", "EXPO_PUBLIC_SUPABASE_URL"),
        bullet("bullets", "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
        codeLine(SUPABASE_URL),
        para("Menu EAS : expo.dev → projet macrozone → Environment variables → preview"),

        heading("6. Checklist de test sur téléphone", HeadingLevel.HEADING_2),
        bullet("numbers", "Installer le dernier APK EAS (build contenant le scheme macrozone)."),
        bullet("numbers", "Inscription e-mail → recevoir l'e-mail → cliquer le lien → l'app s'ouvre → compte confirmé."),
        bullet("numbers", "Connexion e-mail + mot de passe après confirmation."),
        bullet("numbers", "Mot de passe oublié → e-mail → lien → écran « Nouveau mot de passe » dans l'app."),
        bullet("numbers", "Connexion Google → retour dans l'app (pas de page localhost)."),
        heading("7. Dépannage rapide", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3200, 6160],
          rows: [
            tableRow(["Symptôme", "Solution probable"], true),
            tableRow([
              "Page localhost:3000 inaccessible",
              "Corriger Site URL et Redirect URLs (section 2)",
            ]),
            tableRow([
              "E-mail reçu mais lien inactif",
              "Vérifier Redirect URLs + tester sur mobile avec APK",
            ]),
            tableRow([
              "Google OAuth échoue",
              "Vérifier redirect URI Google = callback Supabase (section 4.2)",
            ]),
            tableRow([
              "E-mail jamais reçu",
              "Vérifier spam ; limites Supabase ; activer Confirm email",
            ]),
            tableRow([
              "URL Supabase visible chez Google",
              "Normal sur offre gratuite ; nom nutriFlow dans OAuth consent screen",
            ]),
          ],
        }),
        new Paragraph({ spacing: { before: 240 }, children: [] }),
        para(
          "Document généré pour le projet macrozone / nutriFlow. Aucune modification de code n'est requise si cette configuration est correctement appliquée.",
        ),
      ],
    },
  ],
});

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Created: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});