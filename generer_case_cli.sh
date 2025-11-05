#!/bin/bash
# Interface CLI pour générer des cases

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        GÉNÉRATEUR DE CASES DE CONSULTING - CLI               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que le serveur fonctionne
curl -s http://localhost:3000/api/health > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur : Le serveur n'est pas accessible"
    echo "💡 Démarrez-le avec : cd /home/user/aiprepcall/backend && node server.js &"
    exit 1
fi

echo "✅ Serveur opérationnel"
echo ""

# Menu type de case
echo "📋 TYPES DE CASES DISPONIBLES :"
echo ""
echo "  1) Profitability (98 patterns)"
echo "  2) Private Equity (43 patterns)"
echo "  3) Market Entry (5 patterns)"
echo "  4) Pricing (14 patterns)"
echo "  5) M&A (9 patterns)"
echo "  6) Growth (5 patterns)"
echo "  7) Competitive Response (12 patterns)"
echo "  8) Cost Reduction (5 patterns)"
echo "  9) New Product Launch (5 patterns)"
echo " 10) Process Optimization"
echo ""
read -p "Choisissez un type (1-10) : " type_choice

case $type_choice in
  1) CASE_TYPE="profitability";;
  2) CASE_TYPE="private_equity";;
  3) CASE_TYPE="market_entry";;
  4) CASE_TYPE="pricing";;
  5) CASE_TYPE="mergers_acquisitions";;
  6) CASE_TYPE="growth";;
  7) CASE_TYPE="competitive_response";;
  8) CASE_TYPE="cost_reduction";;
  9) CASE_TYPE="new_product_launch";;
  10) CASE_TYPE="process_optimization";;
  *) CASE_TYPE="profitability";;
esac

echo ""
echo "🎚️  DIFFICULTÉ :"
echo ""
echo "  1) Easy   - Calculs simples, structure claire"
echo "  2) Medium - Framework thinking, calculs modérés"
echo "  3) Hard   - Analyse complexe, multi-étapes"
echo ""
read -p "Choisissez (1-3) : " diff_choice

case $diff_choice in
  1) DIFFICULTY="easy";;
  2) DIFFICULTY="medium";;
  3) DIFFICULTY="hard";;
  *) DIFFICULTY="medium";;
esac

echo ""
echo "🏭 INDUSTRIE (optionnel) :"
echo ""
echo "  1) Tech"
echo "  2) Retail"
echo "  3) Healthcare"
echo "  4) Manufacturing"
echo "  5) Financial Services"
echo "  6) Aléatoire"
echo ""
read -p "Choisissez (1-6, ou Entrée pour aléatoire) : " ind_choice

case $ind_choice in
  1) INDUSTRY="Tech";;
  2) INDUSTRY="Retail";;
  3) INDUSTRY="Healthcare";;
  4) INDUSTRY="Manufacturing";;
  5) INDUSTRY="Financial_Services";;
  *) INDUSTRY="";;
esac

echo ""
echo "⏳ Génération en cours..."
echo "   Type: $CASE_TYPE"
echo "   Difficulté: $DIFFICULTY"
if [ -n "$INDUSTRY" ]; then
    echo "   Industrie: $INDUSTRY"
fi
echo ""

# Générer le case
FILENAME="case_${CASE_TYPE}_$(date +%s).json"

if [ -n "$INDUSTRY" ]; then
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate \
      -H "Content-Type: application/json" \
      -d "{
        \"case_type\": \"$CASE_TYPE\",
        \"difficulty\": \"$DIFFICULTY\",
        \"industry\": \"$INDUSTRY\"
      }")
else
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate \
      -H "Content-Type: application/json" \
      -d "{
        \"case_type\": \"$CASE_TYPE\",
        \"difficulty\": \"$DIFFICULTY\"
      }")
fi

# Vérifier le succès
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ Case généré avec succès !"
    echo ""

    # Sauvegarder le case
    echo "$RESPONSE" | jq '.case' > "$FILENAME"

    # Afficher le résumé
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    VOTRE CASE                                 ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    # Métadonnées
    CASE_ID=$(echo "$RESPONSE" | jq -r '.case.case_id')
    INDUSTRY_RESULT=$(echo "$RESPONSE" | jq -r '.case.metadata.industry')
    DURATION=$(echo "$RESPONSE" | jq -r '.case.metadata.duration')

    echo "📋 Case ID: $CASE_ID"
    echo "🏭 Industrie: $INDUSTRY_RESULT"
    echo "⏱️  Durée: $DURATION minutes"
    echo ""

    # Prompt
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 PROMPT :"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "$RESPONSE" | jq -r '.case.prompt' | fold -s -w 65
    echo ""

    # Questions
    NB_QUESTIONS=$(echo "$RESPONSE" | jq '.case.questions | length')
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❓ QUESTIONS : $NB_QUESTIONS questions"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for i in $(seq 0 $((NB_QUESTIONS - 1))); do
        Q_TEXT=$(echo "$RESPONSE" | jq -r ".case.questions[$i].question_text")
        echo "Question $((i + 1)) : $Q_TEXT" | fold -s -w 65
        echo ""
    done

    # Fichier complet
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💾 FICHIER COMPLET : $FILENAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 Pour voir tout le case (avec solutions, framework, etc.) :"
    echo "   cat $FILENAME | jq ."
    echo ""
    echo "📝 Pour voir juste les solutions :"
    echo "   cat $FILENAME | jq '.questions[].solution'"
    echo ""
    echo "🎯 Pour voir la conclusion :"
    echo "   cat $FILENAME | jq '.conclusion'"
    echo ""

else
    echo "❌ Erreur lors de la génération"
    echo "$RESPONSE" | jq .
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Bon entraînement pour vos entretiens ! 🚀            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
