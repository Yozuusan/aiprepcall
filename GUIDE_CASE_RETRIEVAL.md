# 🔍 CASE RETRIEVAL - Guide Complet

## Système de Recherche de Cases Réels

Contrairement au **Case Generator** qui crée des cases synthétiques, le **Case Retrieval** vous permet de parcourir et pratiquer sur de **vrais cases d'interview** issus de :
- **69 REX** (retours d'expérience réels McKinsey, BCG, Bain)
- **155 Casebooks** (Darden, Stern, Columbia, ESADE)

**Total : 230 cases réels**

---

## 🚀 Démarrage Rapide

### 1. Construire la Base de Données (déjà fait)

```bash
cd /home/user/aiprepcall/backend
python3 buildCaseDatabase.py
```

### 2. Démarrer le Serveur

```bash
node caseRetrievalServer.js &
```

Le serveur démarre sur **http://localhost:3001**

### 3. Utiliser l'Interface CLI

```bash
./parcourir_cases.sh
```

---

## 📊 Ce qui est Disponible

### Par Firme
- **McKinsey** : 16 REX
- **BCG** : 40 REX
- **Bain** : 16 REX
- **Business Schools** : 155 casebooks

### Par Type de Case
- **Profitability** : 102 cases
- **Private Equity** : 45 cases
- **Pricing** : 14 cases
- **Competitive Response** : 12 cases
- **M&A** : 9 cases
- **Market Entry**, Growth, New Product Launch, etc.

### Par Difficulté
- **Easy** : 138 cases
- **Medium** : 76 cases
- **Hard** : 16 cases

### Par Type de Source
- **REX** (vrais entretiens) : 69 cases
- **Casebooks** : 155 cases

---

## 🔍 Utiliser l'Interface CLI

L'interface interactive vous permet de :

1. **Rechercher par critères**
   - Firme (McKinsey, BCG, Bain)
   - Type de case (Profitability, M&A, etc.)
   - Difficulté (Easy, Medium, Hard)
   - Industrie (Tech, Retail, etc.)

2. **Obtenir un case aléatoire**
   - Parfait pour l'entraînement surprise

3. **Parcourir par firme**
   - Tous les REX McKinsey, BCG ou Bain

4. **Filtrer par source**
   - REX uniquement (vrais entretiens)
   - Casebooks uniquement

### Exemple d'Utilisation

```bash
$ ./parcourir_cases.sh

╔════════════════════════════════════════════════════════════════════╗
║          PARCOURIR LES CASES D'INTERVIEW RÉELS                    ║
║          69 REX + 155 Casebooks = 230 cases disponibles           ║
╚════════════════════════════════════════════════════════════════════╝

✅ Serveur opérationnel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENU PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1) 🔍 Rechercher des cases par critères
  2) 🎲 Obtenir un case aléatoire
  3) 🏢 Parcourir par firme (McKinsey, BCG, Bain)
  4) 📊 Voir les statistiques
  5) 🎯 Case REX uniquement (vrais entretiens)
  6) 📚 Casebooks uniquement
  7) ❌ Quitter

Choisissez une option (1-7) :
```

---

## 🌐 Utiliser l'API Directement

### Endpoints Disponibles

```bash
# Health check
curl http://localhost:3001/api/health

# Statistiques
curl http://localhost:3001/api/stats

# Rechercher des cases
curl http://localhost:3001/api/cases?firm=McKinsey&difficulty=medium

# Case aléatoire
curl http://localhost:3001/api/random

# Case spécifique par ID
curl http://localhost:3001/api/cases/case_0001

# Liste des firmes
curl http://localhost:3001/api/firms

# Liste des types
curl http://localhost:3001/api/types

# Liste des industries
curl http://localhost:3001/api/industries
```

### Filtres Disponibles

- `firm` : McKinsey, BCG, Bain, Business School
- `case_type` : profitability, market_entry, pricing, etc.
- `difficulty` : easy, medium, hard
- `industry` : Tech, Retail, Healthcare, etc.
- `source_type` : REX, Casebook
- `limit` : nombre de résultats (défaut: 10)
- `offset` : pagination (défaut: 0)

### Exemples de Recherche

```bash
# Tous les cases McKinsey REX de difficulté medium
curl 'http://localhost:3001/api/cases?firm=McKinsey&source_type=REX&difficulty=medium'

# Cases de profitability faciles
curl 'http://localhost:3001/api/cases?case_type=profitability&difficulty=easy&limit=5'

# REX BCG uniquement
curl 'http://localhost:3001/api/cases?firm=BCG&source_type=REX'

# Case aléatoire de type M&A
curl 'http://localhost:3001/api/random?case_type=mergers_acquisitions'
```

---

## 📋 Structure d'un Case

Chaque case contient :

```json
{
  "case_id": "case_0001",
  "title": "Bain T1 - Private Equity Case",
  "case_type": "private_equity",
  "industry": "Tech",
  "difficulty": "medium",
  "source": {
    "filename": "REX-Bain-SFE-T1-Mars-2025.pdf",
    "type": "REX",
    "firm": "Bain",
    "round": "T1",
    "process_type": "Stage",
    "year": "2025",
    "candidate": null
  },
  "content": {
    "prompt": "Le client est un fonds de PE qui s'intéresse à...",
    "full_text": "Texte complet du case...",
    "clarifying_info": "...",
    "framework": ["MECE", "Porter 5 Forces"],
    "questions": [...],
    "conclusion": "..."
  },
  "tags": ["real_interview", "bain", "stage"]
}
```

---

## 🎯 Sources des Cases

### REX (Retours d'Expérience)

Les REX sont des **vrais cases d'interview** posés lors de processus de recrutement réels. Ils indiquent :

- **Firme** : McKinsey, BCG, Bain
- **Round** : T1, T2 (Tour 1, Tour 2)
- **Type de processus** : Stage, CDI
- **Année** : 2022-2025
- **Candidat** : Nom du candidat (si disponible)

**Exemples de fichiers REX :**
- `REX-Bain-SFE-T1-Mars-2025.pdf` → Bain, Stage fin d'études, Tour 1, Mars 2025
- `REX-BCG-Process-CDI-TOUR-1-AVRIL-2025.pdf` → BCG, CDI, Tour 1, Avril 2025
- `REX-McKinsey-Benoit-Baruel-1.pdf` → McKinsey, candidat Benoit Baruel

### Casebooks

Les casebooks sont des **collections de cases d'entraînement** créés par des écoles de commerce :

- **Darden** (2013, 2018, 2020-2021)
- **Stern (NYU)**
- **Columbia** (2007)
- **ESADE**

---

## 💡 Utilisation Recommandée

### Pour l'Entraînement

1. **Commencez par les REX de votre firme cible**
   ```bash
   # Exemple : tous les REX McKinsey
   ./parcourir_cases.sh
   → Option 3 (Parcourir par firme) → McKinsey
   ```

2. **Filtrez par difficulté progressive**
   - Commencez par **Easy** pour vous familiariser
   - Passez à **Medium** quand vous êtes à l'aise
   - Terminez par **Hard** pour vous challenger

3. **Pratiquez par type de case**
   ```bash
   # Exemple : Profitability uniquement
   curl 'http://localhost:3001/api/cases?case_type=profitability&limit=10'
   ```

### Pour la Simulation

1. **Case aléatoire** pour simuler la surprise d'un entretien
   ```bash
   curl http://localhost:3001/api/random
   ```

2. **REX du même round** que votre entretien
   ```bash
   # Exemple : Tour 1 Bain
   curl 'http://localhost:3001/api/cases?firm=Bain&source_type=REX'
   ```

---

## 🔧 Dépannage

### Le serveur ne répond pas

```bash
# Vérifier si le serveur tourne
curl http://localhost:3001/api/health

# Si pas de réponse, démarrez-le
cd /home/user/aiprepcall/backend
node caseRetrievalServer.js &
```

### Erreur "Database not found"

```bash
# Reconstruire la base de données
cd /home/user/aiprepcall/backend
python3 buildCaseDatabase.py
```

### jq non disponible

```bash
# Installer jq pour formater le JSON
sudo apt-get install jq

# Ou consultez le JSON brut
curl http://localhost:3001/api/cases
```

---

## 📚 Différences avec Case Generator

| Feature | **Case Retrieval** | **Case Generator** |
|---------|-------------------|-------------------|
| Source | Vrais cases d'interview | Cases synthétiques (Claude AI) |
| Nombre | 230 cases fixes | Illimité |
| Source indiquée | ✅ Oui (REX/Casebook) | ❌ Non (généré) |
| Firme précisée | ✅ Oui (McKinsey/BCG/Bain) | ⚠️ Style choisi |
| Round/Tour | ✅ Oui (T1, T2) | ❌ Non |
| Candidat | ✅ Parfois | ❌ Non |
| API Key requise | ❌ Non | ✅ Oui (Anthropic) |
| Port | 3001 | 3000 |
| Usage | Entraînement réaliste | Génération variée |

---

## 🎓 Recommandations

1. **Utilisez les REX** pour vous entraîner sur de vrais cases posés en entretien
2. **Notez la source** : c'est important de savoir d'où vient le case
3. **Filtrez par firme** : chaque cabinet a son style
4. **Progressez par difficulté** : Easy → Medium → Hard
5. **Combinez avec Case Generator** : REX pour réalisme, Generator pour variété

---

## 📖 Commandes Rapides

```bash
# Démarrer
node caseRetrievalServer.js &

# Interface
./parcourir_cases.sh

# REX McKinsey
curl 'http://localhost:3001/api/cases?firm=McKinsey&source_type=REX'

# REX BCG T1
curl 'http://localhost:3001/api/cases?firm=BCG&source_type=REX'

# REX Bain difficiles
curl 'http://localhost:3001/api/cases?firm=Bain&difficulty=hard'

# Case aléatoire
curl http://localhost:3001/api/random

# Stats
curl http://localhost:3001/api/stats | jq .
```

---

**Le système Case Retrieval est parfait pour s'entraîner sur de vrais cases d'interview ! 🎯**

Consultez `STATUS.md` pour l'état complet du système.
