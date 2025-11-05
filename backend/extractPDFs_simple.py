#!/usr/bin/env python3
"""
Simple PDF Case Extractor using PyPDF2
Reads all PDFs in data/casebooks/ and extracts basic case interview structures
"""

import PyPDF2
import json
import re
from pathlib import Path
from datetime import datetime

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyPDF2"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n\n"
    except Exception as e:
        print(f"  ✗ Error reading {pdf_path.name}: {e}")
    return text

def extract_cases_from_pdf(pdf_path):
    """
    Extract case interview content from a casebook PDF

    Args:
        pdf_path: Path to PDF file

    Returns:
        List of extracted case dictionaries
    """
    cases = []

    print(f"Processing: {pdf_path.name}")

    full_text = extract_text_from_pdf(pdf_path)

    if not full_text or len(full_text) < 100:
        print(f"  ✗ Could not extract text from {pdf_path.name}")
        return []

    # Split into individual cases
    # Common patterns: "CASE:", "Case X:", "Cas:", etc.
    case_sections = re.split(r'(?:CASE[:\s]|Case\s+\d+|Cas\s+\d+|^\d+\.\s+)', full_text, flags=re.MULTILINE)

    for section in case_sections:
        if len(section.strip()) < 100:  # Skip very short sections
            continue

        case_data = parse_case_section(section, pdf_path.name)
        if case_data:
            cases.append(case_data)

    print(f"  ✓ Extracted {len(cases)} cases from {pdf_path.name}")
    return cases

def parse_case_section(text, source_file):
    """
    Parse a single case section into structured data

    Looks for:
    - Prompt/Opening statement
    - Case type
    - Industry
    - Clarifying information
    - Questions
    - Framework guidance
    - Solutions
    """
    case = {
        "source": source_file,
        "raw_text": text[:2000],  # Limit to first 2000 chars
        "prompt": extract_prompt(text),
        "case_type": extract_case_type(text),
        "industry": extract_industry(text),
        "clarifying_info": extract_clarifying_info(text),
        "framework": extract_framework(text),
        "questions": extract_questions(text),
        "conclusion": extract_conclusion(text)
    }

    # Only return if we found substantial content
    if case["prompt"] or len(case["questions"]) > 0 or case["case_type"] != 'general':
        return case
    return None

def extract_prompt(text):
    """Extract the opening statement/prompt"""
    # Look for common patterns
    patterns = [
        r'(?:Prompt|Énoncé|Situation)[:\s]*(.*?)(?:\n\n|Clarif|Question)',
        r'(?:Your client|Notre client|The client) (?:is|has|wants)(.*?)(?:\n\n|\?)',
        r'(?:Client|Situation)[:\s]*(.*?)(?:\n\n|Question:)'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            prompt = match.group(1).strip()
            if len(prompt) > 50:
                return prompt[:500]  # Limit length

    # Fallback: take first substantial paragraph
    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]
    if paragraphs:
        return paragraphs[0][:500]

    return None

def extract_case_type(text):
    """Identify the case type"""
    case_types = {
        'profitability': r'profit(?:abilit[yé])?|margin|rentabilit[ée]|d[ée]clin.*revenu|declining.*revenue',
        'market_entry': r'market entry|entr[ée]e.*march[ée]|expansion|enter(?:ing)?\s+(?:the\s+)?market',
        'mergers_acquisitions': r'M&A|merger|acquisition|fusion|acquisition|buy|purchase|rachat',
        'competitive_response': r'comp[eé]t(?:iteur|ition)|concurren(?:ce|t)|rival|menace|threat',
        'new_product_launch': r'new product|nouveau produit|launch|lancement|introduce',
        'pricing': r'pricing|prix|tarif(?:ication)?|price|priced',
        'cost_reduction': r'cost.*reduc|reduc.*cost|r[ée]duc.*co[uû]t|cut costs|diminuer.*co[uû]t',
        'growth': r'growth|croissance|grow|augment.*revenu|increase.*revenue',
        'private_equity': r'private equity|PE|capital investissement|investment',
        'process_optimization': r'optimi[sz](?:e|ation)|am[ée]lior.*process|efficiency|efficacit[ée]',
        'offshoring': r'offshoring|outsourc(?:e|ing)|external(?:isation|ization)|relocat(?:e|ing)'
    }

    for case_type, pattern in case_types.items():
        if re.search(pattern, text, re.IGNORECASE):
            return case_type
    return 'general'

