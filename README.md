# DUT-OIC — Proof of Concept

Preuve de concept du **Document Unique de Transport (DUT)** de l'Office Ivoirien
des Chargeurs (OIC). Démontre le passage d'un document papier à imprimer vers un
**système d'information sécurisé, traçable et exploitable** du transport routier
de marchandises en Côte d'Ivoire.

## Objectif de la démonstration

Suivre un même DUT de bout en bout :

```
PARTENAIRE → CRÉATION → BROUILLON → SOUMISSION → ANTENNE OIC → (REJET → CORRECTION)
→ VALIDATION → NUMÉRO OFFICIEL → QR CODE → PDF → CONTRÔLE TERRAIN
→ JOURNAL D'AUDIT → STATISTIQUES OIC
```

## Stack technique

100 % statique, zéro backend, zéro build :

- HTML5 / CSS3 / JavaScript vanilla (ES Modules)
- LocalStorage comme unique source de données (simule le futur système central)
- [Chart.js 4](https://www.chartjs.org/) — graphiques du dashboard national
- [Leaflet 1.9](https://leafletjs.com/) + OpenStreetMap — carte des antennes
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) — génération des QR codes
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — scan caméra (avec repli manuel)
- [jsPDF](https://github.com/parallax/jsPDF) — génération du PDF officiel
- [anime.js v4](https://animejs.com/) — micro-interactions (compteurs KPI, apparition en cascade), vendorisé localement dans `js/vendor/anime.iife.min.js`, respecte `prefers-reduced-motion`

Toutes les librairies sont chargées depuis cdnjs.cloudflare.com, sauf anime.js
(fichier local, aucune dépendance réseau pour cette partie). Aucune installation requise.

## Lancer le POC

```bash
cd DUT
python3 -m http.server 8080
```

Puis ouvrir : **http://localhost:8080**

Aucune étape de compilation n'est nécessaire. Une connexion Internet est requise
au premier chargement pour les CDN (Chart.js, Leaflet, QRCode.js, html5-qrcode, jsPDF).

## Design

Interface inspirée du modèle [NexLink](https://nexlink.layoutdrop.com/demo/index.html) :
police Instrument Sans, icônes Lucide locales (licence ISC), navigation à deux
niveaux, cartes à mini-courbes et palette bleue issue du logo OIC. Thèmes clair et sombre, navigation
repliable et mise en page responsive. Le style commun se trouve dans `css/nexlink.css`.

Le pilotage opérationnel est disponible pour les partenaires, antennes, administrateurs
OIC et transporteurs : évolution mensuelle, cycle de traitement, délai moyen de
validation, dossiers prioritaires, corridors par tonnage et export CSV. La recherche
transversale porte sur les DUT, véhicules, transporteurs et trajets du rôle connecté.

Les filtres 30/90 jours et historique portent sur la **date de création**. Les
priorités couvrent tous les dossiers actifs, hors filtre de période ; le seuil de
2 jours est un repère de démonstration, pas un SLA réglementaire. Le tonnage du
nouveau pilotage couvre seulement les DUT **actuellement validés**. Les graphiques
mensuels montrent six mois ; le total historique peut donc être plus large.
La plateforme reste une simulation LocalStorage, sans nouveaux services distants.

Vérification des nouveaux calculs et périmètres : `node tests/insights.test.mjs`.

## Comptes de démonstration

Mot de passe unique : **`demo123`**

| Rôle | E-mail |
|---|---|
| Partenaire — Admin | `partner.admin@demo.oic.ci` |
| Partenaire — Éditeur | `partner.editor@demo.oic.ci` |
| Agent Antenne | `antenne.agent@demo.oic.ci` |
| Admin OIC | `oic.admin@demo.oic.ci` |
| Agent Contrôle | `controle.agent@demo.oic.ci` |
| Transporteur | `transporteur@demo.oic.ci` |

Un bouton **« Réinitialiser la démonstration »** dans la barre latérale efface et
regénère toutes les données de démonstration.

## Alignement avec le système réel de l'OIC

Une revue du code source legacy (.NET) du DUT en production a permis d'aligner
ce POC sur le vrai modèle métier : droit de timbre fiscal par côté (facturation),
type de compte « Sous-traitance », référentiels Marchandises/Emballages
(remplacent le texte libre), champs réels des véhicules (carte grise, PTAC,
carte de transport) et des conducteurs (pièce d'identité, dates de délivrance),
et un **portail Transporteur** dédié (lecture des DUT et contribution au suivi de ses propres transports).

**Écart assumé et documenté** : le système réel n'a **aucune étape de
validation/rejet par antenne** — le partenaire s'auto-valide en consommant un
numéro déjà alloué à son stock, et le seul point de contrôle humain de l'OIC
porte sur la **demande de plage de numéros** (équivalent de l'écran
« Opérations & plages » de ce POC), pas sur chaque DUT individuellement. Le
workflow antenne (rejet → correction → resoumission → validation) de ce POC est
une **amélioration proposée pour le futur système**, pas une reproduction de
l'existant — conservé ici car c'est la vision produit explicitement demandée
pour cette démonstration.

## Structure du projet

```
DUT/
├── index.html
├── css/            variables · base · layout · components · forms · dashboard · responsive
└── js/
    ├── app.js          bootstrap + déclaration des routes
    ├── seed.js         données de démonstration (utilisateurs, antennes, DUT historiques...)
    ├── core/           router, storage, auth, permissions, utils, icônes, ui (modals/toasts), layout
    ├── repositories/   seul point d'accès à LocalStorage (un fichier par collection)
    ├── services/       logique métier (cycle de vie DUT, QR, PDF, audit, contrôle, dashboards)
    └── views/          un rendu par écran, jamais d'accès direct à LocalStorage
```

Règle d'architecture stricte respectée dans tout le code :

```
VUE → SERVICE → REPOSITORY → LOCALSTORAGE
```

## Scénario de démonstration (≈20 min)

**0–3 min — Partenaire**
Connexion `partner.admin` → dashboard (plage active : 37 numéros disponibles sur
100) → référentiels → carte des antennes.

**3–10 min — Création DUT**
`+ Nouveau DUT` → assistant en 7 étapes (Général, Parties, Marchandise,
Facturation, Trajet, Annexes, Récapitulatif) → sauvegarde brouillon → soumission.

Jeu de données suggéré : transporteur *ABC TRANSPORT CI*, véhicule *AB-1234-CD*,
conducteur *KOUASSI Jean*, expéditeur *SOCIETE AFRICAINE DE NEGOCE*, destinataire
*INDUSTRIES DU NORD*, trajet *Abidjan → Bouaké*, marchandise *Cacao*, 35 tonnes.

**10–14 min — Antenne**
Connexion `antenne.agent` → DUT à valider → **Rejeter** (motif : carte de
transport expirée) → reconnexion partenaire → **Corriger** → resoumission →
reconnexion antenne → **Valider** → numéro attribué `DUT-CI-2026-001063`,
solde 37 → 36.

**14–17 min — QR & contrôle**
Détail DUT validé → QR code → génération PDF → connexion `controle.agent` →
scan valide, puis simulation d'un QR faux.

**17–20 min — OIC**
Connexion `oic.admin` → dashboard national (le DUT de 35 tonnes apparaît
immédiatement dans les statistiques) → journal d'audit → section sécurité &
contrôles.

## Anti-falsification

Le QR code ne contient **aucune donnée métier en clair** — uniquement :

```
oicdut://verify/<token opaque, aléatoire, crypto.randomUUID()>
```

Après scan, l'application de contrôle interroge le **système officiel**
(LocalStorage dans ce POC) et affiche les données réelles pour comparaison
avec le document présenté. Le statut affiché est **toujours** celui du système,
jamais celui imprimé sur le papier : un DUT retiré reste retiré même si le PDF
affiche encore « Validé ».

## Limites assumées du POC

- **LocalStorage n'est pas un mécanisme de sécurité.** Il simule uniquement les
  concepts métier (rôles, séparation création/validation, token opaque, audit
  append-only). Toute personne ayant accès au navigateur peut lire/modifier ces
  données — inacceptable en production.
- Les CDN sont chargés sans intégrité Sous-ressource (SRI) pour fiabiliser la
  démonstration ; à corriger avant tout usage réel.
- Les pièces jointes PDF/JPEG/PNG sont enregistrées en Data URL dans LocalStorage : 300 Ko par fichier, 1,5 Mo de fichiers au total. Les anciennes annexes de démonstration restent des références sans contenu et sont signalées comme telles.
- Les coordonnées des antennes sur la carte sont des **données de démonstration**,
  explicitement signalées comme non officielles.
- L'empreinte SHA-256 apposée sur le PDF est calculée côté navigateur à titre
  d'illustration ; elle ne remplace pas une signature électronique.

## Architecture cible de production

| Domaine | Cible |
|---|---|
| Frontend | Angular |
| Backend | NestJS |
| Base de données | PostgreSQL + PostGIS (géolocalisation antennes/contrôles) |
| Identité | Keycloak (SSO, MFA, RBAC) |
| Cache / files | Redis |
| Stockage documentaire | MinIO / S3 |
| Intégrité document | Signature cryptographique asymétrique + **PAdES** sur le PDF |
| Vérification terrain | Application de contrôle avec vérification **offline** de la signature + synchronisation du statut temps réel dès reconnexion |
| Observabilité | Monitoring, journal d'audit **append-only côté serveur** |
| API | API sécurisée HTTPS, authentification forte, révocation de session |

Principe non négociable : **la clé privée de signature ne réside jamais dans
une application cliente** (web ou mobile) — seule la clé publique y est
distribuée.

## Qualité du code

- ES Modules, aucune fonction globale, aucun `onclick` inline, aucun CSS inline.
- Repositories dédiés par collection LocalStorage, services porteurs de la
  logique métier, vues sans accès direct au stockage.
- Erreurs utilisateur explicites (numéro de permis manquant, motif de rejet
  obligatoire, arrivée antérieure au départ, aucun numéro DUT disponible...).
- Journal d'audit **append-only** : aucune fonction d'édition/suppression des
  entrées n'est exposée par l'application.

### Raffinement OIC

La connexion reprend la disposition Login Basic de NexLink avec une illustration
DUT générée, intégrée localement dans `assets/images/dut-transport-illustration.png`.
Le thème utilise le bleu OIC `#155A9C`. Les graphiques en colonnes sont remplacés
par des courbes lissées ; les indicateurs portent une mini-courbe avec un libellé
explicite de la série. Les variations éventuelles comparent les créations du mois
en cours (incomplet) avec celles du mois précédent, sans inventer un historique
de stock. Les animations respectent `prefers-reduced-motion`.


## Enrichissement métier local — septembre 2026

- `#/actions` : centre d’actions par périmètre, incidents ouverts, brouillons et retours, suivi des transports, seuil de stock à 10 numéros ; filtres sauvegardés par utilisateur.
- Dossier DUT : onglets Transport, Incidents & réserves, Documents & preuves, Checklist et audit administratif. Les URL des onglets sont rechargeables.
- Transport déclaré : À préparer → Chargé → En route → Arrivé → Livré. Le DUT doit être valide pour avancer. Les événements restent distincts du statut administratif et portent un auteur et une date.
- Incidents : type, priorité, description, responsable, résolution et historique conservé. Le centre d’actions les retire des actions ouvertes après résolution.
- Checklist : complétude calculée avec les règles existantes de soumission et vérification déclarative des pièces. Disponible aussi au récapitulatif du formulaire, sans ajouter une nouvelle obligation réglementaire.
- Duplication par le partenaire : nouvelle identité, dates de trajet effacées, aucun numéro/QR, aucune validation, preuve ou incident repris. Les champs métier sont copiés pour préparer un nouveau brouillon.
- Fichiers réels : ajout et téléchargement depuis le dossier ou l’étape Annexes. Limites explicites pour LocalStorage, erreur visible en cas de quota, aucune écriture partielle du dossier opérationnel.
- `#/oic/operations` : attribution ou refus motivé des demandes ; plages calculées sans chevauchement avec les plages attribuées et les numéros DUT existants de l’année. La décision est visible côté partenaire.

Les nouvelles données sont conservées sous `dut_workspace_v1`, les vues sous `dut_action_filters_<utilisateur>`, et les demandes sous `dut_operations`. Aucun réensemencement ni migration destructive n’a été ajouté. Fermer ou recharger la page ne supprime pas les données. Effacer les données du navigateur ou réinitialiser la démonstration les supprime. Les comptes de démonstration d’un même navigateur partagent ces collections avec les périmètres d’affichage du POC ; aucun partage réseau ou entre appareils n’est simulé.

Le suivi terrain est déclaratif. GPS, ETA prédictive, notifications externes, signature électronique et synchronisation serveur restent des intégrations futures. LocalStorage ne remplace pas l’authentification et les contrôles d’accès d’un backend.

Vérifications : `node --experimental-default-type=module tests/workspace.test.mjs` et `node --experimental-default-type=module tests/insights.test.mjs`.

## DUT révisé : recto / verso et contrôle d’impression

Les quatre PDF de `docs/` servent de références de présentation. Le dossier propose maintenant **DUT recto / verso** (téléchargement) et **Aperçu** (lecteur PDF.js local, sans enregistrer une impression).

- Deux pages pour le dossier courant, avec rubriques 1 à 10 : transport et parties, trajet, marchandises, finances, détail facturé, annexes, réserves, quatre visas et trois signatures. Les champs longs et marchandises supplémentaires sont reportés dans des annexes numérotées, avec la même empreinte sur chaque page.
- Quatre mentions d’exemplaire : transporteur, expéditeur, destinataire et souche OIC. Chaque génération enregistrée a un rang ; à partir de la deuxième, un motif est requis. L’aperçu est sans effet sur ce rang.
- Statut au moment de la génération : validé, suspendu (filigrane + motif + alerte), retiré (numéro barré + filigrane + mention), ou épreuve non officielle sans numéro et sans QR avant validation. Le jeton existant d’un document suspendu/retiré reste scannable pour signaler son état actuel.
- Bandeau institutionnel, armoiries existantes, logo OIC, trame fine et micro-texte. Ce sont des marques de présentation, pas des garanties de résistance à la photocopie.
- La référence au décret n° 2015-270 du 22 avril 2015 a été vérifiée sur https://www.oic.ci/source/fr/includes/dut/fr/index.php ; les montants et taxes restent ceux du dossier, sans reprendre les chiffres illustratifs des maquettes ni ajouter de débours non saisis.
- La clé LocalStorage `dut_prints_v2` contient le contenu structuré figé utilisé pour chaque impression, l’exemplaire, la date, le rang, l’auteur, le motif et une empreinte SHA-256 complète. Aucun contenu binaire de pièce jointe n’est dupliqué. Un changement de dossier pendant la génération empêche l’enregistrement d’une impression obsolète.
- Le journal du dossier affiche ces impressions. L’écran de contrôle permet de comparer le rang et les 64 caractères imprimés à l’empreinte recalculée du contenu enregistré. La conformité de cette empreinte ne prouve pas que le papier n’a pas été retouché : l’agent doit également comparer les données visibles. Ce POC n’analyse pas le fichier PDF présenté et ne signe pas cryptographiquement les PDF ; il ne possède pas de registre central sécurisé.

Le PDF marque explicitement **POC LOCAL**. Les anciens fichiers déjà téléchargés ne peuvent pas être modifiés à distance lors d’une suspension ; le contrôle consulte toujours le statut actuel du registre local. Pour un usage officiel : backend sécurisé, signatures et gestion d’impression côté serveur restent nécessaires.

Validation : `node --experimental-default-type=module tests/pdf.test.mjs` vérifie les deux pages, les statuts, les débordements et les empreintes. Ce test de rendu utilise un QR de test fixe dans `tests/fixtures/qr-print.png` ; l’application utilise son encodeur QR navigateur existant. Les bibliothèques jsPDF 2.5.1 et PDF.js 4.10.38 sont locales dans `js/vendor/`.

## Planning des trajets

Le menu Pilotage → Planning des trajets (`#/planning`) affiche un Gantt par dossier/camion, avec périodes de 7, 14 ou 30 jours, recherche, navigation et repère Aujourd’hui. Le bouton Derniers trajets retrouve les données historiques de démonstration.
Les dates initiales viennent du DUT (journée entière si heures absentes). Les prévisions opérationnelles ajustées sont enregistrées dans `dut_workspace_v1`, avec auteur et historique, sans modifier le DUT émis. Cliquez sur une barre ou un dossier pour ajuster les dates ou ouvrir son suivi. Les couleurs représentent le suivi déclaré ou le blocage administratif, pas un suivi GPS. Les chevauchements du même véhicule sont signalés dans le périmètre visible ; les dossiers rejetés/retirés sont exclus de cette alerte. Les rôles partenaire, antenne, OIC et transporteur conservent leurs périmètres habituels.
Validation : `node tests/planning.test.mjs` (dates, stockage, chevauchements, intégrité du document et périmètres).

### Voyages fictifs et manuel illustré (21 septembre 2026)

Le planning propose dix voyages fictifs via « Ajouter les voyages de démo » (OIC admin ou partenaire admin). Ils sont conservés dans `dut_planning_demo_v1`, indépendamment des DUT et des stocks de numéros. Chaque exemple est rattaché à un dossier source pour conserver le périmètre de visibilité ; il est identifié DÉMO, sans émission de document. L’ajout est idempotent par périmètre d’administration. Les exemples illustrent différents états déclarés et des chevauchements de prévisions. Leurs dates ne se déplacent pas automatiquement après leur création.

Le manuel débutant de 26 pages est disponible dans [output/pdf/manuel-utilisation-dut-oic.pdf](output/pdf/manuel-utilisation-dut-oic.pdf). Il couvre les six rôles, la saisie, la validation, le planning, le suivi, les contrôles, l’impression, les limites locales, un exercice et un glossaire. Les captures sont dans `docs/manual-assets`. Le générateur reproductible est `scripts/build_user_manual.py` (Python + reportlab et Pillow). Les polices Instrument Sans sont accompagnées de leur licence OFL dans `docs/manual-assets/fonts`.

## Administration locale du POC

Le rôle **Admin OIC** dispose du menu Administration :
- `#/admin/users` : créer et modifier un compte, attribuer l’un des six rôles et son rattachement, désactiver/réactiver, générer un nouvel accès.
- `#/admin/roles` : consulter les missions des rôles prédéfinis.
- `#/admin/settings` : nom, contact d’assistance, seuil d’attente, quantité et tarif proposés pour les nouvelles plages ; remise à zéro de la démonstration après confirmation.
- `#/admin/audit` : les 500 dernières opérations d’administration.

Compte initial : `oic.admin@demo.oic.ci` / `demo123` (sauf réinitialisation de son accès). Les mots de passe générés ne sont présentés qu’une fois ; leur empreinte PBKDF2 salée est conservée localement. Désactivation, changement de rôle/périmètre et réinitialisation invalident les anciennes sessions. Un administrateur ne peut pas désactiver son propre compte ni changer son propre rôle.

Ces contrôles et données restent ceux d’un POC dans le navigateur (localStorage), pas d’une authentification serveur de production. Les rôles eux-mêmes sont prédéfinis, leurs permissions ne sont pas éditables depuis l’interface. Les manuels précédemment exportés doivent être actualisés pour inclure ce nouvel espace.

Vérification : `node --experimental-default-type=module --test tests/*.test.mjs`.
