/**
 * Case Generator API Server
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CaseGenerator = require('./caseGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize case generator
const caseGenerator = new CaseGenerator();

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    knowledge_base_cases: caseGenerator.knowledgeBase.total_cases_analyzed
  });
});

/**
 * GET /api/case-types
 * Get available case types
 */
app.get('/api/case-types', (req, res) => {
  const caseTypes = [
    'profitability',
    'market_entry',
    'mergers_acquisitions',
    'competitive_response',
    'new_product_launch',
    'pricing',
    'cost_reduction',
    'growth',
    'private_equity',
    'process_optimization',
    'offshoring'
  ];

  res.json({ case_types: caseTypes });
});

/**
 * POST /api/generate
 * Generate a new case
 *
 * Body:
 * {
 *   "case_type": "profitability",
 *   "difficulty": "medium",
 *   "industry": "Tech" (optional),
 *   "firm_style": "BCG" (optional)
 * }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { case_type, difficulty, industry, firm_style } = req.body;

    // Validate inputs
    if (!case_type) {
      return res.status(400).json({ error: 'case_type is required' });
    }

    if (!difficulty) {
      return res.status(400).json({ error: 'difficulty is required' });
    }

    console.log(`\n📝 Generate request: ${case_type} (${difficulty})`);

    // Generate case
    const generatedCase = await caseGenerator.generate({
      caseType: case_type,
      difficulty: difficulty,
      industry: industry,
      firmStyle: firm_style
    });

    // Save case
    caseGenerator.saveCase(generatedCase);

    res.json({
      success: true,
      case: generatedCase
    });

  } catch (error) {
    console.error('Error generating case:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats
 * Get knowledge base statistics
 */
app.get('/api/stats', (req, res) => {
  const kb = caseGenerator.knowledgeBase;

  const stats = {
    total_cases_analyzed: kb.total_cases_analyzed,
    last_updated: kb.last_updated,
    case_types: Object.keys(kb.opening_patterns).map(type => ({
      type,
      pattern_count: kb.opening_patterns[type].length
    })),
    industries: Object.keys(kb.industry_contexts).map(industry => ({
      industry,
      case_count: kb.industry_contexts[industry].case_count
    })),
    framework_types: Object.keys(kb.framework_approaches).length,
    quantitative_patterns: Object.keys(kb.quantitative_patterns).length
  };

  res.json(stats);
});

/**
 * GET /api/real-cases
 * Get real cases from extracted_cases.json with filters
 */
app.get('/api/real-cases', (req, res) => {
  try {
    const extractedCasesPath = path.join(__dirname, '../data/extracted_cases.json');

    if (!fs.existsSync(extractedCasesPath)) {
      return res.status(404).json({ error: 'Extracted cases not found' });
    }

    const extractedData = JSON.parse(fs.readFileSync(extractedCasesPath, 'utf8'));
    let cases = extractedData.cases || [];

    // Apply filters
    const { case_type, industry, source_type } = req.query;

    if (case_type && case_type !== 'all') {
      cases = cases.filter(c => c.case_type === case_type);
    }

    if (industry && industry !== 'all') {
      cases = cases.filter(c => c.industry === industry);
    }

    if (source_type && source_type !== 'all') {
      if (source_type === 'rex') {
        cases = cases.filter(c => c.source && c.source.toUpperCase().includes('REX'));
      } else if (source_type === 'casebook') {
        cases = cases.filter(c => c.source && !c.source.toUpperCase().includes('REX'));
      }
    }

    // Add metadata about source type
    cases = cases.map(c => ({
      ...c,
      source_type: c.source && c.source.toUpperCase().includes('REX') ? 'REX' : 'Casebook',
      source_display: c.source || 'Unknown'
    }));

    res.json({
      total: cases.length,
      total_in_database: extractedData.total_cases,
      cases: cases
    });

  } catch (error) {
    console.error('Error loading real cases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/real-cases/random
 * Get a random real case with optional filters
 */
app.get('/api/real-cases/random', (req, res) => {
  try {
    const extractedCasesPath = path.join(__dirname, '../data/extracted_cases.json');

    if (!fs.existsSync(extractedCasesPath)) {
      return res.status(404).json({ error: 'Extracted cases not found' });
    }

    const extractedData = JSON.parse(fs.readFileSync(extractedCasesPath, 'utf8'));
    let cases = extractedData.cases || [];

    // Apply filters
    const { case_type, industry, source_type } = req.query;

    if (case_type && case_type !== 'all') {
      cases = cases.filter(c => c.case_type === case_type);
    }

    if (industry && industry !== 'all') {
      cases = cases.filter(c => c.industry === industry);
    }

    if (source_type && source_type !== 'all') {
      if (source_type === 'rex') {
        cases = cases.filter(c => c.source && c.source.toUpperCase().includes('REX'));
      } else if (source_type === 'casebook') {
        cases = cases.filter(c => c.source && !c.source.toUpperCase().includes('REX'));
      }
    }

    if (cases.length === 0) {
      return res.status(404).json({ error: 'No cases found matching filters' });
    }

    // Pick random case
    const randomCase = cases[Math.floor(Math.random() * cases.length)];

    // Add metadata
    randomCase.source_type = randomCase.source && randomCase.source.toUpperCase().includes('REX') ? 'REX' : 'Casebook';
    randomCase.source_display = randomCase.source || 'Unknown';

    res.json({
      success: true,
      case: randomCase,
      total_matching: cases.length
    });

  } catch (error) {
    console.error('Error loading random case:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CASE GENERATOR API SERVER');
  console.log('='.repeat(60));
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Knowledge base: ${caseGenerator.knowledgeBase.total_cases_analyzed} cases analyzed`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health        - Health check`);
  console.log(`  GET  /api/case-types    - Available case types`);
  console.log(`  POST /api/generate      - Generate new case`);
  console.log(`  GET  /api/stats         - Knowledge base stats`);
  console.log('\n' + '='.repeat(60) + '\n');
});

module.exports = app;
