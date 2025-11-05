# 🚀 Guide d'Utilisation - Générateur de Cases de Consulting

## ✅ Ce qui a été fait

Le système est **maintenant opérationnel** ! Voici ce qui a été réalisé :

1. ✅ **Extraction des PDFs** : 230 cases extraits de 35 PDFs (McKinsey, BCG, Bain, casebooks)
2. ✅ **Base de connaissances** : Construite avec 230 cases analysés
3. ✅ **Serveur API** : Démarré sur http://localhost:3000
4. ✅ **Interface web** : Disponible et prête à l'emploi

### 📊 Statistiques de la Base de Connaissances

- **230 cases** analysés provenant de vraies interviews
- **Types de cases** :
  - Profitability: 98 patterns
  - Private Equity: 43 patterns
  - Pricing: 14 patterns
  - Competitive Response: 12 patterns
  - M&A: 9 patterns
  - Market Entry, Growth, New Product Launch, Cost Reduction: 5 patterns chacun
  - Offshoring: 1 pattern

- **Industries** : Tech (187), Manufacturing (19), Retail (4), etc.

## 🔧 Configuration Requise

### ⚠️ IMPORTANT : Configurer la clé API Anthropic

Avant de générer des cases, vous devez configurer votre clé API :

1. Éditez le fichier `.env` :
```bash
nano .env
```

2. Remplacez `your_api_key_here` par votre vraie clé API Anthropic :
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Sauvegardez le fichier (Ctrl+O, Enter, Ctrl+X)

4. Redémarrez le serveur :
```bash
# Arrêter le serveur actuel
pkill -f "node.*server.js"

# Redémarrer
cd /home/user/aiprepcall/backend
node server.js
```

## 🌐 Accéder à l'Interface Web

### Option 1 : Depuis le serveur local

Si vous avez accès à un navigateur sur la machine :
```
http://localhost:3000
```

### Option 2 : Port forwarding (SSH)

Si vous êtes connecté via SSH :
```bash
ssh -L 3000:localhost:3000 user@server
```
Puis ouvrez dans votre navigateur : `http://localhost:3000`

### Option 3 : Utiliser l'API directement

Vous pouvez générer des cases via l'API en ligne de commande :

```bash
# Test de santé
curl http://localhost:3000/api/health

# Voir les statistiques
curl http://localhost:3000/api/stats

# Générer un case (Profitability, Medium)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "case_type": "profitability",
    "difficulty": "medium",
    "industry": "Tech"
  }'
```

## 📝 Types de Cases Disponibles

1. **profitability** - Cas de rentabilité
2. **market_entry** - Entrée de marché
3. **mergers_acquisitions** - Fusions & acquisitions
4. **competitive_response** - Réponse concurrentielle
5. **new_product_launch** - Lancement de produit
6. **pricing** - Stratégie de prix
7. **cost_reduction** - Réduction des coûts
8. **growth** - Croissance
9. **private_equity** - Private equity
10. **process_optimization** - Optimisation de processus
11. **offshoring** - Délocalisation

## 🎯 Niveaux de Difficulté

- **easy** - Calculs simples, structure claire
- **medium** - Framework thinking, calculs modérés
- **hard** - Analyse complexe, calculs multi-étapes

## 💻 Utilisation de l'Interface Web

1. **Ouvrez votre navigateur** sur http://localhost:3000

2. **Sélectionnez** :
   - Type de case (ex: Profitability)
   - Difficulté (Easy/Medium/Hard)
   - Industrie (optionnel)

3. **Cliquez** sur "Generate Case" ou "Surprise Me"

4. **Pratiquez** avec le case généré qui inclut :
   - Prompt d'ouverture
   - Informations de clarification
   - Guidance sur les frameworks
   - Questions quantitatives avec solutions
   - Section brainstorming
   - Framework de conclusion
   - Notes pour l'intervieweur

## 🔄 Ajouter Plus de Cases

Pour améliorer la qualité des cases générés, vous pouvez ajouter plus de PDFs :

1. **Copiez** vos nouveaux PDFs dans `data/casebooks/`

2. **Réexécutez l'extraction** :
```bash
cd /home/user/aiprepcall/backend
python3 extractPDFs_simple.py
```

3. **Reconstruisez la base de connaissances** :
```bash
node buildKnowledgeBase.js
```

4. **Redémarrez le serveur**

## 🛠️ Commandes Utiles

### Vérifier le statut du serveur
```bash
curl http://localhost:3000/api/health
```

### Voir les statistiques
```bash
curl http://localhost:3000/api/stats | jq .
```

### Redémarrer le serveur
```bash
pkill -f "node.*server.js"
cd /home/user/aiprepcall/backend
node server.js &
```

### Voir les logs du serveur
```bash
tail -f /home/user/aiprepcall/backend/server.log
```

## 📖 Structure d'un Case Généré

Chaque case généré contient :

```json
{
  "case_id": "case_profitability_xxx",
  "metadata": {
    "case_type": "profitability",
    "difficulty": "medium",
    "industry": "Tech",
    "duration": 35
  },
  "prompt": "Énoncé du cas...",
  "clarifying_information": {...},
  "framework_guidance": {...},
  "questions": [{...}, {...}],
  "brainstorming": {...},
  "conclusion": {...},
  "interviewer_notes": {...}
}
```

## 🎓 Conseils pour la Pratique

1. **Commencez par Easy** pour vous familiariser avec la structure
2. **Chronométrez-vous** (30-40 minutes par case)
3. **Parlez à haute voix** comme dans un vrai entretien
4. **Suivez MECE** pour structurer votre réponse
5. **Vérifiez vos calculs** avant de conclure
6. **Pratiquez régulièrement** pour progresser

## ❓ Dépannage

### Le serveur ne démarre pas
```bash
# Vérifiez les processus Node en cours
ps aux | grep node

# Vérifiez les logs
cat /home/user/aiprepcall/backend/server.log
```

### "Invalid API key"
- Vérifiez le fichier `.env`
- Assurez-vous que la clé API est valide
- Redémarrez le serveur après modification

### Erreur 500 lors de la génération
- La clé API n'est pas configurée ou invalide
- Vérifiez les logs du serveur pour plus de détails

### Impossible d'accéder à localhost:3000
- Le serveur n'est peut-être pas démarré
- Vérifiez avec : `curl http://localhost:3000/api/health`
- Si SSH : utilisez le port forwarding

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs : `tail -f backend/server.log`
2. Testez l'API : `curl http://localhost:3000/api/health`
3. Vérifiez la configuration : `cat .env`

---

**Le système est prêt ! Configurez votre clé API et commencez à pratiquer ! 🚀**
