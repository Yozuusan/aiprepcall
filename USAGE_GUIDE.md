# Complete PDF Extraction & Case Library System
## Usage Guide

---

## 🎯 Overview

This system transforms casebook PDFs into a complete, organized case library with:
- ✅ Full text extraction
- ✅ Structured table data (exhibits)
- ✅ Embedded images
- ✅ High-quality page screenshots
- ✅ Individual case packages organized by type/difficulty
- ✅ Fast search and retrieval API

---

## 📋 Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Phase 1: Complete PDF Extraction](#phase-1-complete-pdf-extraction)
3. [Phase 2: Case Library Segmentation](#phase-2-case-library-segmentation)
4. [Phase 3: Using the API](#phase-3-using-the-api)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Installation

### Prerequisites

All dependencies are already installed:
- ✅ Python 3.11
- ✅ pdfplumber (text + tables)
- ✅ PyMuPDF (images)
- ✅ pdf2image (screenshots)
- ✅ pillow (image processing)
- ✅ poppler-utils (PDF rendering)

### File Structure

```
aiprepcall/
├── backend/
│   ├── extractPDFsComplete.py    ← Complete extraction script
│   ├── caseLibrary.js             ← Library API
│   └── server.js                  ← Express server
├── tools/
│   └── segmentCasebooks.py        ← Segmentation tool
├── data/
│   ├── casebooks/                 ← Place your PDFs here
│   ├── exhibits/                  ← Visual assets (auto-generated)
│   ├── library/                   ← Organized case packages (auto-generated)
│   │   ├── index.json
│   │   └── cases/
│   │       ├── profitability/
│   │       ├── market_entry/
│   │       └── ...
│   ├── casebooks_complete.json    ← Full extraction (auto-generated)
│   └── extracted_cases.json       ← Original extraction
└── USAGE_GUIDE.md                 ← This file
```

---

## 📄 Phase 1: Complete PDF Extraction

### Step 1: Add Your PDFs

Place your casebook PDF files in `data/casebooks/`:

```bash
cp your_casebook.pdf data/casebooks/
```

Supported formats:
- Text-based PDFs (not scanned images)
- McKinsey, BCG, Bain casebooks
- Business school casebooks (Darden, Kellogg, etc.)

### Step 2: Run Complete Extraction

```bash
python3 backend/extractPDFsComplete.py
```

**What it does:**

1. **Extracts text and tables** with pdfplumber
   - Converts tables to structured JSON
   - Preserves headers and data rows

2. **Extracts embedded images** with PyMuPDF
   - Saves all images from PDFs
   - Preserves original format (PNG, JPG, etc.)

3. **Creates page screenshots** with pdf2image
   - High-quality (200 DPI) screenshots
   - Only pages with exhibits

4. **Detects exhibits automatically**
   - Looks for patterns: "EXHIBIT 1", "TABLE 1", etc.
   - Detects pages with tables

5. **Saves organized output**
   - `data/casebooks_complete.json` - Complete extraction data
   - `data/exhibits/{pdf_name}/` - Visual assets per PDF

**Expected output:**

```
============================================================
COMPLETE PDF EXTRACTION SYSTEM
============================================================

📚 Found 3 PDF file(s) to process

============================================================
Processing: darden-2020.pdf
============================================================

📄 Extracting text and tables...
🖼️  Extracting embedded images...
🔍 Detecting exhibit pages...
📸 Creating exhibit screenshots...
📋 Parsing case structure...

✓ Extraction complete!
  - 87 cases found
  - 45 images extracted
  - 23 screenshots created

============================================================
EXTRACTION COMPLETE
============================================================

✓ Processed 3 PDF(s)
✓ Extracted 230 case(s)
✓ Extracted 120 image(s)
✓ Created 75 screenshot(s)

💾 Saved to: data/casebooks_complete.json
📁 Visual assets in: data/exhibits/
```

### Step 3: Verify Extraction

Check the generated files:

```bash
# View JSON structure
cat data/casebooks_complete.json | jq '.metadata'

# List extracted assets
ls -R data/exhibits/

# Count cases
cat data/casebooks_complete.json | jq '.cases | length'
```

---

## 📚 Phase 2: Case Library Segmentation

### Step 1: Run Segmentation

Transform the complete extraction into an organized library:

```bash
python3 tools/segmentCasebooks.py
```

**What it does:**

1. **Loads extracted data** from `casebooks_complete.json`

2. **Segments into individual cases**
   - Detects case boundaries
   - Assigns unique IDs (e.g., `case_prof_medi_042`)

3. **Classifies each case**
   - Case type (profitability, market entry, etc.)
   - Difficulty (easy, medium, hard)
   - Industry
   - Quality score (0-100)

4. **Creates organized structure**
   ```
   data/library/cases/
   ├── profitability/
   │   ├── easy/
   │   │   └── case_prof_easy_001/
   │   │       ├── case.json          ← Complete case data
   │   │       ├── metadata.json      ← Lightweight metadata
   │   │       └── exhibits/          ← Visual assets
   │   ├── medium/
   │   └── hard/
   ├── market_entry/
   └── ...
   ```

5. **Builds search index**
   - `data/library/index.json` - Fast lookup
   - Statistics by type/difficulty/industry

**Expected output:**

```
============================================================
CASE LIBRARY BUILDER
============================================================

📖 Loading extracted data...
✓ Found 230 cases to process

🏗️  Building library structure...

Processing case 230/230...
✓ Processed 230 cases successfully

📋 Building library index...
💾 Saving index...

============================================================
LIBRARY BUILT SUCCESSFULLY
============================================================

📚 Total cases: 230
💾 Saved to: data/library

Statistics by Type:
  profitability: 45
  market_entry: 32
  mergers_acquisitions: 28
  competitive_response: 18
  new_product_launch: 15
  pricing: 22
  cost_reduction: 12
  growth: 25
  private_equity: 18
  process_optimization: 10
  offshoring: 5

Statistics by Difficulty:
  easy: 68
  medium: 102
  hard: 60

Statistics by Industry:
  Tech: 42
  Retail: 35
  Healthcare: 28
  Financial Services: 31
  Manufacturing: 24
```

### Step 2: Verify Library

```bash
# Check index
cat data/library/index.json | jq '.total_cases'

# List case directories
ls data/library/cases/profitability/medium/

# View a sample case
cat data/library/cases/profitability/medium/case_prof_medi_001/case.json | jq '.'
```

---

## 🌐 Phase 3: Using the API

### Step 1: Start the Server

```bash
node backend/server.js
```

**Expected output:**

```
============================================================
🚀 CASE GENERATOR API SERVER
============================================================

✓ Server running on http://localhost:3000
✓ Knowledge base: 230 cases analyzed
✓ Case library: 230 cases available

Core Endpoints:
  GET  /api/health        - Health check
  GET  /api/case-types    - Available case types
  POST /api/generate      - Generate new case
  GET  /api/stats         - Knowledge base stats

Case Library Endpoints:
  GET  /api/library/stats              - Library statistics
  GET  /api/library/case/random        - Random case (with filters)
  GET  /api/library/case/:case_id      - Get specific case
  GET  /api/library/cases/list         - List cases (with filters)
  GET  /api/library/search?q=query     - Search cases
  GET  /api/library/filters            - Available filters

============================================================
```

### Step 2: Test API Endpoints

#### Get Library Statistics

```bash
curl http://localhost:3000/api/library/stats
```

Response:
```json
{
  "total_cases": 230,
  "last_updated": "2025-11-05T16:30:00Z",
  "by_type": {
    "profitability": 45,
    "market_entry": 32,
    "mergers_acquisitions": 28
  },
  "by_difficulty": {
    "easy": 68,
    "medium": 102,
    "hard": 60
  },
  "by_industry": {
    "Tech": 42,
    "Retail": 35,
    "Healthcare": 28
  }
}
```

#### Get Random Case with Filters

```bash
# Random profitability case (medium difficulty)
curl "http://localhost:3000/api/library/case/random?case_type=profitability&difficulty=medium"

# Random case in Tech industry
curl "http://localhost:3000/api/library/case/random?industry=Tech"

# Random case with minimum quality score
curl "http://localhost:3000/api/library/case/random?min_quality=80"
```

Response:
```json
{
  "success": true,
  "case": {
    "case_id": "case_prof_medi_042",
    "source": "darden-2020.pdf",
    "metadata": {
      "case_type": "profitability",
      "difficulty": "medium",
      "industry": "Real Estate"
    },
    "content": {
      "prompt": "Our client is a real estate company...",
      "clarifying_information": "...",
      "framework": ["MECE"],
      "questions": [...],
      "exhibits": [
        {
          "exhibit_number": 1,
          "type": "table",
          "headers": ["Resort", "Rooms", "Utilization", "Rate"],
          "data": [...]
        }
      ],
      "conclusion": "..."
    },
    "visual_assets": {
      "images": [...],
      "screenshots": [...]
    },
    "stats": {
      "num_questions": 5,
      "num_exhibits": 2,
      "has_visual_assets": true
    }
  }
}
```

#### Get Specific Case by ID

```bash
curl http://localhost:3000/api/library/case/case_prof_medi_042
```

#### List Cases with Filters

```bash
# List all profitability cases
curl "http://localhost:3000/api/library/cases/list?case_type=profitability"

# List hard cases in Tech
curl "http://localhost:3000/api/library/cases/list?difficulty=hard&industry=Tech&limit=20"
```

#### Search Cases

```bash
# Search by keyword
curl "http://localhost:3000/api/library/search?q=hotel"

# Search with limit
curl "http://localhost:3000/api/library/search?q=market+entry&limit=5"
```

#### Get Available Filters

```bash
curl http://localhost:3000/api/library/filters
```

Response:
```json
{
  "case_types": [
    "profitability",
    "market_entry",
    "mergers_acquisitions",
    "competitive_response",
    "new_product_launch",
    "pricing",
    "cost_reduction",
    "growth",
    "private_equity",
    "process_optimization",
    "offshoring"
  ],
  "difficulties": ["easy", "medium", "hard"],
  "industries": [
    "Tech",
    "Retail",
    "Healthcare",
    "Financial Services",
    "Manufacturing",
    "Real Estate",
    "Energy",
    "Consumer Goods"
  ]
}
```

---

## 🔄 Complete Workflow

### Initial Setup (One-time)

```bash
# 1. Add PDFs to casebooks directory
cp *.pdf data/casebooks/

# 2. Run complete extraction
python3 backend/extractPDFsComplete.py

# 3. Build case library
python3 tools/segmentCasebooks.py

# 4. Start server
node backend/server.js
```

### Adding New PDFs

```bash
# 1. Add new PDF
cp new_casebook.pdf data/casebooks/

# 2. Re-run extraction (only processes new PDFs)
python3 backend/extractPDFsComplete.py

# 3. Update library
python3 tools/segmentCasebooks.py

# 4. Restart server (or reload library)
# Server will automatically detect updated library
```

---

## 🧪 Testing

### Test Extraction

```bash
# Check if extraction worked
ls -lh data/casebooks_complete.json
cat data/casebooks_complete.json | jq '.metadata'

# Check exhibits
find data/exhibits/ -name "*.png" | wc -l
```

### Test Library

```bash
# Check index
cat data/library/index.json | jq '.total_cases'

# List case types
cat data/library/index.json | jq '.statistics.by_type'

# View a sample case
find data/library/cases -name "case.json" | head -1 | xargs cat | jq '.'
```

### Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Library stats
curl http://localhost:3000/api/library/stats

# Get random case
curl http://localhost:3000/api/library/case/random | jq '.'
```

---

## 🐛 Troubleshooting

### "No PDF files found"

**Problem:** No PDFs in `data/casebooks/`

**Solution:**
```bash
# Add PDFs to the directory
cp your_casebook.pdf data/casebooks/
```

### "Case library not available"

**Problem:** Library hasn't been built yet

**Solution:**
```bash
# Run extraction first
python3 backend/extractPDFsComplete.py

# Then build library
python3 tools/segmentCasebooks.py
```

### "Could not create screenshot"

**Problem:** poppler not installed or pdf2image error

**Solution:**
```bash
# Check poppler installation
which pdftoppm

# If not installed
apt-get install -y poppler-utils
```

### Empty `casebooks_complete.json`

**Problem:** PDF extraction failed

**Check:**
```bash
# Are PDFs text-based (not scanned images)?
pdftotext data/casebooks/your_file.pdf -

# Check PDF structure
pdfinfo data/casebooks/your_file.pdf
```

### Server shows "0 cases analyzed"

**Problem:** Knowledge base not built or library empty

**Solution:**
```bash
# Rebuild knowledge base
node backend/buildKnowledgeBase.js

# Rebuild library
python3 tools/segmentCasebooks.py

# Restart server
node backend/server.js
```

---

## 📊 Performance Notes

### Extraction Speed

- **Small PDF** (10 cases): ~10 seconds
- **Medium PDF** (50 cases): ~45 seconds
- **Large PDF** (100 cases): ~90 seconds

### Library Size

- **230 cases** ~50-100 MB total
- **With images** add ~20-50 MB per PDF
- **Index.json** ~500 KB

### API Response Time

- **Random case**: <10ms
- **Search**: <50ms
- **List cases**: <100ms

---

## 🎯 Next Steps

### For AI Interview Agent

You can now build an AI interview agent that:

1. **Loads cases instantly**
   ```javascript
   const caseData = caseLibrary.loadCase('case_prof_medi_042');
   ```

2. **Accesses exhibits directly**
   ```javascript
   const exhibit1 = caseData.content.exhibits[0];
   // Show table or image to user
   ```

3. **Follows structured guidance**
   ```javascript
   const hints = caseData.content.interviewer_notes.hints_if_stuck;
   ```

4. **Tracks progress**
   ```javascript
   const currentQ = caseData.content.questions[questionIndex];
   const expectedAnswer = currentQ.solution;
   ```

### For Frontend UI

Display cases with full visual assets:

```javascript
// Fetch random case
fetch('/api/library/case/random?case_type=profitability&difficulty=medium')
  .then(res => res.json())
  .then(data => {
    const caseData = data.case;

    // Display prompt
    displayPrompt(caseData.content.prompt);

    // Display exhibits with images
    caseData.content.exhibits.forEach(exhibit => {
      if (exhibit.files && exhibit.files.screenshot) {
        displayImage(exhibit.files.screenshot);
      }
    });
  });
```

---

## ✅ Success Criteria

Your system is ready when:

- ✅ `data/casebooks_complete.json` exists and has cases
- ✅ `data/library/index.json` exists with correct total
- ✅ `data/library/cases/` has organized directories
- ✅ Server starts without errors
- ✅ API returns cases with visual assets
- ✅ All tests pass

---

## 📚 Additional Resources

- **Original extraction script**: `backend/extractPDFs.py`
- **Knowledge base builder**: `backend/buildKnowledgeBase.js`
- **Case generator**: `backend/caseGenerator.js`
- **Frontend**: `frontend/app.js`

---

**Questions or Issues?**

Check the console output for detailed error messages. Most issues are related to:
1. Missing PDFs in `data/casebooks/`
2. Not running extraction/segmentation scripts
3. Poppler not installed

---

**Enjoy your complete case library system! 🚀**
