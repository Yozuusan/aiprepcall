#!/bin/bash
# Interface CLI pour parcourir les cases réels

API_URL="http://localhost:3001/api"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║          PARCOURIR LES CASES D'INTERVIEW RÉELS                    ║"
echo "║          69 REX + 155 Casebooks = 230 cases disponibles           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que le serveur fonctionne
curl -s $API_URL/health > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur : Le serveur Case Retrieval n'est pas accessible"
    echo ""
    echo "💡 Démarrez-le avec :"
    echo "   cd /home/user/aiprepcall/backend"
    echo "   node caseRetrievalServer.js &"
    echo ""
    exit 1
fi

echo "✅ Serveur opérationnel"
echo ""

# Menu principal
while true; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "MENU PRINCIPAL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  1) 🔍 Rechercher des cases par critères"
    echo "  2) 🎲 Obtenir un case aléatoire"
    echo "  3) 🏢 Parcourir par firme (McKinsey, BCG, Bain)"
    echo "  4) 📊 Voir les statistiques"
    echo "  5) 🎯 Case REX uniquement (vrais entretiens)"
    echo "  6) 📚 Casebooks uniquement"
    echo "  7) ❌ Quitter"
    echo ""
    read -p "Choisissez une option (1-7) : " choice

    case $choice in
        1)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "RECHERCHE PAR CRITÈRES"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            # Firme
            echo "🏢 Firme :"
            echo "  1) McKinsey (16 cases)"
            echo "  2) BCG (40 cases)"
            echo "  3) Bain (16 cases)"
            echo "  4) Business School (155 cases)"
            echo "  5) Toutes"
            read -p "Choisissez : " firm_choice

            case $firm_choice in
                1) FIRM="McKinsey";;
                2) FIRM="BCG";;
                3) FIRM="Bain";;
                4) FIRM="Business%20School";;
                *) FIRM="";;
            esac

            # Difficulté
            echo ""
            echo "🎚️  Difficulté :"
            echo "  1) Easy (138 cases)"
            echo "  2) Medium (76 cases)"
            echo "  3) Hard (16 cases)"
            echo "  4) Toutes"
            read -p "Choisissez : " diff_choice

            case $diff_choice in
                1) DIFFICULTY="easy";;
                2) DIFFICULTY="medium";;
                3) DIFFICULTY="hard";;
                *) DIFFICULTY="";;
            esac

            # Type
            echo ""
            echo "📋 Type de case :"
            echo "  1) Profitability (102)"
            echo "  2) Private Equity (45)"
            echo "  3) Market Entry (5)"
            echo "  4) Pricing (14)"
            echo "  5) M&A (9)"
            echo "  6) Tous"
            read -p "Choisissez : " type_choice

            case $type_choice in
                1) CASE_TYPE="profitability";;
                2) CASE_TYPE="private_equity";;
                3) CASE_TYPE="market_entry";;
                4) CASE_TYPE="pricing";;
                5) CASE_TYPE="mergers_acquisitions";;
                *) CASE_TYPE="";;
            esac

            # Construire l'URL
            QUERY=""
            [ -n "$FIRM" ] && QUERY="${QUERY}&firm=${FIRM}"
            [ -n "$DIFFICULTY" ] && QUERY="${QUERY}&difficulty=${DIFFICULTY}"
            [ -n "$CASE_TYPE" ] && QUERY="${QUERY}&case_type=${CASE_TYPE}"

            echo ""
            echo "🔍 Recherche en cours..."
            RESULTS=$(curl -s "${API_URL}/cases?limit=5${QUERY}")

            TOTAL=$(echo "$RESULTS" | jq -r '.total')
            COUNT=$(echo "$RESULTS" | jq -r '.count')

            echo ""
            echo "📊 Résultats : $TOTAL cases trouvés (affichant les $COUNT premiers)"
            echo ""

            if [ "$TOTAL" -eq 0 ]; then
                echo "❌ Aucun case trouvé avec ces critères"
            else
                echo "$RESULTS" | jq -r '.cases[] | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🆔 ID: \(.case_id)\n📝 Titre: \(.title[0:80])...\n📁 Type: \(.case_type) | Difficulté: \(.difficulty) | Industrie: \(.industry)\n🏢 Source: \(.source.firm) - \(.source.type) - \(.source.filename)\n"'

                echo ""
                read -p "Voir un case en détail ? (ID du case ou Entrée pour continuer) : " case_id

                if [ -n "$case_id" ]; then
                    CASE_DETAIL=$(curl -s "${API_URL}/cases/${case_id}")

                    if echo "$CASE_DETAIL" | jq -e '.error' > /dev/null 2>&1; then
                        echo "❌ Case non trouvé"
                    else
                        echo ""
                        echo "╔════════════════════════════════════════════════════════════════════╗"
                        echo "║                      DÉTAILS DU CASE                               ║"
                        echo "╚════════════════════════════════════════════════════════════════════╝"
                        echo ""
                        echo "$CASE_DETAIL" | jq -r '"🆔 ID: \(.case_id)\n📝 Titre: \(.title)\n\n📋 TYPE: \(.case_type)\n🎚️  DIFFICULTÉ: \(.difficulty)\n🏭 INDUSTRIE: \(.industry)\n\n🏢 SOURCE:\n  Firme: \(.source.firm)\n  Type: \(.source.type)\n  Fichier: \(.source.filename)\n  Round: \(.source.round // "N/A")\n  Process: \(.source.process_type // "N/A")\n  Année: \(.source.year // "N/A")\n\n📄 PROMPT:\n\(.content.prompt)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'

                        # Sauvegarder en JSON
                        echo ""
                        read -p "Sauvegarder ce case en JSON ? (y/n) : " save_choice
                        if [[ "$save_choice" =~ ^[Yy]$ ]]; then
                            FILENAME="case_${case_id}.json"
                            echo "$CASE_DETAIL" > "$FILENAME"
                            echo "✅ Case sauvegardé : $FILENAME"
                        fi
                    fi
                fi
            fi
            ;;

        2)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "CASE ALÉATOIRE"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            RANDOM_CASE=$(curl -s "${API_URL}/random")

            echo "$RANDOM_CASE" | jq -r '"🆔 ID: \(.case_id)\n📝 Titre: \(.title)\n\n📋 TYPE: \(.case_type)\n🎚️  DIFFICULTÉ: \(.difficulty)\n🏭 INDUSTRIE: \(.industry)\n\n🏢 SOURCE:\n  Firme: \(.source.firm)\n  Type: \(.source.type)\n  Fichier: \(.source.filename)\n\n📄 PROMPT:\n\(.content.prompt)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'
            ;;

        3)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "PARCOURIR PAR FIRME"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "  1) McKinsey (16 REX)"
            echo "  2) BCG (40 REX)"
            echo "  3) Bain (16 REX)"
            echo ""
            read -p "Choisissez : " firm_choice

            case $firm_choice in
                1) FIRM="McKinsey";;
                2) FIRM="BCG";;
                3) FIRM="Bain";;
                *) FIRM="";;
            esac

            if [ -n "$FIRM" ]; then
                RESULTS=$(curl -s "${API_URL}/cases?firm=${FIRM}&source_type=REX&limit=10")
                echo ""
                echo "📊 Cases $FIRM :"
                echo ""
                echo "$RESULTS" | jq -r '.cases[] | "🆔 \(.case_id) - \(.title[0:60])...\n   Difficulté: \(.difficulty) | Type: \(.case_type)\n   Source: \(.source.filename)\n"'
            fi
            ;;

        4)
            echo ""
            curl -s "${API_URL}/stats" | jq .
            ;;

        5)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "CASES REX (VRAIS ENTRETIENS)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            RESULTS=$(curl -s "${API_URL}/cases?source_type=REX&limit=10")
            echo "$RESULTS" | jq -r '.cases[] | "🆔 \(.case_id) - \(.source.firm) - \(.title[0:50])...\n   Type: \(.case_type) | Difficulté: \(.difficulty)\n   Source: \(.source.filename)\n"'
            ;;

        6)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "CASEBOOKS"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            RESULTS=$(curl -s "${API_URL}/cases?source_type=Casebook&limit=10")
            echo "$RESULTS" | jq -r '.cases[] | "🆔 \(.case_id) - \(.title[0:60])...\n   Type: \(.case_type) | Difficulté: \(.difficulty)\n   Source: \(.source.filename)\n"'
            ;;

        7)
            echo ""
            echo "👋 Au revoir !"
            echo ""
            exit 0
            ;;

        *)
            echo "❌ Option invalide"
            ;;
    esac

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    echo ""
done
