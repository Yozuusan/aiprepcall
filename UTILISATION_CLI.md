# 🚀 UTILISATION SANS NAVIGATEUR WEB

## ⚠️ Important : Le fichier .env

**Je n'ai PAS poussé le fichier .env sur git** - et c'est normal !

Le `.env` contient votre clé API Anthropic (comme un mot de passe). Le pousser sur git serait dangereux :
- ❌ Tout le monde pourrait voir votre clé
- ❌ Utiliser votre compte (et vous facturer)
- ❌ Risque de sécurité majeur

**Le `.env` est dans `.gitignore` pour vous protéger.**

Si vous devez déployer sur un autre serveur :
1. Créez un nouveau `.env` là-bas
2. Copiez votre clé API manuellement (pas via git)

---

## 🎯 Solution : Interface CLI (Ligne de Commande)

**Pas besoin de navigateur ni de SSH port forwarding !**

J'ai créé un outil en ligne de commande qui vous permet de générer des cases directement depuis votre terminal.

### Utilisation Simple

```bash
# Lancez l'interface interactive
./generer_case_cli.sh
```

**C'est tout !** Le script vous guide étape par étape :

1. ✅ **Choisissez le type de case** (Profitability, M&A, Pricing, etc.)
2. ✅ **Sélectionnez la difficulté** (Easy, Medium, Hard)
3. ✅ **Optionnel : Industrie** (Tech, Retail, Healthcare, etc.)
4. ✅ **Le case est généré** et affiché dans le terminal
5. ✅ **Sauvegardé en JSON** pour consultation complète

---

## 📖 Exemple d'Utilisation

```bash
$ ./generer_case_cli.sh

╔═══════════════════════════════════════════════════════════════╗
║        GÉNÉRATEUR DE CASES DE CONSULTING - CLI               ║
╚═══════════════════════════════════════════════════════════════╝

✅ Serveur opérationnel

📋 TYPES DE CASES DISPONIBLES :

  1) Profitability (98 patterns)
  2) Private Equity (43 patterns)
  3) Market Entry (5 patterns)
  4) Pricing (14 patterns)
  ...

Choisissez un type (1-10) : 1

🎚️  DIFFICULTÉ :

  1) Easy   - Calculs simples, structure claire
  2) Medium - Framework thinking, calculs modérés
  3) Hard   - Analyse complexe, multi-étapes

Choisissez (1-3) : 2

⏳ Génération en cours...
   Type: profitability
   Difficulté: medium

✅ Case généré avec succès !

╔═══════════════════════════════════════════════════════════════╗
║                    VOTRE CASE                                 ║
╚═══════════════════════════════════════════════════════════════╝

📋 Case ID: case_profitability_1730840123
🏭 Industrie: Retail
⏱️  Durée: 35 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PROMPT :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your client is ShopEasy, a European retail chain with 200 stores
that has experienced declining profitability over the past 18
months despite stable revenues...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ QUESTIONS : 2 questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Question 1 : Calculate the impact on profitability if...
Question 2 : Analyze the cost structure and identify...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 FICHIER COMPLET : case_profitability_1730840123.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Pour voir tout le case (avec solutions, framework, etc.) :
   cat case_profitability_1730840123.json | jq .

📝 Pour voir juste les solutions :
   cat case_profitability_1730840123.json | jq '.questions[].solution'
```

---

## 🔍 Consulter le Case Complet

Le case est sauvegardé en JSON avec **toutes les informations** :

```bash
# Voir tout le case formaté
cat case_profitability_xxx.json | jq .

# Voir juste le prompt
cat case_profitability_xxx.json | jq '.prompt'

# Voir les questions
cat case_profitability_xxx.json | jq '.questions'

# Voir les solutions (après avoir réfléchi !)
cat case_profitability_xxx.json | jq '.questions[].solution'

# Voir le framework guidance
cat case_profitability_xxx.json | jq '.framework_guidance'

# Voir la conclusion recommandée
cat case_profitability_xxx.json | jq '.conclusion'

# Voir les notes pour l'intervieweur
cat case_profitability_xxx.json | jq '.interviewer_notes'
```

---

## 📋 Contenu d'un Case Généré

Chaque case inclut :

✅ **Prompt** - Énoncé du problème (3-5 phrases)
✅ **Clarifying Information** - Contexte client, objectifs, timeline
✅ **Framework Guidance** - Frameworks attendus, facteurs clés
✅ **Questions** (2-3) - Questions quantitatives avec :
   - Énoncé de la question
   - Exhibits (tableaux de données)
   - Solutions détaillées (approche + calcul + insight)
✅ **Brainstorming** - Catégories de risques/facteurs
✅ **Conclusion** - Framework de recommandation + exemple
✅ **Interviewer Notes** - Erreurs communes, hints, critères

---

## 🎓 Workflow de Pratique

### 1. Générer le case
```bash
./generer_case_cli.sh
```

### 2. Lire le prompt
```bash
cat case_xxx.json | jq -r '.prompt'
```

### 3. Réfléchir (30-40 min)
- Structurez votre approche
- Identifiez les frameworks
- Faites les calculs
- Formulez votre recommandation

### 4. Consulter les solutions
```bash
# Questions et solutions
cat case_xxx.json | jq '.questions'

# Conclusion recommandée
cat case_xxx.json | jq '.conclusion'

# Notes de l'intervieweur
cat case_xxx.json | jq '.interviewer_notes'
```

---

## 🔧 Vérifier que Tout Fonctionne

```bash
# Le serveur tourne-t-il ?
curl http://localhost:3000/api/health

# Voir les statistiques
curl http://localhost:3000/api/stats | jq .

# Redémarrer le serveur si besoin
pkill -f "node.*server.js"
cd /home/user/aiprepcall/backend
node server.js &
```

---

## 🆘 Dépannage

### "Connection refused"
Le serveur n'est pas démarré. Lancez-le :
```bash
cd /home/user/aiprepcall/backend
node server.js &
```

### "jq: command not found"
Installez jq pour formater le JSON :
```bash
sudo apt-get install jq
```

Ou consultez directement le fichier JSON :
```bash
cat case_xxx.json
```

### Case non généré / erreur API
Vérifiez que la clé API est correcte dans `.env`

---

## 💡 Astuce Pro

Créez un alias pour générer rapidement :

```bash
# Ajoutez à votre ~/.bashrc
echo "alias gencase='cd /home/user/aiprepcall && ./generer_case_cli.sh'" >> ~/.bashrc
source ~/.bashrc

# Puis utilisez simplement :
gencase
```

---

## 🎯 Avantages de l'Interface CLI

✅ **Pas besoin de navigateur**
✅ **Pas besoin de SSH port forwarding**
✅ **Interface intuitive et guidée**
✅ **Cases sauvegardés pour consultation**
✅ **Formatage propre dans le terminal**
✅ **Accès complet à toutes les informations**

---

## 📚 Documentation Complète

- `STATUS.md` - État du système
- `GUIDE_UTILISATION.md` - Guide complet
- `ACCES_RAPIDE.md` - Guide d'accès web
- `README.md` - Documentation technique

---

**Vous êtes prêt ! Commencez à pratiquer avec :**

```bash
./generer_case_cli.sh
```

**Bonne préparation ! 🚀**
