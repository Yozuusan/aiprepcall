/**
 * Case Generator API Server
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CaseGenerator = require('./caseGenerator');
const CaseLibrary = require('./caseLibrary');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize case generator and library
const caseGenerator = new CaseGenerator();
const caseLibrary = new CaseLibrary();

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

/**
 * CASE LIBRARY ENDPOINTS
 */

/**
 * GET /api/library/stats
 * Get case library statistics
 */
app.get('/api/library/stats', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available',
        message: 'Run extraction and segmentation first'
      });
    }

    const stats = caseLibrary.getStatistics();
    res.json(stats);

  } catch (error) {
    console.error('Error getting library stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/library/case/random
 * Get a random case from the library with optional filters
 *
 * Query params:
 *   - case_type: Filter by case type
 *   - difficulty: Filter by difficulty (easy/medium/hard)
 *   - industry: Filter by industry
 *   - min_quality: Minimum quality score (0-100)
 */
app.get('/api/library/case/random', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available',
        message: 'Run extraction and segmentation first'
      });
    }

    const { case_type, difficulty, industry, min_quality } = req.query;

    const criteria = {};
    if (case_type) criteria.case_type = case_type;
    if (difficulty) criteria.difficulty = difficulty;
    if (industry) criteria.industry = industry;
    if (min_quality) criteria.min_quality = parseInt(min_quality);

    const selectedCase = caseLibrary.findCase(criteria);

    if (!selectedCase) {
      return res.status(404).json({
        error: 'No case found matching criteria'
      });
    }

    res.json({
      success: true,
      case: selectedCase
    });

  } catch (error) {
    console.error('Error getting random case:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/library/case/:case_id
 * Get a specific case by ID
 */
app.get('/api/library/case/:case_id', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available'
      });
    }

    const { case_id } = req.params;
    const caseData = caseLibrary.loadCase(case_id);

    if (!caseData) {
      return res.status(404).json({
        error: 'Case not found'
      });
    }

    res.json({
      success: true,
      case: caseData
    });

  } catch (error) {
    console.error('Error loading case:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/library/cases/list
 * List cases with filters
 *
 * Query params:
 *   - case_type: Filter by case type
 *   - difficulty: Filter by difficulty
 *   - industry: Filter by industry
 *   - limit: Max results (default 100)
 */
app.get('/api/library/cases/list', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available'
      });
    }

    const { case_type, difficulty, industry, limit } = req.query;

    const criteria = {};
    if (case_type) criteria.case_type = case_type;
    if (difficulty) criteria.difficulty = difficulty;
    if (industry) criteria.industry = industry;

    const maxLimit = limit ? parseInt(limit) : 100;

    const cases = caseLibrary.listCases(criteria, maxLimit);

    res.json({
      success: true,
      count: cases.length,
      cases: cases
    });

  } catch (error) {
    console.error('Error listing cases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/library/search
 * Search cases by text query
 *
 * Query params:
 *   - q: Search query
 *   - limit: Max results (default 10)
 */
app.get('/api/library/search', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available'
      });
    }

    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Search query (q) is required'
      });
    }

    const maxLimit = limit ? parseInt(limit) : 10;
    const results = caseLibrary.searchCases(q, maxLimit);

    res.json({
      success: true,
      count: results.length,
      query: q,
      results: results
    });

  } catch (error) {
    console.error('Error searching cases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/library/filters
 * Get available filter options
 */
app.get('/api/library/filters', (req, res) => {
  try {
    if (!caseLibrary.isAvailable()) {
      return res.status(404).json({
        error: 'Case library not available'
      });
    }

    res.json({
      case_types: caseLibrary.getCaseTypes(),
      difficulties: caseLibrary.getDifficulties(),
      industries: caseLibrary.getIndustries()
    });

  } catch (error) {
    console.error('Error getting filters:', error);
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

  if (caseLibrary.isAvailable()) {
    const stats = caseLibrary.getStatistics();
    console.log(`✓ Case library: ${stats.total_cases} cases available`);
  } else {
    console.log(`⚠️  Case library not available (run extraction first)`);
  }

  console.log(`\nCore Endpoints:`);
  console.log(`  GET  /api/health        - Health check`);
  console.log(`  GET  /api/case-types    - Available case types`);
  console.log(`  POST /api/generate      - Generate new case`);
  console.log(`  GET  /api/stats         - Knowledge base stats`);

  console.log(`\nCase Library Endpoints:`);
  console.log(`  GET  /api/library/stats              - Library statistics`);
  console.log(`  GET  /api/library/case/random        - Random case (with filters)`);
  console.log(`  GET  /api/library/case/:case_id      - Get specific case`);
  console.log(`  GET  /api/library/cases/list         - List cases (with filters)`);
  console.log(`  GET  /api/library/search?q=query     - Search cases`);
  console.log(`  GET  /api/library/filters            - Available filters`);

  console.log('\n' + '='.repeat(60) + '\n');
});

module.exports = app;
