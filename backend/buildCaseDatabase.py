#!/usr/bin/env python3
"""
Case Database Builder
Restructure les cases extraits avec métadonnées enrichies
"""

import json
import re
from datetime import datetime
from collections import defaultdict

def classify_source(filename):
    """
    Classifie la source du case
    Returns: dict avec type, firm, metadata
    """
    source_info = {
        "filename": filename,
        "type": "unknown",
        "firm": "unknown",
        "round": None,
        "process_type": None,
        "year": None,
        "candidate": None
    }

    # Identifier si c'est un REX ou Casebook
    if filename.upper().startswith("REX"):
        source_info["type"] = "REX"

        # Extraire la firme
        if "McKinsey" in filename or "MCK" in filename or "MK_" in filename:
            source_info["firm"] = "McKinsey"
        elif "BCG" in filename:
            source_info["firm"] = "BCG"
        elif "Bain" in filename:
            source_info["firm"] = "Bain"
        elif "Kea" in filename:
            source_info["firm"] = "Kea & Partners"

        # Extraire le round (T1, T2, etc.)
        round_match = re.search(r'T(\d+)', filename)
        if round_match:
            source_info["round"] = f"T{round_match.group(1)}"

        # Extraire le type de processus
        if "Stage" in filename or "SFE" in filename:
            source_info["process_type"] = "Stage"
        elif "CDI" in filename:
            source_info["process_type"] = "CDI"

        # Extraire l'année
        year_match = re.search(r'20(\d{2})', filename)
        if year_match:
            source_info["year"] = f"20{year_match.group(1)}"

        # Extraire le nom du candidat si présent
        name_patterns = [
            r'REX-[^-]+-([A-Z][a-z]+-[A-Z][a-z]+)',
            r'Rex-([A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+)',
        ]
        for pattern in name_patterns:
            name_match = re.search(pattern, filename)
            if name_match:
                source_info["candidate"] = name_match.group(1)
                break

    elif "Casebook" in filename or "Case" in filename or "Darden" in filename or "Stern" in filename or "Columbia" in filename or "ESADE" in filename:
        source_info["type"] = "Casebook"
        source_info["firm"] = "Business School"

        # Identifier l'école
        if "Darden" in filename:
            source_info["school"] = "Darden"
        elif "Stern" in filename:
            source_info["school"] = "Stern (NYU)"
        elif "Columbia" in filename:
            source_info["school"] = "Columbia"
        elif "ESADE" in filename:
            source_info["school"] = "ESADE"

        # Extraire l'année
        year_match = re.search(r'20(\d{2})', filename)
        if year_match:
            source_info["year"] = f"20{year_match.group(1)}"

    else:
        # Autres cas
        if "McKinsey" in filename:
            source_info["firm"] = "McKinsey"
        elif "BCG" in filename:
            source_info["firm"] = "BCG"
        elif "Bain" in filename:
            source_info["firm"] = "Bain"

    return source_info

def estimate_difficulty(case_data):
    """
    Estime la difficulté du case basée sur différents critères
    Returns: 'easy', 'medium', 'hard'
    """
    score = 0

    # Critère 1: Longueur du texte (complexité)
    text_length = len(case_data.get("raw_text", ""))
    if text_length > 2000:
        score += 2
    elif text_length > 1000:
        score += 1

    # Critère 2: Nombre de questions
    nb_questions = len(case_data.get("questions", []))
    if nb_questions >= 3:
        score += 2
    elif nb_questions >= 1:
        score += 1

    # Critère 3: Présence de frameworks complexes
    frameworks = case_data.get("framework", [])
    if any("Porter" in f or "Matrix" in f or "Value Chain" in f for f in frameworks):
        score += 1

    # Critère 4: Type de case (certains sont intrinsèquement plus difficiles)
    case_type = case_data.get("case_type", "")
    if case_type in ["private_equity", "mergers_acquisitions"]:
        score += 1
    elif case_type in ["profitability", "pricing"]:
        score += 0

    # Critère 5: Industrie (certaines sont plus techniques)
    industry = case_data.get("industry", "")
    if industry in ["Tech", "Financial_Services", "Healthcare"]:
        score += 1

    # Critère 6: Présence de conclusion (case complet)
    if case_data.get("conclusion"):
        score += 1

    # Mapping score -> difficulté
    if score >= 5:
        return "hard"
    elif score >= 3:
        return "medium"
    else:
        return "easy"

def extract_case_title(case_data):
    """
    Extrait ou génère un titre pour le case
    """
    prompt = case_data.get("prompt", "")

    # Chercher un titre dans le prompt
    if prompt:
        # Prendre les premiers mots significatifs
        first_sentence = prompt.split('.')[0][:100]
        return first_sentence.strip()

    # Sinon, générer un titre basé sur le type
    case_type = case_data.get("case_type", "general")
    industry = case_data.get("industry", "General")
    return f"{industry} - {case_type.replace('_', ' ').title()}"

