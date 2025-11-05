#!/bin/bash
# Update knowledge base with new PDFs

echo "🔄 Updating Knowledge Base..."
echo ""

cd backend

echo "1️⃣ Extracting cases from PDFs..."
python3 extractPDFs.py

echo ""
echo "2️⃣ Building knowledge base..."
node buildKnowledgeBase.js

echo ""
echo "✅ Knowledge base updated!"
echo "💡 Restart the server to use the updated knowledge base"