def extract_industry(text):
    """Identify the industry"""
    industries = {
        'Tech': r'tech(?:nolog(?:ie|y))?|software|SaaS|digital|AI|data|informatique',
        'Retail': r'retail|store|magasin|commerce|shopping|e-commerce|distribution',
        'Healthcare': r'health(?:care)?|sant[ée]|hospital|h[oô]pital|pharma(?:ceutique)?|medical|m[ée]dical',
        'Financial_Services': r'bank(?:ing)?|banque|finance|insurance|assurance|asset management|gestion',
        'Manufacturing': r'manufact(?:uring|urer)|usine|factory|industrial|production|fabrication',
        'Energy': r'energy|[ée]nergie|oil|p[ée]trole|gas|gaz|renewable|renouvelable|solar|solaire|wind|[ée]olien',
        'Consumer_Goods': r'consumer goods|biens.*consommation|CPG|FMCG|beverage|food|alimentaire|boisson'
    }

    for industry, pattern in industries.items():
        if re.search(pattern, text, re.IGNORECASE):
            return industry
    return 'General'

def extract_clarifying_info(text):
    """Extract clarifying information section"""
    patterns = [
        r'Clarif(?:ying|ication)\s*(?:Information|Questions?)[:\s]*(.*?)(?:\n\n|Framework|Question)',
        r'(?:Additional|Plus)\s+(?:d.)?information[:\s]*(.*?)(?:\n\n|Framework|Question)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()[:500]
    return None

def extract_framework(text):
    """Extract framework guidance"""
    frameworks = []

    # Common frameworks to detect
    common_frameworks = [
        'MECE', 'Issue Tree', 'Porter.*5 Forces', '3Cs?', '4Ps?',
        'Revenue.*Cost', 'Co[uû]ts?.*Revenus?', 'Market Attractiveness',
        'Value Chain', 'Cha[iî]ne.*valeur', 'Segmentation', 'SWOT',
        'BCG Matrix', 'Matrice BCG'
    ]

    for framework in common_frameworks:
        if re.search(framework, text, re.IGNORECASE):
            frameworks.append(framework)

    return list(set(frameworks))  # Remove duplicates

def extract_questions(text):
    """Extract interview questions"""
    questions = []

    # Look for numbered questions
    question_patterns = [
        r'(?:Question|Q)\s*(\d+)[:\.]?\s*(.*?)(?=(?:Question|Q)\s*\d+|Solution|Exhibit|$)',
        r'(\d+)[\.]\s+([^\.]{50,}?)(?=\d+\.|$)'
    ]

    for pattern in question_patterns:
        matches = re.finditer(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            if len(match.groups()) >= 2:
                question_num = match.group(1)
                question_text = match.group(2).strip()

                if len(question_text) > 20:  # Only keep substantial questions
                    questions.append({
                        "number": int(question_num),
                        "text": question_text[:500]  # Truncate if too long
                    })

    return questions[:10]  # Limit to first 10 questions

def extract_conclusion(text):
    """Extract conclusion/recommendation section"""
    patterns = [
        r'(?:Conclusion|Recommand(?:ation|ation)s?|Summary|R[ée]sum[ée])[:\s]*(.*?)(?:\n\n\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()[:500]
    return None

def process_all_pdfs(casebooks_folder="../data/casebooks"):
    """
    Process all PDFs in the casebooks folder

    Returns:
        List of all extracted cases
    """
    all_cases = []
    pdf_files = list(Path(casebooks_folder).glob("*.pdf"))

    print(f"\n📚 Processing {len(pdf_files)} PDF files...\n")

    for pdf_file in pdf_files:
        try:
            cases = extract_cases_from_pdf(pdf_file)
            all_cases.extend(cases)
        except Exception as e:
            print(f"  ✗ Error processing {pdf_file.name}: {e}")

    print(f"\n✓ Total cases extracted: {len(all_cases)}\n")

    # Save extraction results
    output = {
        "extraction_date": datetime.now().isoformat(),
        "total_cases": len(all_cases),
        "sources": [f.name for f in pdf_files],
        "cases": all_cases
    }

    with open("../data/extracted_cases.json", "w", encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("✓ Saved to ../data/extracted_cases.json")

    return all_cases

if __name__ == "__main__":
    # Run extraction
    cases = process_all_pdfs()

    # Display summary
    print("\n" + "="*60)
    print("EXTRACTION SUMMARY")
    print("="*60)

    case_types = {}
    industries = {}

    for case in cases:
        ct = case.get("case_type", "unknown")
        ind = case.get("industry", "unknown")
        case_types[ct] = case_types.get(ct, 0) + 1
        industries[ind] = industries.get(ind, 0) + 1

    print("\nCase Types:")
    for ct, count in sorted(case_types.items(), key=lambda x: -x[1]):
        print(f"  {ct}: {count}")

    print("\nIndustries:")
    for ind, count in sorted(industries.items(), key=lambda x: -x[1]):
        print(f"  {ind}: {count}")

    print("\n" + "="*60)
