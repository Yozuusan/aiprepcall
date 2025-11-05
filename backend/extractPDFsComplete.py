#!/usr/bin/env python3
"""
Complete PDF Case Extractor with Visual Assets
Extracts text, tables, images, and creates screenshots from casebook PDFs
"""

import pdfplumber
import fitz  # PyMuPDF
from pdf2image import convert_from_path
import json
import re
from pathlib import Path
from datetime import datetime
from PIL import Image
import io

class CompleteCaseExtractor:
    """
    Complete extraction system for casebook PDFs
    Handles text, tables, images, and screenshots
    """

    def __init__(self, output_dir="data"):
        self.output_dir = Path(output_dir)
        self.exhibits_dir = self.output_dir / "exhibits"
        self.exhibits_dir.mkdir(parents=True, exist_ok=True)

    def extract_complete_pdf(self, pdf_path):
        """
        Extract all content from a PDF including visual assets

        Args:
            pdf_path: Path to PDF file

        Returns:
            Dictionary with complete extraction data
        """
        pdf_path = Path(pdf_path)
        pdf_name = pdf_path.stem

        print(f"\n{'='*60}")
        print(f"Processing: {pdf_path.name}")
        print(f"{'='*60}\n")

        # Create exhibit directory for this PDF
        pdf_exhibits_dir = self.exhibits_dir / pdf_name
        pdf_exhibits_dir.mkdir(exist_ok=True)

        # Extract text and tables with pdfplumber
        print("📄 Extracting text and tables...")
        text_data = self._extract_text_and_tables(pdf_path)

        # Extract embedded images with PyMuPDF
        print("🖼️  Extracting embedded images...")
        images = self._extract_images(pdf_path, pdf_exhibits_dir)

        # Detect pages with exhibits
        print("🔍 Detecting exhibit pages...")
        exhibit_pages = self._detect_exhibit_pages(text_data)

        # Create screenshots of exhibit pages
        print("📸 Creating exhibit screenshots...")
        screenshots = self._create_exhibit_screenshots(
            pdf_path,
            exhibit_pages,
            pdf_exhibits_dir
        )

        # Parse case structure
        print("📋 Parsing case structure...")
        cases = self._parse_cases(text_data, images, screenshots, pdf_name)

        print(f"\n✓ Extraction complete!")
        print(f"  - {len(cases)} cases found")
        print(f"  - {len(images)} images extracted")
        print(f"  - {len(screenshots)} screenshots created")

        return {
            "source": pdf_path.name,
            "cases": cases,
            "extraction_metadata": {
                "date": datetime.now().isoformat(),
                "total_cases": len(cases),
                "total_images": len(images),
                "total_screenshots": len(screenshots)
            }
        }

    def _extract_text_and_tables(self, pdf_path):
        """Extract text and tables using pdfplumber"""
        pages_data = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # Extract text
                text = page.extract_text() or ""

                # Extract tables
                tables = []
                try:
                    page_tables = page.extract_tables()
                    if page_tables:
                        for table_idx, table in enumerate(page_tables):
                            # Convert table to structured format
                            if len(table) > 0:
                                headers = table[0] if table[0] else []
                                data_rows = table[1:] if len(table) > 1 else []

                                # Create structured table
                                structured_table = {
                                    "table_index": table_idx,
                                    "headers": headers,
                                    "rows": data_rows,
                                    "data": []
                                }

                                # Convert to dict format
                                for row in data_rows:
                                    if row and len(row) == len(headers):
                                        row_dict = {}
                                        for idx, header in enumerate(headers):
                                            if header:
                                                row_dict[header] = row[idx] if idx < len(row) else ""
                                        if row_dict:
                                            structured_table["data"].append(row_dict)

                                tables.append(structured_table)
                except Exception as e:
                    print(f"  ⚠️  Warning: Could not extract tables from page {page_num}: {e}")

                pages_data.append({
                    "page_number": page_num,
                    "text": text,
                    "tables": tables
                })

        return pages_data

    def _extract_images(self, pdf_path, output_dir):
        """Extract embedded images using PyMuPDF"""
        images = []

        try:
            doc = fitz.open(pdf_path)

            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)

                for img_index, img in enumerate(image_list):
                    try:
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]

                        # Save image
                        image_filename = f"page{page_num + 1}_img{img_index + 1}.{image_ext}"
                        image_path = output_dir / image_filename

                        with open(image_path, "wb") as img_file:
                            img_file.write(image_bytes)

                        # Get image dimensions
                        img_obj = Image.open(io.BytesIO(image_bytes))
                        width, height = img_obj.size

                        images.append({
                            "page": page_num + 1,
                            "filename": image_filename,
                            "filepath": str(image_path.relative_to(self.output_dir.parent)),
                            "type": "embedded_image",
                            "format": image_ext,
                            "width": width,
                            "height": height
                        })

                    except Exception as e:
                        print(f"  ⚠️  Warning: Could not extract image {img_index + 1} from page {page_num + 1}: {e}")

            doc.close()

        except Exception as e:
            print(f"  ⚠️  Warning: Could not extract images from PDF: {e}")

        return images

    def _detect_exhibit_pages(self, pages_data):
        """Detect which pages contain exhibits"""
        exhibit_pages = []

        exhibit_patterns = [
            r'EXHIBIT\s+\d+',
            r'Exhibit\s+\d+',
            r'TABLE\s+\d+',
            r'FIGURE\s+\d+',
            r'Variable\s+[A-Z]:',
            r'Pool\s+Options',
            r'Hotel\s+Stories'
        ]

        for page_data in pages_data:
            text = page_data["text"]
            page_num = page_data["page_number"]

            # Check for exhibit patterns
            for pattern in exhibit_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    if page_num not in exhibit_pages:
                        exhibit_pages.append(page_num)
                    break

            # Also check if page has tables
            if page_data["tables"] and len(page_data["tables"]) > 0:
                if page_num not in exhibit_pages:
                    exhibit_pages.append(page_num)

        return sorted(exhibit_pages)

    def _create_exhibit_screenshots(self, pdf_path, exhibit_pages, output_dir):
        """Create high-quality screenshots of exhibit pages"""
        screenshots = []

        if not exhibit_pages:
            return screenshots

        try:
            # Convert only exhibit pages to images
            for page_num in exhibit_pages:
                try:
                    # Convert single page (pdf2image uses 1-based indexing)
                    images = convert_from_path(
                        pdf_path,
                        dpi=200,  # High quality
                        first_page=page_num,
                        last_page=page_num
                    )

                    if images:
                        img = images[0]

                        # Save screenshot
                        screenshot_filename = f"exhibit_page{page_num}.png"
                        screenshot_path = output_dir / screenshot_filename
                        img.save(screenshot_path, "PNG")

                        screenshots.append({
                            "page": page_num,
                            "filename": screenshot_filename,
                            "filepath": str(screenshot_path.relative_to(self.output_dir.parent)),
                            "type": "screenshot",
                            "width": img.width,
                            "height": img.height
                        })

                except Exception as e:
                    print(f"  ⚠️  Warning: Could not create screenshot for page {page_num}: {e}")

        except Exception as e:
            print(f"  ⚠️  Warning: Could not create screenshots: {e}")

        return screenshots

    def _parse_cases(self, pages_data, images, screenshots, pdf_name):
        """Parse individual cases from the extracted data"""
        cases = []

        # Combine all text
        full_text = "\n\n".join([page["text"] for page in pages_data])

        # Split into cases (basic implementation - can be improved)
        case_sections = self._split_into_cases(full_text, pages_data)

        for case_idx, case_section in enumerate(case_sections):
            case_data = self._parse_single_case(
                case_section,
                pages_data,
                images,
                screenshots,
                pdf_name,
                case_idx
            )

            if case_data:
                cases.append(case_data)

        return cases

    def _split_into_cases(self, full_text, pages_data):
        """Split full text into individual cases"""
        # Look for case boundaries
        # Common patterns: "CASE:", "Case X:", page separators, etc.

        case_sections = []

        # Try to split by common patterns
        patterns = [
            r'(?=CASE\s*:)',
            r'(?=Case\s+\d+)',
            r'(?=^\d+\s*\|\s*)',
            r'(?=^Page\s+\d+.*CASE)'
        ]

        # Try each pattern
        for pattern in patterns:
            sections = re.split(pattern, full_text, flags=re.MULTILINE)
            if len(sections) > 1:
                case_sections = [s.strip() for s in sections if len(s.strip()) > 200]
                break

        # If no pattern matched, treat entire PDF as one case (or split by pages)
        if not case_sections:
            # Fallback: group pages into cases (approximate)
            case_sections = []
            current_case = []

            for page in pages_data:
                current_case.append(page["text"])

                # Simple heuristic: if we see conclusion/summary, end the case
                if re.search(r'(?:Conclusion|Recommendation|End of Case)',
                           page["text"], re.IGNORECASE):
                    if current_case:
                        case_sections.append("\n\n".join(current_case))
                        current_case = []

            # Add remaining
            if current_case:
                case_sections.append("\n\n".join(current_case))

        return case_sections

    def _parse_single_case(self, case_text, pages_data, images, screenshots, pdf_name, case_idx):
        """Parse a single case into structured format"""

        # Extract case components
        case = {
            "case_id": f"{pdf_name}_case_{case_idx + 1}",
            "source": pdf_name,
            "content": {
                "prompt": self._extract_prompt(case_text),
                "clarifying_information": self._extract_clarifying(case_text),
                "framework": self._extract_framework(case_text),
                "questions": self._extract_questions(case_text),
                "exhibits": self._extract_exhibits_from_text(case_text, pages_data, images, screenshots),
                "conclusion": self._extract_conclusion(case_text)
            },
            "metadata": {
                "case_type": self._extract_case_type(case_text),
                "industry": self._extract_industry(case_text),
                "difficulty": self._estimate_difficulty(case_text),
            },
            "visual_assets": {
                "images": [],  # Will be populated based on relevant pages
                "screenshots": []  # Will be populated based on relevant pages
            },
            "stats": {
                "num_questions": 0,
                "num_exhibits": 0,
                "num_images": 0,
                "num_screenshots": 0,
                "has_visual_assets": False
            }
        }

        # Update stats
        case["stats"]["num_questions"] = len(case["content"]["questions"])
        case["stats"]["num_exhibits"] = len(case["content"]["exhibits"])

        # Link relevant visual assets
        # (This is a simple implementation - could be improved with better page matching)
        case["visual_assets"]["images"] = images
        case["visual_assets"]["screenshots"] = screenshots
        case["stats"]["num_images"] = len(images)
        case["stats"]["num_screenshots"] = len(screenshots)
        case["stats"]["has_visual_assets"] = len(images) > 0 or len(screenshots) > 0

        return case if case["content"]["prompt"] or case["content"]["questions"] else None

    # Helper extraction methods (similar to original script)

    def _extract_prompt(self, text):
        """Extract the opening statement/prompt"""
        patterns = [
            r'Prompt:\s*\n(.*?)(?:\n\n|Clarifying)',
            r'Your client (?:is|has|wants)(.*?)(?:\n\n|\?)',
            r'(?:Client|Situation):\s*(.*?)(?:\n\n|Question:)',
            r'^(Our client.*?)(?:\n\n)',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()[:1000]
        return None

    def _extract_clarifying(self, text):
        """Extract clarifying information"""
        match = re.search(
            r'Clarifying\s*(?:Information|Questions?):\s*(.*?)(?:\n\n|Framework|Question)',
            text,
            re.DOTALL | re.IGNORECASE
        )
        if match:
            return match.group(1).strip()
        return None

    def _extract_framework(self, text):
        """Extract framework mentions"""
        frameworks = []
        common_frameworks = [
            'MECE', 'Issue Tree', 'Porter.*5 Forces', '3Cs', '4Ps',
            'Revenue.*Cost', 'Market Attractiveness', 'Value Chain'
        ]

        for framework in common_frameworks:
            if re.search(framework, text, re.IGNORECASE):
                frameworks.append(framework)

        return frameworks

    def _extract_questions(self, text):
        """Extract numbered questions"""
        questions = []

        question_pattern = r'(?:Question|Q)\s*(\d+)[:\.]?\s*(.*?)(?=(?:Question|Q)\s*\d+|Solution|Exhibit|$)'
        matches = re.finditer(question_pattern, text, re.DOTALL | re.IGNORECASE)

        for match in matches:
            question_num = match.group(1)
            question_text = match.group(2).strip()

            # Check if it has calculations
            has_calculation = bool(re.search(r'calculate|compute|×|÷|\+|-|=', question_text, re.IGNORECASE))

            questions.append({
                "number": int(question_num),
                "text": question_text[:500],
                "has_calculation": has_calculation
            })

        return questions

    def _extract_exhibits_from_text(self, text, pages_data, images, screenshots):
        """Extract exhibit information and link to visual assets"""
        exhibits = []

        exhibit_pattern = r'EXHIBIT\s+(\d+)[:\.]?\s*(.*?)(?=EXHIBIT|\n\n\n|$)'
        matches = re.finditer(exhibit_pattern, text, re.DOTALL | re.IGNORECASE)

        for match in matches:
            exhibit_num = match.group(1)
            exhibit_content = match.group(2).strip()

            # Try to find associated table data
            table_data = None
            for page_data in pages_data:
                if f"EXHIBIT {exhibit_num}" in page_data["text"].upper():
                    if page_data["tables"]:
                        table_data = page_data["tables"][0]  # Get first table on page
                    break

            exhibit = {
                "exhibit_number": int(exhibit_num),
                "type": "table" if table_data else "text",
                "content": exhibit_content[:500]
            }

            if table_data:
                exhibit["headers"] = table_data.get("headers", [])
                exhibit["data"] = table_data.get("data", [])

            exhibits.append(exhibit)

        return exhibits

    def _extract_conclusion(self, text):
        """Extract conclusion section"""
        match = re.search(
            r'(?:Conclusion|Recommendation|Summary):\s*(.*?)(?:\n\n\n|$)',
            text,
            re.DOTALL | re.IGNORECASE
        )
        if match:
            return match.group(1).strip()[:500]
        return None

    def _extract_case_type(self, text):
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
        }

        for case_type, pattern in case_types.items():
            if re.search(pattern, text, re.IGNORECASE):
                return case_type
        return 'general'

    def _extract_industry(self, text):
        """Identify the industry"""
        industries = {
            'Tech': r'tech(?:nology)?|software|SaaS',
            'Retail': r'retail|store|shopping',
            'Healthcare': r'health(?:care)?|hospital|pharma',
            'Financial Services': r'bank(?:ing)?|finance|insurance',
            'Manufacturing': r'manufact(?:uring|urer)|factory',
            'Energy': r'energy|oil|gas',
            'Real Estate': r'real estate|hotel|resort|property'
        }

        for industry, pattern in industries.items():
            if re.search(pattern, text, re.IGNORECASE):
                return industry
        return 'General'

    def _estimate_difficulty(self, text):
        """Estimate case difficulty based on content"""
        # Simple heuristic: more questions + calculations = harder
        num_questions = len(re.findall(r'(?:Question|Q)\s*\d+', text, re.IGNORECASE))
        has_calculations = bool(re.search(r'calculate|compute|×|÷', text, re.IGNORECASE))
        num_exhibits = len(re.findall(r'EXHIBIT\s+\d+', text, re.IGNORECASE))

        score = 0
        if num_questions >= 5: score += 2
        elif num_questions >= 3: score += 1

        if has_calculations: score += 1
        if num_exhibits >= 2: score += 1

        if score >= 4:
            return "hard"
        elif score >= 2:
            return "medium"
        else:
            return "easy"


