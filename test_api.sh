#!/bin/bash
# Script de test pour le générateur de cases

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     TEST DU GÉNÉRATEUR DE CASES DE CONSULTING                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si le serveur est en cours d'exécution
echo "1️⃣  Vérification du serveur..."
HEALTH=$(curl -s http://localhost:3000/api/health)
if [ $? -eq 0 ]; then
    echo "✅ Serveur opérationnel"
    echo "$HEALTH" | jq .
else
    echo "❌ Serveur non accessible"
    echo "💡 Démarrez-le avec: cd backend && node server.js"
    exit 1
fi

echo ""
echo "2️⃣  Statistiques de la base de connaissances..."
curl -s http://localhost:3000/api/stats | jq .

echo ""
echo "3️⃣  Types de cases disponibles..."
curl -s http://localhost:3000/api/case-types | jq .

echo ""
echo "4️⃣  Test de génération de case..."
echo "⚠️  ATTENTION: La clé API Anthropic doit être configurée dans .env"
echo ""
read -p "Voulez-vous tester la génération d'un case ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎯 Génération d'un case de type 'profitability', difficulté 'medium'..."
    echo ""

    RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate \
        -H "Content-Type: application/json" \
        -d '{
            "case_type": "profitability",
            "difficulty": "medium",
            "industry": "Tech"
        }')

    # Vérifier si la génération a réussi
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ Case généré avec succès !"
        echo ""
        echo "📋 Aperçu du case :"
        echo "$RESPONSE" | jq '.case | {
            case_id,
            metadata,
            prompt: .prompt[0:200] + "...",
            question_count: .questions | length
        }'

        # Sauvegarder le case complet
        CASE_FILE="generated_case_$(date +%s).json"
        echo "$RESPONSE" | jq '.case' > "$CASE_FILE"
        echo ""
        echo "💾 Case complet sauvegardé dans: $CASE_FILE"
        echo "📖 Consultez ce fichier pour voir le case en détail"
    else
        echo "❌ Erreur lors de la génération"
        echo "$RESPONSE" | jq .
        echo ""
        echo "💡 Vérifiez que la clé API est correctement configurée dans .env"
    fi
else
    echo "ℹ️  Test de génération ignoré"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    TEST TERMINÉ                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Pour utiliser l'interface web:"
echo "   - Ouvrez http://localhost:3000 dans votre navigateur"
echo "   - Ou utilisez le port forwarding SSH si distant"
echo ""
echo "📖 Consultez GUIDE_UTILISATION.md pour plus d'informations"
