#!/usr/bin/env python3
"""
Casebook Segmentation Tool
Transforms extracted cases into organized library structure
"""

import json
import shutil
from pathlib import Path
from datetime import datetime
import re

class CaseLibraryBuilder:
    """
    Builds an organized case library from extracted casebook data
    """

    def __init__(self, library_dir="data/library"):
        self.library_dir = Path(library_dir)
        self.cases_dir = self.library_dir / "cases"
        self.index_path = self.library_dir / "index.json"

        # Create directory structure
        self.library_dir.mkdir(parents=True, exist_ok=True)
        self.cases_dir.mkdir(exist_ok=True)

        # Statistics
        self.stats = {
            "by_type": {},
            "by_difficulty": {},
            "by_industry": {}
        }

        # Case counters for ID generation
        self.case_counters = {}

    def build_library(self, extracted_data_path="data/casebooks_complete.json"):
        """
        Build the case library from extracted data

        Args:
            extracted_data_path: Path to the complete extraction JSON

        Returns:
            Library index data
        """
        print(f"\n{'='*60}")
        print(f"CASE LIBRARY BUILDER")
        print(f"{'='*60}\n")

        # Load extracted data
        print("📖 Loading extracted data...")
        extracted_data = self._load_extracted_data(extracted_data_path)

        if not extracted_data:
            print("❌ No data to process. Run extractPDFsComplete.py first.\n")
            return None

        total_cases = len(extracted_data["cases"])
        print(f"✓ Found {total_cases} cases to process\n")

        # Process each case
        print("🏗️  Building library structure...\n")
        processed_cases = []

        for idx, case in enumerate(extracted_data["cases"], 1):
            print(f"Processing case {idx}/{total_cases}...", end="\r")
            try:
                library_case = self._process_case(case)
                if library_case:
                    processed_cases.append(library_case)
            except Exception as e:
                print(f"\n⚠️  Warning: Error processing case {idx}: {e}")

        print(f"\n✓ Processed {len(processed_cases)} cases successfully\n")

        # Build index
        print("📋 Building library index...")
        index = self._build_index(processed_cases)

        # Save index
        print("💾 Saving index...")
        self._save_index(index)

        # Print summary
        self._print_summary(index)

        return index

    def _load_extracted_data(self, path):
        """Load the extracted casebook data"""
        path = Path(path)

        if not path.exists():
            return None

        with open(path, "r") as f:
            return json.load(f)

    def _process_case(self, case):
        """
        Process a single case into library format

        Args:
            case: Case data from extraction

        Returns:
            Library case metadata
        """
        # Extract metadata
        case_type = case["metadata"].get("case_type", "general")
        difficulty = case["metadata"].get("difficulty", "medium")
        industry = case["metadata"].get("industry", "General")

        # Generate unique ID
        case_id = self._generate_case_id(case_type, difficulty)

        # Create case directory
        case_dir = self._create_case_directory(case_id, case_type, difficulty)

        # Prepare complete case data
        complete_case = self._prepare_complete_case(case, case_id)

        # Save case.json
        case_file = case_dir / "case.json"
        with open(case_file, "w") as f:
            json.dump(complete_case, f, indent=2)

        # Save metadata.json
        metadata = self._create_metadata(case, case_id, case_dir)
        metadata_file = case_dir / "metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)

        # Copy visual assets if they exist
        self._copy_exhibits(case, case_dir)

        # Update statistics
        self._update_stats(case_type, difficulty, industry)

        # Return library entry
        return {
            "case_id": case_id,
            "title": self._extract_title(case),
            "case_type": case_type,
            "difficulty": difficulty,
            "industry": industry,
            "path": str(case_dir.relative_to(self.library_dir.parent)),
            "has_exhibits": len(case["content"].get("exhibits", [])) > 0,
            "has_visuals": case["stats"].get("has_visual_assets", False),
            "quality_score": self._calculate_quality_score(case)
        }

    def _generate_case_id(self, case_type, difficulty):
        """Generate unique case ID"""
        # Shorten type name
        type_short = case_type[:4].lower() if case_type else "gen"

        # Shorten difficulty
        diff_short = difficulty[:4].lower() if difficulty else "med"

        # Get counter
        key = f"{type_short}_{diff_short}"
        if key not in self.case_counters:
            self.case_counters[key] = 1
        else:
            self.case_counters[key] += 1

        number = self.case_counters[key]

        return f"case_{type_short}_{diff_short}_{number:03d}"

    def _create_case_directory(self, case_id, case_type, difficulty):
        """Create directory structure for a case"""
        # Create path: cases/case_type/difficulty/case_id/
        case_path = self.cases_dir / case_type / difficulty / case_id
        case_path.mkdir(parents=True, exist_ok=True)

        # Create exhibits subdirectory
        exhibits_path = case_path / "exhibits"
        exhibits_path.mkdir(exist_ok=True)

        return case_path

    def _prepare_complete_case(self, case, case_id):
        """Prepare complete case data with all information"""
        return {
            "case_id": case_id,
            "source": case.get("source", "unknown"),
            "metadata": case["metadata"],
            "content": case["content"],
            "visual_assets": case.get("visual_assets", {}),
            "stats": case.get("stats", {}),
            "created_at": datetime.now().isoformat(),
            "version": "1.0"
        }

    def _create_metadata(self, case, case_id, case_dir):
        """Create lightweight metadata file"""
        return {
            "case_id": case_id,
            "title": self._extract_title(case),
            "case_type": case["metadata"].get("case_type", "general"),
            "difficulty": case["metadata"].get("difficulty", "medium"),
            "industry": case["metadata"].get("industry", "General"),
            "tags": self._generate_tags(case),
            "statistics": {
                "num_questions": case["stats"].get("num_questions", 0),
                "num_exhibits": case["stats"].get("num_exhibits", 0),
                "num_images": case["stats"].get("num_images", 0),
                "num_screenshots": case["stats"].get("num_screenshots", 0),
                "has_visual_assets": case["stats"].get("has_visual_assets", False)
            },
            "files": {
                "case_json": "case.json",
                "exhibits_folder": "exhibits/"
            },
            "source": {
                "pdf": case.get("source", "unknown"),
                "extraction_date": datetime.now().isoformat(),
                "extraction_version": "1.0"
            }
        }

    def _extract_title(self, case):
        """Extract or generate a title for the case"""
        prompt = case["content"].get("prompt", "")
        if prompt:
            # Try to extract company/client name from prompt
            match = re.search(r'(?:client|company)(?:\s+is|\s+named)?\s+([A-Z][a-zA-Z\s]+)', prompt, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:50]

            # Otherwise use first 50 chars
            return prompt[:50].strip() + "..."

        return f"Case {case.get('case_id', 'Unknown')}"

    def _generate_tags(self, case):
        """Generate relevant tags for the case"""
        tags = []

        # Add case type as tag
        case_type = case["metadata"].get("case_type")
        if case_type:
            tags.append(case_type)

        # Add industry as tag
        industry = case["metadata"].get("industry")
        if industry:
            tags.append(industry.lower().replace(" ", "_"))

        # Add tags based on content
        content_text = str(case["content"]).lower()

        tag_keywords = {
            "quantitative": ["calculate", "compute", "×", "÷", "equation"],
            "qualitative": ["brainstorm", "discuss", "factors", "considerations"],
            "market_sizing": ["market size", "tam", "addressable market"],
            "financial_analysis": ["revenue", "cost", "profit", "margin", "npv", "irr"],
            "competitive_analysis": ["competitor", "market share", "rivalry"],
            "strategy": ["strategic", "positioning", "competitive advantage"]
        }

        for tag, keywords in tag_keywords.items():
            if any(keyword in content_text for keyword in keywords):
                tags.append(tag)

        return list(set(tags))[:10]  # Limit to 10 unique tags

    def _copy_exhibits(self, case, case_dir):
        """Copy visual assets to case directory"""
        exhibits_dir = case_dir / "exhibits"

        # Copy images
        images = case.get("visual_assets", {}).get("images", [])
        for img in images:
            src_path = Path(img.get("filepath", ""))
            if src_path.exists():
                dst_path = exhibits_dir / img["filename"]
                try:
                    shutil.copy2(src_path, dst_path)
                except Exception as e:
                    print(f"\n⚠️  Could not copy image {img['filename']}: {e}")

        # Copy screenshots
        screenshots = case.get("visual_assets", {}).get("screenshots", [])
        for screenshot in screenshots:
            src_path = Path(screenshot.get("filepath", ""))
            if src_path.exists():
                dst_path = exhibits_dir / screenshot["filename"]
                try:
                    shutil.copy2(src_path, dst_path)
                except Exception as e:
                    print(f"\n⚠️  Could not copy screenshot {screenshot['filename']}: {e}")

    def _calculate_quality_score(self, case):
        """Calculate quality score for the case"""
        score = 0

        # Has prompt
        if case["content"].get("prompt"):
            score += 20

        # Has clarifying info
        if case["content"].get("clarifying_information"):
            score += 10

        # Has framework
        if case["content"].get("framework"):
            score += 10

        # Has questions
        num_questions = len(case["content"].get("questions", []))
        score += min(num_questions * 10, 30)

        # Has exhibits
        num_exhibits = len(case["content"].get("exhibits", []))
        score += min(num_exhibits * 10, 20)

        # Has visual assets
        if case["stats"].get("has_visual_assets"):
            score += 10

        return min(score, 100)

    def _update_stats(self, case_type, difficulty, industry):
        """Update library statistics"""
        self.stats["by_type"][case_type] = self.stats["by_type"].get(case_type, 0) + 1
        self.stats["by_difficulty"][difficulty] = self.stats["by_difficulty"].get(difficulty, 0) + 1
        self.stats["by_industry"][industry] = self.stats["by_industry"].get(industry, 0) + 1

    def _build_index(self, cases):
        """Build the library index"""
        return {
            "library_version": "1.0",
            "last_updated": datetime.now().isoformat(),
            "total_cases": len(cases),
            "statistics": {
                "by_type": self.stats["by_type"],
                "by_difficulty": self.stats["by_difficulty"],
                "by_industry": self.stats["by_industry"]
            },
            "cases": cases
        }

    def _save_index(self, index):
        """Save the index file"""
        with open(self.index_path, "w") as f:
            json.dump(index, f, indent=2)

    def _print_summary(self, index):
        """Print library summary"""
        print(f"\n{'='*60}")
        print(f"LIBRARY BUILT SUCCESSFULLY")
        print(f"{'='*60}\n")

        print(f"📚 Total cases: {index['total_cases']}")
        print(f"💾 Saved to: {self.library_dir}\n")

        print("Statistics by Type:")
        for case_type, count in sorted(index["statistics"]["by_type"].items(), key=lambda x: -x[1]):
            print(f"  {case_type}: {count}")

        print("\nStatistics by Difficulty:")
        for difficulty, count in sorted(index["statistics"]["by_difficulty"].items()):
            print(f"  {difficulty}: {count}")

        print("\nStatistics by Industry:")
        for industry, count in sorted(index["statistics"]["by_industry"].items(), key=lambda x: -x[1])[:10]:
            print(f"  {industry}: {count}")

        print()


def main():
    """Main entry point"""
    builder = CaseLibraryBuilder()
    index = builder.build_library()

    if index:
        print("✓ Case library is ready to use!")
        print(f"  Access via: {builder.index_path}\n")
    else:
        print("❌ Failed to build library. Make sure to run extractPDFsComplete.py first.\n")


if __name__ == "__main__":
    main()
