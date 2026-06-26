# MacroZone — Stratégie de test & Plan de campagne QA

| Champ | Valeur |
|---|---|
| **Projet** | MacroZone |
| **Type** | Application mobile React Native / Expo (Android APK) + API Vercel |
| **Version app** | 1.0.0 |
| **Dépôt** | github.com/geraldy1st/macrozone |
| **API** | https://macrozone-navy.vercel.app/api/analyze-meal |
| **Date du document** | 26 juin 2026 |
| **Auteur** | Équipe MacroZone |
| **Statut** | Draft v1.0 |

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Stratégie de test](#2-stratégie-de-test)
3. [Périmètre et priorités](#3-périmètre-et-priorités)
4. [Pyramide de tests et outils](#4-pyramide-de-tests-et-outils)
5. [Comparaison Cypress / Selenium / Playwright](#5-comparaison-cypress--selenium--playwright)
6. [Plan de campagne par phases](#6-plan-de-campagne-par-phases)
7. [Cas de test détaillés](#7-cas-de-test-détaillés)
8. [Environnements et données de test](#8-environnements-et-données-de-test)
9. [Critères d'entrée et de sortie](#9-critères-dentrée-et-de-sortie)
10. [Gestion des risques](#10-gestion-des-risques)
11. [CI/CD et livrables](#11-cicd-et-livrables)
12. [Planning et budget effort](#12-planning-et-budget-effort)
13. [Prochaines actions](#13-prochaines-actions)

---

## 1. Contexte et objectifs

### 1.1 Description du produit

MacroZone est une application de suivi nutritionnel permettant de :

- Enregistrer des repas (manuellement ou via photo)
- Analyser une photo de repas avec l'IA (Google Gemini via API Vercel)
- Suivre les macros (calories, protéines, glucides, lipides)
- Personnaliser les objectifs macros
- Utiliser l'app en français et en anglais
- Stocker les données localement (AsyncStorage) et les photos (expo-file-system)

### 1.2 État actuel de la qualité

| Élément | État |
|---|---|
| Tests automatisés | Aucun |
| Tests manuels | Effectués à la main (APK preview EAS) |
| Bugs récents corrigés | Quota Gemini, URI galerie Android, sauvegarde photo, UI bouton submit |
| Lint | `expo lint` disponible |

### 1.3 Objectifs de la campagne QA

| Objectif | Indicateur de succès |
|---|---|
| Fiabilité des parcours critiques | 0 bug bloquant P0 en production |
| Stabilité de l'analyse IA | Taux de succès API > 95 % (hors quota) |
| Non-régression | Suite auto exécutée à chaque PR / merge |
| Confiance release | Checklist manuelle < 30 min avant chaque APK |
| Traçabilité | Chaque exigence P0 liée à au moins 1 cas de test |

---

## 2. Stratégie de test

### 2.1 Principes directeurs

1. **Tester en priorité ce qui apporte de la valeur utilisateur** — ajout repas, persistance, macros, IA.
2. **Séparer les tests déterministes des tests non déterministes** — l'IA Gemini ne doit pas bloquer la CI.
3. **Adapter les outils à la stack mobile** — Cypress/Selenium ne sont pas les outils principaux pour l'APK Android.
4. **Automatiser d'abord la logique métier** — storage, photos, parsing API (ROI rapide).
5. **Compléter avec E2E mobile ciblé** — 10–15 scénarios Maestro sur parcours P0.

### 2.2 Niveaux de test

| Niveau | Cible | Outil recommandé | Couverture cible |
|---|---|---|---|
| **Unitaire** | Fonctions pures, parsing, validation | Jest | 70 %+ sur utils/storage/API |
| **Intégration** | Modules + stockage + fichiers | Jest + mocks RN | Parcours data layer |
| **API** | Endpoint Vercel `/api/analyze-meal` | Jest (+ mock Gemini) | 100 % codes HTTP P0 |
| **E2E mobile** | Parcours utilisateur APK | Maestro | 10–15 scénarios P0/P1 |
| **E2E web** (optionnel) | Version `expo start --web` | Playwright | 5 scénarios max |
| **Manuel exploratoire** | UX, caméra, devices exotiques | Checklist | 1× par sprint |

### 2.3 Ce qu'on ne teste pas (hors périmètre v1)

- Performance charge API à grande échelle
- Tests de pénétration / audit sécurité complet
- Compatibilité iOS (non déployé actuellement)
- Précision nutritionnelle de l'IA (subjectif — disclaimer affiché)

---

## 3. Périmètre et priorités

### 3.1 Priorité P0 — Bloquant

| ID | Fonctionnalité | Écrans / modules |
|---|---|---|
| REQ-P0-01 | Ajout repas manuel (nom + calories) | `add-meals.tsx`, `meals.ts` |
| REQ-P0-02 | Ajout repas avec photo galerie + IA + save | `add-meals.tsx`, `photos.ts`, API |
| REQ-P0-03 | Affichage macros accueil après ajout | `index.tsx`, `MacroGrid.tsx` |
| REQ-P0-04 | Persistance après fermeture app | AsyncStorage |
| REQ-P0-05 | API : authentification X-API-Key | `api/analyze-meal.ts` |
| REQ-P0-06 | API : image trop grande rejetée | `api/lib/security.ts` |
| REQ-P0-07 | API : réponse JSON structurée valide | `api/analyze-meal.ts` |

### 3.2 Priorité P1 — Important

| ID | Fonctionnalité |
|---|---|
| REQ-P1-01 | Changement langue FR ↔ EN |
| REQ-P1-02 | Objectifs macros personnalisés (Settings) |
| REQ-P1-03 | Liste « Tous les repas » + suppression |
| REQ-P1-04 | Messages d'erreur IA (quota, réseau, 401) |
| REQ-P1-05 | Bouton « Ajouter le repas » toujours visible |
| REQ-P1-06 | Photo caméra (test manuel prioritaire) |

### 3.3 Priorité P2 — Secondaire

| ID | Fonctionnalité |
|---|---|
| REQ-P2-01 | Rappels notifications |
| REQ-P2-02 | Partage / copie macros |
| REQ-P2-03 | Citations motivantes |
| REQ-P2-04 | Rate limiting Upstash (si activé) |

---

## 4. Pyramide de tests et outils

### 4.1 Pyramide recommandée

```
                    ┌─────────────────────┐
                    │  E2E Mobile Maestro │  10–15 scénarios
                    │  (APK Android)      │
                    ├─────────────────────┤
                    │  Intégration Jest   │  storage, photos, client API
                    ├─────────────────────┤
                    │  Unitaire Jest      │  parseAnalysis, goals, i18n
                    └─────────────────────┘
         API Vercel (Jest) ──► en parallèle, pas dans la pyramide UI
         Manuel exploratoire ──► 1×/sprint, complément E2E
```

### 4.2 Stack outils recommandée pour MacroZone

| Couche | Outil | Verdict |
|---|---|---|
| Unitaire / intégration app | **Jest + React Native Testing Library** | ⭐ Recommandé |
| API Vercel | **Jest + mock fetch Gemini** | ⭐ Recommandé |
| E2E mobile Android | **Maestro** | ⭐ Recommandé |
| E2E web (optionnel) | Playwright | Complément |
| CI builds | **EAS Build + GitHub Actions** | ⭐ Recommandé |
| E2E cloud | Maestro Cloud | Option payante |
| Gestion cas de test | GitHub Issues + ce document | Suffisant solo |

### 4.3 Structure de dossiers suggérée (dans le repo macrozone)

```
macrozone/
├── __tests__/
│   ├── api/
│   │   └── analyze-meal.test.ts
│   ├── storage/
│   │   ├── meals.test.ts
│   │   └── goals.test.ts
│   └── utils/
│       ├── photos.test.ts
│       └── analyzeMeal.test.ts
├── maestro/
│   └── flows/
│       ├── add-meal-manual.yaml
│       ├── add-meal-gallery-ai.yaml
│       ├── delete-meal.yaml
│       └── settings-language.yaml
├── fixtures/
│   └── meals/              # 5 photos JPEG de référence
└── .github/workflows/
    └── test.yml
```

### 4.4 Scripts npm suggérés

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:api": "jest __tests__/api",
  "test:e2e": "maestro test maestro/flows"
}
```

---

## 5. Comparaison Cypress / Selenium / Playwright

### 5.1 Tableau comparatif

| Critère | Cypress | Selenium | Playwright | Maestro | Jest+RNTL |
|---|---|---|---|---|---|
| **Cible principale** | Web | Web (+ Appium mobile) | Web | Mobile natif | RN unit/component |
| **APK Android MacroZone** | ❌ Non | ⚠️ Via Appium | ❌ Non | ✅ Oui | N/A |
| **Courbe d'apprentissage** | Faible | Élevée | Faible | Très faible | Faible |
| **Galerie / caméra native** | ❌ | ⚠️ Complexe | ❌ | ✅ | Mock |
| **CI mobile** | ❌ | ⚠️ Lourd | ❌ | ✅ Cloud | ✅ Rapide |
| **Debug** | Excellent | Moyen | Excellent (trace) | Vidéo intégrée | Stack trace |
| **Coût** | Gratuit / Cloud payant | Gratuit | Gratuit | Gratuit / Cloud | Gratuit |

### 5.2 Verdict par outil

**Cypress**
- Utile uniquement si vous testez `expo start --web` (~20 % des features).
- Ne pilote pas l'APK Android, pas d'accès AsyncStorage ni galerie native.
- **Verdict : complément web seulement.**

**Selenium (+ Appium)**
- Standard entreprise, multi-plateforme.
- Configuration lourde (drivers, capabilities, émulateurs).
- **Verdict : viable si expertise existante, sinon Maestro est plus rapide.**

**Playwright**
- Excellent pour le web et les tests API via `request` context.
- Support mobile natif limité.
- **Verdict : bon complément pour API et version web, pas pour l'APK principal.**

**Maestro (recommandé E2E mobile)**
- Flows YAML lisibles, pas de code de test.
- Fonctionne sur APK installé, gère galerie, taps, assertions.
- **Verdict : outil E2E principal pour MacroZone.**

---

## 6. Plan de campagne par phases

### Phase 0 — Préparation (semaine 1)

| # | Tâche | Livrable | Responsable |
|---|---|---|---|
| 0.1 | Ajouter `testID` sur éléments UI critiques | PR `testIDs` | Dev |
| 0.2 | Installer Jest + React Native Testing Library | `npm run test` OK | Dev |
| 0.3 | Créer fixtures images repas (5 JPEG) | `fixtures/meals/` | QA/Dev |
| 0.4 | Installer Maestro localement | CLI fonctionnelle | QA |
| 0.5 | Créer 3 flows Maestro P0 | `maestro/flows/` | QA |
| 0.6 | Clé API test dédiée (optionnel) | Env Vercel preview | DevOps |

**testID à ajouter :**

| Élément | testID suggéré |
|---|---|
| Onglet Accueil | `home-tab` |
| Onglet Ajouter | `add-meal-tab` |
| Onglet Tous les repas | `all-meals-tab` |
| Onglet Paramètres | `settings-tab` |
| Bouton Scanner repas | `scan-meal-btn` |
| Champ nom repas | `meal-name-input` |
| Champ calories | `meal-calories-input` |
| Bouton Ajouter le repas | `add-meal-submit` |

### Phase 1 — Tests unitaires & intégration (semaine 2)

| Module | Fichiers | Nb cas cible |
|---|---|---|
| API analyze-meal | `api/analyze-meal.ts` | 8 |
| Sécurité API | `api/lib/security.ts` | 5 |
| Storage repas | `src/storage/meals.ts` | 6 |
| Storage objectifs | `src/storage/goals.ts` | 4 |
| Photos | `src/utils/photos.ts` | 6 |
| Client API | `src/utils/analyzeMeal.ts` | 5 |

**Critère de sortie Phase 1 :** `npm run test` passe à 100 %, couverture ≥ 60 % sur modules P0.

### Phase 2 — Tests E2E Maestro (semaine 3)

| Flow | Fichier | Priorité |
|---|---|---|
| Ajout repas manuel | `add-meal-manual.yaml` | P0 |
| Ajout repas galerie + IA | `add-meal-gallery-ai.yaml` | P0 |
| Suppression repas | `delete-meal.yaml` | P1 |
| Changement langue | `settings-language.yaml` | P1 |
| Persistance après relance | `persistence-relaunch.yaml` | P0 |

**Critère de sortie Phase 2 :** 5 flows P0 passent sur 1 device Android réel.

### Phase 3 — Tests manuels exploratoires (continu)

Checklist exécutée 1× par sprint ou avant chaque release APK (~25 min) :

- [ ] Installer APK preview frais (noter build ID)
- [ ] Scanner repas galerie (3 photos différentes)
- [ ] Prendre photo caméra
- [ ] Vérifier bouton « Ajouter le repas » entièrement visible
- [ ] Vérifier macros accueil = somme des repas
- [ ] Changer langue FR → EN, vérifier traductions
- [ ] Supprimer tous les repas
- [ ] Mode avion pendant analyse → message d'erreur clair
- [ ] Fermer app, rouvrir → données persistées

### Phase 4 — CI/CD (semaine 4)

| Étape | Déclencheur | Outil |
|---|---|---|
| Lint | Chaque PR | `expo lint` |
| Tests unitaires + API | Chaque PR | Jest (GitHub Actions) |
| Build APK preview | Merge `main` | EAS Build |
| E2E Maestro | Nightly ou post-merge | Maestro Cloud |
| Test IA réel (1 image) | 1×/jour hors PR | Script curl |

---

## 7. Cas de test détaillés

### 7.1 Tests API (TC-API)

| ID | Titre | Préconditions | Étapes | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| TC-API-01 | Auth manquante | API déployée | POST sans `X-API-Key` | HTTP 401 | P0 |
| TC-API-02 | Auth invalide | API déployée | POST avec clé incorrecte | HTTP 401 | P0 |
| TC-API-03 | Image valide FR | Clé valide, image repas base64 | POST `language: fr` | HTTP 200, JSON avec name/calories/protein/carbs/fat entiers | P0 |
| TC-API-04 | Image valide EN | Clé valide | POST `language: en` | HTTP 200, name en anglais | P1 |
| TC-API-05 | Image trop grande | Image > 2 Mo | POST | HTTP 413 | P0 |
| TC-API-06 | Body sans image | Clé valide | POST `{}` | HTTP 400 | P1 |
| TC-API-07 | Réponse Gemini invalide | Mock Gemini sans `name` | POST | HTTP 502 | P1 |
| TC-API-08 | Quota Gemini épuisé | Mock 429 Gemini | POST | HTTP 429 `AI quota exceeded` | P1 |
| TC-API-09 | Méthode GET | — | GET endpoint | HTTP 405 | P2 |
| TC-API-10 | OPTIONS CORS | — | OPTIONS | HTTP 200 + headers CORS | P2 |

### 7.2 Tests unitaires app (TC-UNIT)

| ID | Titre | Module | Résultat attendu | Priorité |
|---|---|---|---|---|
| TC-UNIT-01 | addMeal sans photo | `meals.ts` | Repas enregistré, pas de photoUri | P0 |
| TC-UNIT-02 | addMeal avec photo | `meals.ts` | photoUri persistant dans document | P0 |
| TC-UNIT-03 | deleteMeal supprime photo | `meals.ts` | Fichier photo supprimé | P1 |
| TC-UNIT-04 | getMeals ordre chronologique | `meals.ts` | Plus récent en premier | P1 |
| TC-UNIT-05 | normalize content:// URI | `photos.ts` | Retourne file:// valide | P0 |
| TC-UNIT-06 | saveMealPhoto crée Directory | `photos.ts` | Fichier dans meal-photos/ | P0 |
| TC-UNIT-07 | parseAnalysis borne calories | `analyze-meal.ts` | Max 10000, min 0 | P1 |
| TC-UNIT-08 | AnalyzeMealError 401 | `analyzeMeal.ts` | Code UNAUTHORIZED | P1 |
| TC-UNIT-09 | Objectifs par défaut | `goals.ts` | Valeurs defaultMacroGoals | P1 |
| TC-UNIT-10 | Changement langue i18n | `i18n` | Clé FR/EN résolue | P2 |

### 7.3 Tests E2E mobile Maestro (TC-E2E)

| ID | Titre | Flow | Priorité |
|---|---|---|---|
| TC-E2E-01 | Ajout repas manuel | `add-meal-manual.yaml` | P0 |
| TC-E2E-02 | Galerie + IA + save | `add-meal-gallery-ai.yaml` | P0 |
| TC-E2E-03 | Suppression repas | `delete-meal.yaml` | P1 |
| TC-E2E-04 | Changement langue FR→EN | `settings-language.yaml` | P1 |
| TC-E2E-05 | Persistance après relance | `persistence-relaunch.yaml` | P0 |
| TC-E2E-06 | Mode avion → erreur IA | `offline-analysis.yaml` | P1 |
| TC-E2E-07 | Bouton submit visible | Assertion sans scroll | P1 |
| TC-E2E-08 | Photo caméra | **Manuel** | P1 |

### 7.4 Exemple de flow Maestro

**Fichier : `maestro/flows/add-meal-manual.yaml`**

```yaml
appId: com.geraldy.macrozone
---
- launchApp
- tapOn:
    id: "add-meal-tab"
- tapOn:
    id: "meal-name-input"
- inputText: "Salade César"
- tapOn:
    id: "meal-calories-input"
- inputText: "450"
- tapOn:
    id: "add-meal-submit"
- assertVisible: "Repas ajouté avec succès"
- tapOn:
    id: "home-tab"
- assertVisible: "Salade César"
```

---

## 8. Environnements et données de test

### 8.1 Environnements

| Env | Usage | URL / Build |
|---|---|---|
| Local dev | Unit tests, dev manuel | `npx expo start` |
| API production | Tests API réels (limités) | macrozone-navy.vercel.app |
| APK preview EAS | E2E + manuel | Build profile `preview` |
| Device Android réel | Galerie, caméra, permissions | Min. 1 téléphone |

### 8.2 Jeu de données — photos repas (fixtures)

| Fichier | Contenu | Usage |
|---|---|---|
| `salade.jpg` | Salade verte claire | IA positive |
| `pates.jpg` | Plat de pâtes | IA positive |
| `burger.jpg` | Burger | IA macros élevées |
| `fruit.jpg` | Pomme/banane | IA calories basses |
| `vide.jpg` | Image 1×1 px ou assiette vide | IA « aucun plat » |
| `large.jpg` | Image > 2 Mo | Test rejet 413 |

### 8.3 Comptes et clés

| Secret | Où | Usage test |
|---|---|---|
| `EXPO_PUBLIC_MACROZONE_API_KEY` | EAS preview | App → API |
| `MACROZONE_API_KEY` | Vercel | Validation serveur |
| `GEMINI_API_KEY` | Vercel only | Analyse IA réelle |

> ⚠️ Ne jamais committer les clés. Utiliser `.env` (gitignored) et variables EAS/Vercel.

---

## 9. Critères d'entrée et de sortie

### 9.1 Critères d'entrée (début de campagne / sprint test)

- [ ] Build EAS `preview` installable (build ID noté)
- [ ] API Vercel déployée sur le commit testé
- [ ] Fixtures photos disponibles dans `fixtures/meals/`
- [ ] Au moins 1 device Android réel disponible
- [ ] Ce document à jour (version, date, périmètre)

### 9.2 Critères de sortie — Go Release APK

- [ ] 100 % des cas P0 passent (auto + manuel)
- [ ] 0 bug ouvert P0 / P1
- [ ] Rapport de test complété (date, build ID, commit hash, testeur)
- [ ] Temps moyen ajout repas avec IA < 15 secondes
- [ ] Checklist manuelle signée

### 9.3 Critères d'échec — No Go

- Bug P0 non corrigé (crash, perte données, IA/save bloqué)
- Régression sur ajout repas galerie
- API retourne 502 systématiquement
- Bouton submit non utilisable

---

## 10. Gestion des risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Quota Gemini épuisé en CI | Moyenne | Élevé | Mock API en CI ; test IA réel 1×/jour |
| URI `content://` Android expire | Faible (corrigé) | Élevé | Test `photos.ts` + E2E galerie |
| Tests E2E flaky (réseau, IA) | Élevée | Moyen | Séparer tests déterministes / non déterministes |
| Pas de `testID` dans l'UI | Actuelle | Moyen | Phase 0 : ajouter testIDs |
| AsyncStorage pollué entre tests | Moyenne | Faible | `beforeEach` clear storage |
| Caméra non automatisable | Élevée | Faible | Test manuel TC-E2E-08 |

---

## 11. CI/CD et livrables

### 11.1 Pipeline cible

```
Push GitHub → Lint → Jest (unit+API) → [PR merge] → EAS preview build → Maestro E2E → Rapport
```

### 11.2 Livrables de la campagne

| Livrable | Format | Emplacement |
|---|---|---|
| Stratégie & plan de test | .md + .docx | `docs/qa/` |
| Cas de test automatisés | `.test.ts` | `macrozone/__tests__/` |
| Flows E2E | `.yaml` | `macrozone/maestro/flows/` |
| Rapport d'exécution | Markdown / GitHub Issue | Par sprint |
| Checklist manuelle | Section 6 Phase 3 | Ce document |
| Matrice de traçabilité | Tableau §7 | Ce document |

### 11.3 Modèle de rapport d'exécution

```
# Rapport de test — MacroZone
Date :
Testeur :
Build EAS ID :
Commit :
APK URL :

Résumé :
- Cas exécutés : X
- Passés : X
- Échoués : X
- Bloqués : X

Bugs trouvés :
| ID | Sévérité | Description | Statut |

Décision : GO / NO GO
```

---

## 12. Planning et budget effort

| Phase | Durée estimée | Effort |
|---|---|---|
| Phase 0 — Préparation | 3–5 jours | Moyen |
| Phase 1 — Unit/API | 5–7 jours | Moyen |
| Phase 2 — Maestro E2E | 3–5 jours | Faible–moyen |
| Phase 3 — Manuel + rapport | 1–2 jours | Faible |
| Phase 4 — CI/CD | 2–3 jours | Moyen |
| **Total** | **~3–4 semaines** | À mi-temps |

---

## 13. Prochaines actions

Ordre recommandé pour démarrer l'implémentation dans le repo `macrozone` :

1. Installer Jest + React Native Testing Library
2. Écrire les premiers tests sur `meals.ts`, `photos.ts`, `analyze-meal.ts`
3. Ajouter les `testID` dans `add-meals.tsx` et les onglets
4. Créer 3 flows Maestro P0
5. Configurer GitHub Actions (lint + jest sur PR)
6. Exécuter la checklist manuelle avant chaque nouveau build EAS

---

## Annexe A — Matrice de traçabilité (extrait)

| Exigence | Cas de test | Automatisé | Priorité |
|---|---|---|---|
| REQ-P0-01 Ajout manuel | TC-E2E-01, TC-UNIT-01 | Oui | P0 |
| REQ-P0-02 Galerie + IA + save | TC-E2E-02, TC-UNIT-05/06 | Oui | P0 |
| REQ-P0-03 Macros accueil | TC-E2E-01 | Oui | P0 |
| REQ-P0-05 Auth API | TC-API-01/02 | Oui | P0 |
| REQ-P0-06 Image trop grande | TC-API-05 | Oui | P0 |
| REQ-P1-01 Langue FR/EN | TC-E2E-04 | Oui | P1 |
| REQ-P1-05 Bouton visible | TC-E2E-07 | Oui | P1 |

---

## Annexe B — Installation rapide des outils

```bash
# Jest + Testing Library (dans le repo macrozone)
npx expo install jest-expo @testing-library/react-native @testing-library/jest-native

# Maestro (macOS/Linux)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Lancer les tests
npm run test
maestro test maestro/flows
```

---

*Document généré pour le projet MacroZone — quality assurance v1.0*