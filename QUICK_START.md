# Quick Start Guide
## Complete PDF Extraction & Case Library System

---

## ⚡ Get Started in 3 Steps

### Step 1: Add Your PDFs (1 minute)

```bash
# Copy your casebook PDFs to the casebooks directory
cp your_casebook.pdf data/casebooks/
```

**Supported formats:**
- McKinsey, BCG, Bain casebooks
- Business school casebooks (Darden, Kellogg, etc.)
- Any text-based PDF (not scanned images)

---

### Step 2: Extract & Build (5-10 minutes)

```bash
# Extract complete data from PDFs
python3 backend/extractPDFsComplete.py

# Build organized library
python3 tools/segmentCasebooks.py
```

**What happens:**
- Extracts text, tables, images from PDFs
- Creates high-quality screenshots of exhibits
- Organizes cases by type and difficulty
- Builds fast search index

**Output:**
```
✓ Extracted 230 cases
✓ Extracted 120 images
✓ Created 75 screenshots
✓ Built library with 230 organized cases
```

---

### Step 3: Start & Use (instant)

```bash
# Start the API server
node backend/server.js
```

**Server runs on:** `http://localhost:3000`

---

## 🎯 Quick API Examples

### Get a random case

```bash
curl http://localhost:3000/api/library/case/random
```

### Get a profitability case (medium difficulty)

```bash
curl "http://localhost:3000/api/library/case/random?case_type=profitability&difficulty=medium"
```

### Search for cases about hotels

```bash
curl "http://localhost:3000/api/library/search?q=hotel"
```

### Get library statistics

```bash
curl http://localhost:3000/api/library/stats
```

---

## 📊 Example Response

```json
{
  "success": true,
  "case": {
    "case_id": "case_prof_medi_042",
    "metadata": {
      "case_type": "profitability",
      "difficulty": "medium",
      "industry": "Real Estate"
    },
    "content": {
      "prompt": "Our client is a real estate company...",
      "questions": [
        {
          "number": 1,
          "text": "Calculate the total whales...",
          "solution": {
            "calculations": ["5000 × 80% × 25% = 1000"],
            "answer": "3750 whales/night"
          }
        }
      ],
      "exhibits": [
        {
          "exhibit_number": 1,
          "type": "table",
          "headers": ["Resort", "Rooms", "Utilization"],
          "data": [
            {
              "Resort": "King's Palace",
              "Rooms": "5000",
              "Utilization": "80%"
            }
          ]
        }
      ]
    },
    "visual_assets": {
      "screenshots": [
        {
          "filename": "exhibit_page3.png",
          "filepath": "data/library/cases/.../exhibit_page3.png"
        }
      ]
    }
  }
}
```

---

## 🧪 Test Your System

```bash
# Run the test suite
./test_system.sh
```

**Expected result:**
```
✓ All tests passed!
System is ready to use.
```

---

## 📚 Available Endpoints

| What | Endpoint | Example |
|------|----------|---------|
| Random case | `GET /api/library/case/random` | `?case_type=profitability&difficulty=medium` |
| Specific case | `GET /api/library/case/:id` | `/api/library/case/case_prof_medi_042` |
| List cases | `GET /api/library/cases/list` | `?case_type=market_entry&limit=10` |
| Search | `GET /api/library/search` | `?q=hotel&limit=5` |
| Statistics | `GET /api/library/stats` | - |
| Filters | `GET /api/library/filters` | - |

---

## 🎨 Using in Your App

### JavaScript/Node.js

```javascript
// Get a random case
const response = await fetch('http://localhost:3000/api/library/case/random');
const { case: caseData } = await response.json();

// Display the case
console.log(caseData.content.prompt);
console.log(caseData.content.exhibits[0].data);
```

### Python

```python
import requests

# Get a random profitability case
response = requests.get(
    'http://localhost:3000/api/library/case/random',
    params={'case_type': 'profitability'}
)

case_data = response.json()['case']
print(case_data['content']['prompt'])
```

### cURL

```bash
# Save case to file
curl http://localhost:3000/api/library/case/random > case.json

# Pretty print with jq
curl http://localhost:3000/api/library/case/random | jq '.'
```

---

## 🔍 Query Parameters

### Random Case

```
GET /api/library/case/random?case_type=profitability&difficulty=medium&industry=Tech&min_quality=80
```

- **case_type**: profitability, market_entry, pricing, etc.
- **difficulty**: easy, medium, hard
- **industry**: Tech, Retail, Healthcare, etc.
- **min_quality**: 0-100 (quality score)

### List Cases

```
GET /api/library/cases/list?case_type=profitability&difficulty=medium&limit=20
```

- **case_type**: Filter by type
- **difficulty**: Filter by difficulty
- **industry**: Filter by industry
- **limit**: Max results (default 100)

### Search

```
GET /api/library/search?q=hotel&limit=10
```

- **q**: Search query (required)
- **limit**: Max results (default 10)

---

## 📁 Where Everything Lives

```
data/
├── casebooks/              ← Your PDFs go here
├── casebooks_complete.json ← Full extraction data
├── exhibits/               ← Extracted images & screenshots
└── library/                ← Organized case library
    ├── index.json          ← Fast lookup
    └── cases/
        ├── profitability/
        │   ├── easy/
        │   ├── medium/
        │   └── hard/
        ├── market_entry/
        └── ...
```

---

## ⚙️ System Commands

### Complete Workflow

```bash
# 1. Add PDFs
cp *.pdf data/casebooks/

# 2. Extract
python3 backend/extractPDFsComplete.py

# 3. Build library
python3 tools/segmentCasebooks.py

# 4. Start server
node backend/server.js
```

### Update Library (after adding new PDFs)

```bash
# Re-run extraction
python3 backend/extractPDFsComplete.py

# Rebuild library
python3 tools/segmentCasebooks.py

# Restart server
node backend/server.js
```

---

## 🐛 Troubleshooting

### "No PDFs found"
```bash
# Check if PDFs are in the right location
ls -lh data/casebooks/*.pdf
```

### "Library not available"
```bash
# Run extraction and segmentation
python3 backend/extractPDFsComplete.py
python3 tools/segmentCasebooks.py
```

### "Server won't start"
```bash
# Check if port 3000 is available
lsof -i :3000

# Use different port
PORT=4000 node backend/server.js
```

### Test everything
```bash
./test_system.sh
```

---

## 📖 More Documentation

- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete documentation
- **[README_EXTRACTION_SYSTEM.md](./README_EXTRACTION_SYSTEM.md)** - System overview
- **[test_system.sh](./test_system.sh)** - Test suite

---

## ✅ Checklist

Before you start:
- [ ] PDFs added to `data/casebooks/`
- [ ] Run `python3 backend/extractPDFsComplete.py`
- [ ] Run `python3 tools/segmentCasebooks.py`
- [ ] Run `node backend/server.js`
- [ ] Test with `curl http://localhost:3000/api/library/stats`

---

## 🎉 You're Ready!

Your complete case library system is ready to use.

**Next:** See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for advanced features and examples.
