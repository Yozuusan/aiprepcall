# 🎯 Consulting Case Generator

An intelligent case interview generator for management consulting practice that learns from real case PDFs and generates unlimited synthetic cases using Claude API.

## 🌟 Features

- **Learn from Real Cases**: Extracts patterns from McKinsey, BCG, Bain, and business school casebooks
- **AI-Powered Generation**: Uses Claude API to create unique, realistic cases
- **11 Case Types**: Profitability, Market Entry, M&A, Pricing, Growth, and more
- **Multiple Difficulty Levels**: Easy, Medium, Hard
- **Continuous Learning**: Improves as you add more PDFs to the knowledge base
- **Complete Structure**: Includes prompts, frameworks, quantitative questions, brainstorming, and conclusions
- **Interviewer Guidance**: Hints, common mistakes, and evaluation criteria

## 📁 Project Structure

```
consulting-coach/
├── data/
│   ├── casebooks/              # Place your PDF casebooks here
│   ├── generated_cases/        # Generated cases saved here
│   ├── knowledge_base.json     # Consolidated patterns
│   └── extracted_cases.json    # Extracted from PDFs
├── backend/
│   ├── server.js               # API server
│   ├── extractPDFs.py          # PDF parsing
│   ├── buildKnowledgeBase.js   # Pattern consolidation
│   ├── caseGenerator.js        # Case generation logic
│   ├── claudeAPI.js            # Anthropic API wrapper
│   └── package.json
├── frontend/
│   ├── index.html              # Web interface
│   ├── app.js                  # Frontend logic
│   └── style.css               # Styling
├── scripts/
│   └── update-knowledge.sh     # Update script
└── .env                        # API configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Python 3 (v3.8+)
- Anthropic API Key

### Installation

1. **Install Node.js dependencies**:
```bash
cd backend
npm install
```

2. **Install Python dependencies**:
```bash
pip3 install pdfplumber
```

3. **Configure API key**:
Edit `.env` file and add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3000
```

4. **Add casebook PDFs**:
Place your PDF casebooks in `data/casebooks/` directory.

5. **Extract cases from PDFs**:
```bash
cd backend
python3 extractPDFs.py
```

6. **Build knowledge base**:
```bash
node buildKnowledgeBase.js
```

7. **Start the server**:
```bash
node server.js
```

8. **Open your browser**:
Navigate to `http://localhost:3000`

## 📚 Usage

### Generate a Case via Web Interface

1. Open `http://localhost:3000`
2. Select case type, difficulty, and optional industry
3. Click "Generate Case"
4. Practice with the generated case!

### Generate a Case via API

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "case_type": "profitability",
    "difficulty": "medium",
    "industry": "Tech"
  }'
```

### Add More PDFs

1. Copy new PDF to `data/casebooks/`
2. Run the update script:
```bash
./scripts/update-knowledge.sh
```
3. Restart the server

The knowledge base automatically improves with each PDF!

## 🎓 Supported Case Types

1. **Profitability** - Declining margins, cost analysis
2. **Market Entry** - New market expansion
3. **Mergers & Acquisitions** - Buy/don't buy decisions
4. **Competitive Response** - Competitor threats
5. **New Product Launch** - Product introduction
6. **Pricing** - Pricing strategy
7. **Cost Reduction** - Cost optimization
8. **Growth** - Revenue growth strategies
9. **Private Equity** - Investment decisions
10. **Process Optimization** - Operational efficiency
11. **Offshoring** - Outsourcing decisions

## 🏢 Firm Styles

- **McKinsey**: Hypothesis-driven, structured
- **BCG**: Data-driven, analytical
- **Bain**: Results-focused, practical

## 📊 API Endpoints

### `GET /api/health`
Health check and system status

### `GET /api/case-types`
List all available case types

### `POST /api/generate`
Generate a new case
```json
{
  "case_type": "profitability",
  "difficulty": "medium",
  "industry": "Tech",
  "firm_style": "BCG"
}
```

### `GET /api/stats`
Knowledge base statistics

## 🔧 Maintenance

### Update Knowledge Base
```bash
./scripts/update-knowledge.sh
```

### Check System Health
```bash
curl http://localhost:3000/api/health
```

### View Statistics
```bash
curl http://localhost:3000/api/stats
```

## 📝 Generated Case Format

Each generated case includes:
- **Prompt**: Opening statement
- **Clarifying Information**: Client context and objectives
- **Framework Guidance**: Expected frameworks and key factors
- **Questions**: 2-3 quantitative questions with solutions
- **Brainstorming**: Risk/factor identification
- **Conclusion**: Recommendation framework
- **Interviewer Notes**: Hints and evaluation criteria

## 🎯 Best Practices

1. **Add 10-20 casebook PDFs** for optimal results
2. **Mix case types** for variety
3. **Include real firm cases** (McKinsey, BCG, Bain)
4. **Update regularly** as you get more materials
5. **Practice consistently** to improve

## 🐛 Troubleshooting

### "No extracted cases found"
Run `python3 extractPDFs.py` first

### "Knowledge base not found"
Run `node buildKnowledgeBase.js`

### "Invalid API key"
Check `.env` file for correct `ANTHROPIC_API_KEY`

### "PDF parsing errors"
Ensure PDFs are text-based, not scanned images

### "Low quality cases"
Add more source PDFs (10-20 recommended)

## 🔒 Security

- Never commit `.env` file with API keys
- Keep casebook PDFs confidential
- Generated cases are saved locally only

## 📈 Performance

- **Extraction**: ~30 seconds per PDF
- **Knowledge Base Build**: ~5-10 seconds
- **Case Generation**: ~10-20 seconds per case
- **Knowledge Base Size**: ~1-5MB

## 🤝 Contributing

This is a personal project, but feel free to adapt and improve!

## 📄 License

MIT License - Use freely for interview practice

## 🎓 Tips for Interview Success

1. **Practice structure**: Use MECE frameworks
2. **Think out loud**: Show your reasoning
3. **Ask clarifying questions**: Don't make assumptions
4. **Do the math**: Be accurate with calculations
5. **Be hypothesis-driven**: Form and test hypotheses
6. **Synthesize**: Pull insights together
7. **Be concise**: Clear communication matters

## 🚀 Next Steps

1. Add your casebook PDFs
2. Extract and build knowledge base
3. Generate your first case
4. Start practicing!

Good luck with your consulting interviews! 🎯

---

**Built with:**
- Node.js + Express
- Python + pdfplumber
- Claude API (Anthropic)
- Vanilla JavaScript

**Author:** Your Name
**Version:** 1.0.0
**Last Updated:** 2025