def build_structured_database():
    """
    Construit la base de données structurée des cases
    """
    # Charger les cases extraits
    with open("../data/extracted_cases.json", "r", encoding='utf-8') as f:
        data = json.load(f)

    cases = data["cases"]

    print(f"\n📚 Structuration de {len(cases)} cases...\n")

    # Créer la nouvelle structure
    structured_db = {
        "build_date": datetime.now().isoformat(),
        "total_cases": len(cases),
        "version": "1.0",
        "cases": [],
        "metadata": {
            "by_type": defaultdict(int),
            "by_firm": defaultdict(int),
            "by_difficulty": defaultdict(int),
            "by_industry": defaultdict(int),
            "by_source_type": defaultdict(int)
        }
    }

    # Traiter chaque case
    for idx, case in enumerate(cases):
        source_info = classify_source(case["source"])
        difficulty = estimate_difficulty(case)
        title = extract_case_title(case)

        # Créer l'entrée structurée
        structured_case = {
            "case_id": f"case_{idx+1:04d}",
            "title": title,
            "case_type": case.get("case_type", "general"),
            "industry": case.get("industry", "General"),
            "difficulty": difficulty,
            "source": source_info,
            "content": {
                "prompt": case.get("prompt", "")[:500],  # Limiter pour l'index
                "full_text": case.get("raw_text", "")[:2000],  # Limiter
                "clarifying_info": case.get("clarifying_info"),
                "framework": case.get("framework", []),
                "questions": case.get("questions", []),
                "conclusion": case.get("conclusion")
            },
            "tags": []
        }

        # Ajouter des tags
        if source_info["type"] == "REX":
            structured_case["tags"].append("real_interview")
            structured_case["tags"].append(source_info["firm"].lower())
        if source_info["type"] == "Casebook":
            structured_case["tags"].append("casebook")
        if source_info.get("process_type"):
            structured_case["tags"].append(source_info["process_type"].lower())

        structured_db["cases"].append(structured_case)

        # Mettre à jour les métadonnées
        structured_db["metadata"]["by_type"][case.get("case_type", "general")] += 1
        structured_db["metadata"]["by_firm"][source_info["firm"]] += 1
        structured_db["metadata"]["by_difficulty"][difficulty] += 1
        structured_db["metadata"]["by_industry"][case.get("industry", "General")] += 1
        structured_db["metadata"]["by_source_type"][source_info["type"]] += 1

        if (idx + 1) % 50 == 0:
            print(f"  ✓ Traité {idx + 1}/{len(cases)} cases...")

    # Convertir defaultdict en dict normal
    structured_db["metadata"]["by_type"] = dict(structured_db["metadata"]["by_type"])
    structured_db["metadata"]["by_firm"] = dict(structured_db["metadata"]["by_firm"])
    structured_db["metadata"]["by_difficulty"] = dict(structured_db["metadata"]["by_difficulty"])
    structured_db["metadata"]["by_industry"] = dict(structured_db["metadata"]["by_industry"])
    structured_db["metadata"]["by_source_type"] = dict(structured_db["metadata"]["by_source_type"])

    # Sauvegarder
    with open("../data/cases_database.json", "w", encoding='utf-8') as f:
        json.dump(structured_db, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Base de données créée : {len(structured_db['cases'])} cases")
    print(f"📁 Sauvegardée dans : data/cases_database.json\n")

    return structured_db

def print_summary(db):
    """
    Affiche un résumé de la base de données
    """
    print("=" * 70)
    print("RÉSUMÉ DE LA BASE DE DONNÉES")
    print("=" * 70)

    print(f"\n📊 TOTAL : {db['total_cases']} cases")

    print("\n🏢 PAR FIRME :")
    for firm, count in sorted(db["metadata"]["by_firm"].items(), key=lambda x: -x[1]):
        print(f"  {firm}: {count} cases")

    print("\n📁 PAR TYPE DE SOURCE :")
    for source_type, count in sorted(db["metadata"]["by_source_type"].items(), key=lambda x: -x[1]):
        print(f"  {source_type}: {count} cases")

    print("\n🎯 PAR TYPE DE CASE :")
    for case_type, count in sorted(db["metadata"]["by_type"].items(), key=lambda x: -x[1])[:10]:
        print(f"  {case_type}: {count} cases")

    print("\n🎚️  PAR DIFFICULTÉ :")
    for difficulty, count in sorted(db["metadata"]["by_difficulty"].items()):
        print(f"  {difficulty}: {count} cases")

    print("\n🏭 PAR INDUSTRIE :")
    for industry, count in sorted(db["metadata"]["by_industry"].items(), key=lambda x: -x[1])[:10]:
        print(f"  {industry}: {count} cases")

    print("\n" + "=" * 70)

    # Exemples de cases par firme
    print("\n📝 EXEMPLES DE CASES PAR FIRME :\n")
    for firm in ["McKinsey", "BCG", "Bain"]:
        firm_cases = [c for c in db["cases"] if c["source"]["firm"] == firm][:3]
        if firm_cases:
            print(f"  {firm} ({len([c for c in db['cases'] if c['source']['firm'] == firm])} cases) :")
            for case in firm_cases:
                print(f"    - {case['case_id']}: {case['title'][:80]}...")
                print(f"      Type: {case['case_type']}, Difficulté: {case['difficulty']}, Source: {case['source']['filename']}")
            print()

if __name__ == "__main__":
    db = build_structured_database()
    print_summary(db)
