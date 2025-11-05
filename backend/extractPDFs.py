#!/usr/bin/env python3
"""
PDF Case Extractor
Reads all PDFs in data/casebooks/ and extracts case interview structures
"""

import pdfplumber
import json
import re
from pathlib import Path
from datetime import datetime

def extract_cases_from_pdf(pdf_path):
    """
    Extract case interview content from a casebook PDF

    Args:
        pdf_path: Path to PDF file

    Returns:
        List of extracted case dictionaries
    """
    cases = []
    current_case = None

    print(f"Processing: {pdf_path}")

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n\n"

    # Split into individual cases
    # Common patterns: "CASE:", "Case X:", page numbers, etc.
    case_sections = re.split(r'(?:CASE[:\s]|Case\s+\d+|^\d+\s*$)', full_text, flags=re.MULTILINE)

    for section in case_sections:
        if len(section.strip()) < 100:  # Skip very short sections
            continue

        case_data = parse_case_section(section)
        if case_data:
            cases.append(case_data)

    print(f"  ✓ Extracted {len(cases)} cases")
    return cases

def parse_case_section(text):
    """
    Parse a single case section into structured data

    Looks for:
    - Prompt/Opening statement
    - Case type
    - Industry
    - Clarifying information
    - Questions
    - Framework guidance
    - Exhibits
    - Solutions
    """
    case = {
        "raw_text": text,
        "prompt": extract_prompt(text),
        "case_type": extract_case_type(text),
        "industry": extract_industry(text),
        "clarifying_info": extract_clarifying_info(text),
        "framework": extract_framework(text),
        "questions": extract_questions(text),
        "exhibits": extract_exhibits(text),
        "conclusion": extract_conclusion(text)
    }

    # Only return if we found substantial content
    if case["prompt"] or len(case["questions"]) > 0:
        return case
    return None

def extract_prompt(text):
    """Extract the opening statement/prompt"""
    # Look for common patterns like "Your client is...", "Prompt:", etc.
    patterns = [
        r'Prompt:\s*\n(.*?)(?:\n\n|Clarifying)',
        r'Your client (?:is|has|wants)(.*?)(?:\n\n|\?)',
        r'(?:Client|Situation):\s*(.*?)(?:\n\n|Question:)'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def extract_case_type(text):
    """Identify the case type"""
    case_types = {
        'profitability': r'profit(?:ability)?|margin|declining.*revenue',
        'market_entry': r'market entry|enter(?:ing)? (?:the )?market|expansion',
        'mergers_acquisitions': r'M&A|merger|acquisition|buy|purchase',
        'competitive_response': r'compet(?:itor|ition)|rival|threat',
        'new_product_launch': r'new product|launch|introduce',
        'pricing': r'pricing|price|priced',
        'cost_reduction': r'cost.*reduc|reduc.*cost|cut costs',
        'growth': r'growth|grow|increase.*revenue',
        'private_equity': r'private equity|PE|investment',
        'process_optimization': r'optimi[zs](?:e|ation)|improve.*process|efficiency',
        'offshoring': r'offshoring|outsourc(?:e|ing)|relocat(?:e|ing)'
    }

    for case_type, pattern in case_types.items():
        if re.search(pattern, text, re.IGNORECASE):
            return case_type
    return 'general'

def extract_industry(text):
    """Identify the industry"""
    industries = {
        'Tech': r'tech(?:nology)?|software|SaaS|digital|AI|data',
        'Retail': r'retail|store|shopping|e-commerce',
        'Healthcare': r'health(?:care)?|hospital|pharma|medical',
        'Financial_Services': r'bank(?:ing)?|finance|insurance|asset management',
        'Manufacturing': r'manufact(?:uring|urer)|factory|industrial|production',
        'Energy': r'energy|oil|gas|renewable|solar|wind',
        'Consumer_Goods': r'consumer goods|CPG|FMCG|beverage|food'
    }

    for industry, pattern in industries.items():
        if re.search(pattern, text, re.IGNORECASE):
            return industry
    return 'General'

def extract_clarifying_info(text):
    """Extract clarifying information section"""
    match = re.search(
        r'Clarifying\s*(?:Information|Questions?):\s*(.*?)(?:\n\n|Framework|Question)',
        text,
        re.DOTALL | re.IGNORECASE
    )
    if match:
        return match.group(1).strip()
    return None

def extract_framework(text):
    """Extract framework guidance"""
    frameworks = []

    # Look for framework mentions
    framework_patterns = [
        r'Framework:?\s*(.*?)(?:\n\n|Question)',
        r'Approach:?\s*(.*?)(?:\n\n|Question)',
        r'(?:use|consider|apply)\s+(?:the\s+)?([A-Z][A-Z\s&]+)(?:framework|analysis)'
    ]

    for pattern in framework_patterns:
        matches = re.finditer(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            frameworks.append(match.group(1).strip())

    # Common frameworks to detect
    common_frameworks = [
        'MECE', 'Issue Tree', 'Porter.*5 Forces', '3Cs', '4Ps',
        'Revenue.*Cost', 'Market Attractiveness', 'Value Chain',
        'Segmentation', 'SWOT', 'BCG Matrix'
    ]

    for framework in common_frameworks:
        if re.search(framework, text, re.IGNORECASE):
            frameworks.append(framework)

    return list(set(frameworks))  # Remove duplicates

def extract_questions(text):
    """Extract interview questions"""
    questions = []

    # Look for numbered questions
    question_pattern = r'(?:Question|Q)\s*(\d+)[:\.]?\s*(.*?)(?=(?:Question|Q)\s*\d+|Solution|Exhibit|$)'
    matches = re.finditer(question_pattern, text, re.DOTALL | re.IGNORECASE)

    for match in matches:
        question_num = match.group(1)
        question_text = match.group(2).strip()

        questions.append({
            "number": int(question_num),
            "text": question_text[:500]  # Truncate if too long
        })

    return questions

def extract_exhibits(text):
    """Extract exhibits/data tables"""
    exhibits = []

    # Look for exhibit markers
    exhibit_pattern = r'EXHIBIT\s+(\d+)[:\.]?\s*(.*?)(?=EXHIBIT|\n\n\n|$)'
    matches = re.finditer(exhibit_pattern, text, re.DOTALL | re.IGNORECASE)

    for match in matches:
        exhibit_num = match.group(1)
        exhibit_content = match.group(2).strip()

        exhibits.append({
            "number": int(exhibit_num),
            "content": exhibit_content[:1000]
        })

    return exhibits

def extract_conclusion(text):
    """Extract conclusion/recommendation section"""
    match = re.search(
        r'(?:Conclusion|Recommendation|Summary):\s*(.*?)(?:\n\n\n|$)',
        text,
        re.DOTALL | re.IGNORECASE
    )
    if match:
        return match.group(1).strip()
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

    with open("../data/extracted_cases.json", "w") as f:
        json.dump(output, f, indent=2)

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