def process_all_casebooks(casebooks_dir="data/casebooks", output_file="data/casebooks_complete.json"):
    """
    Process all PDFs in casebooks directory

    Args:
        casebooks_dir: Directory containing PDF files
        output_file: Output JSON file path

    Returns:
        Complete extraction data
    """
    casebooks_path = Path(casebooks_dir)
    pdf_files = list(casebooks_path.glob("*.pdf"))

    if not pdf_files:
        print("\n⚠️  No PDF files found in", casebooks_dir)
        print("   Please add PDF casebooks to this directory first.\n")
        return None

    print(f"\n{'='*60}")
    print(f"COMPLETE PDF EXTRACTION SYSTEM")
    print(f"{'='*60}")
    print(f"\n📚 Found {len(pdf_files)} PDF file(s) to process\n")

    extractor = CompleteCaseExtractor()
    all_results = []

    for pdf_file in pdf_files:
        try:
            result = extractor.extract_complete_pdf(pdf_file)
            all_results.append(result)
        except Exception as e:
            print(f"\n❌ Error processing {pdf_file.name}: {e}\n")
            import traceback
            traceback.print_exc()

    # Compile complete output
    total_cases = sum(len(r["cases"]) for r in all_results)
    total_images = sum(r["extraction_metadata"]["total_images"] for r in all_results)
    total_screenshots = sum(r["extraction_metadata"]["total_screenshots"] for r in all_results)

    output = {
        "metadata": {
            "extraction_date": datetime.now().isoformat(),
            "total_pdfs": len(pdf_files),
            "total_cases": total_cases,
            "total_images": total_images,
            "total_screenshots": total_screenshots,
            "features": [
                "text_extraction",
                "table_extraction",
                "image_extraction",
                "exhibit_screenshots"
            ]
        },
        "sources": [r["source"] for r in all_results],
        "cases": []
    }

    # Flatten all cases
    for result in all_results:
        output["cases"].extend(result["cases"])

    # Save to JSON
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'='*60}")
    print(f"\n✓ Processed {len(pdf_files)} PDF(s)")
    print(f"✓ Extracted {total_cases} case(s)")
    print(f"✓ Extracted {total_images} image(s)")
    print(f"✓ Created {total_screenshots} screenshot(s)")
    print(f"\n💾 Saved to: {output_path}")
    print(f"📁 Visual assets in: data/exhibits/\n")

    return output


if __name__ == "__main__":
    # Run complete extraction
    result = process_all_casebooks()

    if result:
        print("\n" + "="*60)
        print("STATISTICS")
        print("="*60)

        # Count by case type
        case_types = {}
        for case in result["cases"]:
            ct = case["metadata"].get("case_type", "unknown")
            case_types[ct] = case_types.get(ct, 0) + 1

        print("\nCase Types:")
        for ct, count in sorted(case_types.items(), key=lambda x: -x[1]):
            print(f"  {ct}: {count}")

        # Count cases with visual assets
        cases_with_visuals = sum(1 for c in result["cases"] if c["stats"]["has_visual_assets"])
        print(f"\nCases with visual assets: {cases_with_visuals}/{len(result['cases'])}")
