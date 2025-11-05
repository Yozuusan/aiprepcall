/**
 * Case Retrieval API Server
 * Permet de rechercher et filtrer les vrais cases d'interview
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001; // Port différent du generator

// Middleware
app.use(cors());
app.use(express.json());

// Charger la base de données des cases
let casesDB = null;
try {
    const dbPath = path.join(__dirname, '../data/cases_database.json');
    casesDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log(`✓ Loaded ${casesDB.total_cases} cases from database`);
} catch (error) {
    console.error('❌ Error loading cases database:', error.message);
    process.exit(1);
}

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'case-retrieval',
        timestamp: new Date().toISOString(),
        total_cases: casesDB.total_cases
    });
});

/**
 * GET /api/stats
 * Statistiques de la base de données
 */
app.get('/api/stats', (req, res) => {
    res.json({
        total_cases: casesDB.total_cases,
        build_date: casesDB.build_date,
        metadata: casesDB.metadata
    });
});

/**
 * GET /api/cases
 * Rechercher des cases avec filtres
 *
 * Query params:
 * - firm: McKinsey|BCG|Bain|Business School
 * - case_type: profitability|market_entry|...
 * - difficulty: easy|medium|hard
 * - industry: Tech|Retail|...
 * - source_type: REX|Casebook
 * - limit: nombre de résultats (défaut: 10)
 * - offset: pagination (défaut: 0)
 */
app.get('/api/cases', (req, res) => {
    const {
        firm,
        case_type,
        difficulty,
        industry,
        source_type,
        limit = 10,
        offset = 0
    } = req.query;

    let filteredCases = casesDB.cases;

    // Appliquer les filtres
    if (firm) {
        filteredCases = filteredCases.filter(c =>
            c.source.firm.toLowerCase() === firm.toLowerCase()
        );
    }

    if (case_type) {
        filteredCases = filteredCases.filter(c =>
            c.case_type === case_type
        );
    }

    if (difficulty) {
        filteredCases = filteredCases.filter(c =>
            c.difficulty === difficulty
        );
    }

    if (industry) {
        filteredCases = filteredCases.filter(c =>
            c.industry === industry
        );
    }

    if (source_type) {
        filteredCases = filteredCases.filter(c =>
            c.source.type === source_type
        );
    }

    // Pagination
    const total = filteredCases.length;
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedCases = filteredCases.slice(start, end);

    res.json({
        total,
        offset: start,
        limit: parseInt(limit),
        count: paginatedCases.length,
        cases: paginatedCases
    });
});

/**
 * GET /api/cases/:case_id
 * Récupérer un case spécifique par son ID
 */
app.get('/api/cases/:case_id', (req, res) => {
    const { case_id } = req.params;

    const caseData = casesDB.cases.find(c => c.case_id === case_id);

    if (!caseData) {
        return res.status(404).json({
            error: 'Case not found',
            case_id: case_id
        });
    }

    res.json(caseData);
});

/**
 * GET /api/cases/random
 * Récupérer un case aléatoire (avec filtres optionnels)
 */
app.get('/api/random', (req, res) => {
    const { firm, case_type, difficulty, source_type } = req.query;

    let filteredCases = casesDB.cases;

    // Appliquer les filtres
    if (firm) {
        filteredCases = filteredCases.filter(c =>
            c.source.firm.toLowerCase() === firm.toLowerCase()
        );
    }

    if (case_type) {
        filteredCases = filteredCases.filter(c =>
            c.case_type === case_type
        );
    }

    if (difficulty) {
        filteredCases = filteredCases.filter(c =>
            c.difficulty === difficulty
        );
    }

    if (source_type) {
        filteredCases = filteredCases.filter(c =>
            c.source.type === source_type
        );
    }

    if (filteredCases.length === 0) {
        return res.status(404).json({
            error: 'No cases found matching the criteria'
        });
    }

    // Sélectionner un case aléatoire
    const randomIndex = Math.floor(Math.random() * filteredCases.length);
    const randomCase = filteredCases[randomIndex];

    res.json(randomCase);
});

/**
 * GET /api/firms
 * Liste des firmes disponibles
 */
app.get('/api/firms', (req, res) => {
    const firms = Object.keys(casesDB.metadata.by_firm).map(firm => ({
        name: firm,
        count: casesDB.metadata.by_firm[firm]
    }));

    res.json({
        firms: firms.sort((a, b) => b.count - a.count)
    });
});

/**
 * GET /api/types
 * Liste des types de cases disponibles
 */
app.get('/api/types', (req, res) => {
    const types = Object.keys(casesDB.metadata.by_type).map(type => ({
        type: type,
        count: casesDB.metadata.by_type[type]
    }));

    res.json({
        types: types.sort((a, b) => b.count - a.count)
    });
});

/**
 * GET /api/industries
 * Liste des industries disponibles
 */
app.get('/api/industries', (req, res) => {
    const industries = Object.keys(casesDB.metadata.by_industry).map(industry => ({
        industry: industry,
        count: casesDB.metadata.by_industry[industry]
    }));

    res.json({
        industries: industries.sort((a, b) => b.count - a.count)
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 CASE RETRIEVAL API SERVER');
    console.log('='.repeat(70));
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Database: ${casesDB.total_cases} cases loaded`);
    console.log(`✓ ${casesDB.metadata.by_source_type.REX || 0} REX (real interviews)`);
    console.log(`✓ ${casesDB.metadata.by_source_type.Casebook || 0} Casebook cases`);
    console.log('\nEndpoints:');
    console.log('  GET  /api/health          - Health check');
    console.log('  GET  /api/stats           - Database statistics');
    console.log('  GET  /api/cases           - Search cases (with filters)');
    console.log('  GET  /api/cases/:id       - Get specific case');
    console.log('  GET  /api/random          - Get random case');
    console.log('  GET  /api/firms           - List all firms');
    console.log('  GET  /api/types           - List case types');
    console.log('  GET  /api/industries      - List industries');
    console.log('\nFilters available:');
    console.log('  firm, case_type, difficulty, industry, source_type');
    console.log('\n' + '='.repeat(70) + '\n');
});

module.exports = app;
