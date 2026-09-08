# Checklist manuelle — Permissions caméra / galerie (CT-MEAL-11)

**Priorité :** P0  
**Type :** Test manuel exploratoire / confirmation (ISTQB — confirmation testing)  
**Objectif :** Vérifier que le parcours Scan repas demande, respecte et récupère correctement les permissions Android (caméra + photos).

## Préconditions

- [ ] APK preview installé (`com.geraldy.macrozone`)
- [ ] Compte **authentifié** (le scan IA n'est pas proposé aux invités)
- [ ] Permissions caméra / photos **réinitialisées** pour l'app (Paramètres Android → Apps → nutriFlow / MacroZone → Permissions)

## Procédure

| Étape | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 1 | Ouvrir **Ajouter un repas** → tap **Scan meal** (`scan-meal-btn`) | Dialogue Take Photo / Choose from Gallery (i18n EN/FR/ES) | [ ] |
| 2 | Choisir **Prendre une photo** | Prompt permission caméra système | [ ] |
| 3 | Refuser la permission | Message d'échec clair ; pas de crash ; retour écran ajout | [ ] |
| 4 | Retenter Scan → Take Photo → **Autoriser** | Caméra s'ouvre | [ ] |
| 5 | Prendre une photo | Aperçu + boutons `analyze-photo-btn` / `remove-photo-btn` | [ ] |
| 6 | Tap **Supprimer la photo** | Aperçu disparait | [ ] |
| 7 | Scan → **Choisir dans la galerie** (permission photos refusée) | Prompt permission ; refus sans crash | [ ] |
| 8 | Autoriser photos / médias → sélectionner une image | Aperçu + `analyze-photo-btn` visible | [ ] |
| 9 | (Optionnel réseau) Tap Analyser avec l'IA | Macros préremplies **ou** message d'erreur IA non bloquant | [ ] |
| 10 | Révoquer permission en cours d'usage (Paramètres) puis revenir | App stable ; prochain scan redemande ou guide vers réglages | [ ] |

## Critères de réussite

- Aucun crash / ANR
- Pas de permission silencieuse (opt-in utilisateur)
- Chemins refus / autorisation couverts
- UI analyse / suppression accessible après sélection photo

## Traçabilité

- REQ-P0-02 (galerie + IA)
- CT-MEAL-11
- Flow automatisé partiel : `maestro/flows/add-meal-gallery-ai.yaml` (hors smoke)
