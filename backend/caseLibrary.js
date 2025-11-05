/**
 * Case Library API
 * Provides access to the organized case library
 */

const fs = require('fs');
const path = require('path');

class CaseLibrary {
  /**
   * Initialize the case library
   * @param {string} libraryDir - Path to library directory
   */
  constructor(libraryDir = path.join(__dirname, '../data/library')) {
    this.libraryDir = libraryDir;
    this.indexPath = path.join(libraryDir, 'index.json');
    this.index = null;

    // Load index
    this.loadIndex();
  }

  /**
   * Load the library index
   * @returns {boolean} Success status
   */
  loadIndex() {
    try {
      if (!fs.existsSync(this.indexPath)) {
        console.warn('⚠️  Case library index not found. Run segmentation first.');
        return false;
      }

      const indexData = fs.readFileSync(this.indexPath, 'utf8');
      this.index = JSON.parse(indexData);

      console.log(`✓ Case library loaded: ${this.index.total_cases} cases`);
      return true;
    } catch (error) {
      console.error('❌ Error loading case library:', error.message);
      return false;
    }
  }

  /**
   * Check if library is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.index !== null && this.index.total_cases > 0;
  }

  /**
   * Get library statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    if (!this.isAvailable()) {
      return null;
    }

    return {
      total_cases: this.index.total_cases,
      last_updated: this.index.last_updated,
      by_type: this.index.statistics.by_type,
      by_difficulty: this.index.statistics.by_difficulty,
      by_industry: this.index.statistics.by_industry
    };
  }

  /**
   * Find a case matching criteria
   * @param {object} criteria - Search criteria
   * @param {string} criteria.case_type - Case type filter
   * @param {string} criteria.difficulty - Difficulty filter
   * @param {string} criteria.industry - Industry filter
   * @param {Array<string>} criteria.tags - Tags to match
   * @param {number} criteria.min_quality - Minimum quality score
   * @returns {object|null} Selected case data or null
   */
  findCase(criteria = {}) {
    if (!this.isAvailable()) {
      return null;
    }

    const {
      case_type,
      difficulty,
      industry,
      tags,
      min_quality = 0
    } = criteria;

    // Filter candidates
    let candidates = this.index.cases.filter(caseInfo => {
      // Filter by case type
      if (case_type && caseInfo.case_type !== case_type) {
        return false;
      }

      // Filter by difficulty
      if (difficulty && caseInfo.difficulty !== difficulty) {
        return false;
      }

      // Filter by industry
      if (industry && caseInfo.industry !== industry) {
        return false;
      }

      // Filter by tags (all tags must be present)
      if (tags && tags.length > 0) {
        const caseTags = caseInfo.tags || [];
        if (!tags.every(tag => caseTags.includes(tag))) {
          return false;
        }
      }

      // Filter by quality score
      if (caseInfo.quality_score < min_quality) {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Select random case from candidates
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // Load complete case data
    return this.loadCase(selected.case_id);
  }

  /**
   * Load a specific case by ID
   * @param {string} case_id - Case ID
   * @returns {object|null} Complete case data or null
   */
  loadCase(case_id) {
    if (!this.isAvailable()) {
      return null;
    }

    // Find case in index
    const caseInfo = this.index.cases.find(c => c.case_id === case_id);

    if (!caseInfo) {
      console.warn(`⚠️  Case not found: ${case_id}`);
      return null;
    }

    try {
      // Load case.json
      const casePath = path.join(
        path.dirname(this.indexPath),
        '..',
        caseInfo.path,
        'case.json'
      );

      if (!fs.existsSync(casePath)) {
        console.error(`❌ Case file not found: ${casePath}`);
        return null;
      }

      const caseData = JSON.parse(fs.readFileSync(casePath, 'utf8'));

      // Update exhibit file paths to be absolute
      if (caseData.content && caseData.content.exhibits) {
        const caseDir = path.dirname(casePath);

        caseData.content.exhibits = caseData.content.exhibits.map(exhibit => {
          if (exhibit.files) {
            Object.keys(exhibit.files).forEach(fileType => {
              const relativePath = exhibit.files[fileType];
              exhibit.files[fileType] = path.join(caseDir, relativePath);
            });
          }
          return exhibit;
        });
      }

      // Update visual asset paths
      if (caseData.visual_assets) {
        const caseDir = path.dirname(casePath);

        if (caseData.visual_assets.images) {
          caseData.visual_assets.images = caseData.visual_assets.images.map(img => ({
            ...img,
            filepath: path.join(caseDir, 'exhibits', img.filename)
          }));
        }

        if (caseData.visual_assets.screenshots) {
          caseData.visual_assets.screenshots = caseData.visual_assets.screenshots.map(screenshot => ({
            ...screenshot,
            filepath: path.join(caseDir, 'exhibits', screenshot.filename)
          }));
        }
      }

      return caseData;

    } catch (error) {
      console.error(`❌ Error loading case ${case_id}:`, error.message);
      return null;
    }
  }

  /**
   * List cases matching criteria
   * @param {object} criteria - Filter criteria
   * @param {number} limit - Maximum number of results
   * @returns {Array} List of case metadata
   */
  listCases(criteria = {}, limit = 100) {
    if (!this.isAvailable()) {
      return [];
    }

    const {
      case_type,
      difficulty,
      industry,
      min_quality = 0
    } = criteria;

    let results = this.index.cases.filter(caseInfo => {
      if (case_type && caseInfo.case_type !== case_type) {
        return false;
      }

      if (difficulty && caseInfo.difficulty !== difficulty) {
        return false;
      }

      if (industry && caseInfo.industry !== industry) {
        return false;
      }

      if (caseInfo.quality_score < min_quality) {
        return false;
      }

      return true;
    });

    // Sort by quality score (descending)
    results.sort((a, b) => b.quality_score - a.quality_score);

    // Limit results
    return results.slice(0, limit);
  }

  /**
   * Get available case types
   * @returns {Array<string>}
   */
  getCaseTypes() {
    if (!this.isAvailable()) {
      return [];
    }

    return Object.keys(this.index.statistics.by_type);
  }

  /**
   * Get available difficulties
   * @returns {Array<string>}
   */
  getDifficulties() {
    if (!this.isAvailable()) {
      return [];
    }

    return Object.keys(this.index.statistics.by_difficulty);
  }

  /**
   * Get available industries
   * @returns {Array<string>}
   */
  getIndustries() {
    if (!this.isAvailable()) {
      return [];
    }

    return Object.keys(this.index.statistics.by_industry);
  }

  /**
   * Search cases by text query
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Array} Matching cases
   */
  searchCases(query, limit = 10) {
    if (!this.isAvailable() || !query) {
      return [];
    }

    const queryLower = query.toLowerCase();

    const results = this.index.cases.filter(caseInfo => {
      // Search in title
      if (caseInfo.title && caseInfo.title.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Search in tags
      if (caseInfo.tags && caseInfo.tags.some(tag => tag.includes(queryLower))) {
        return true;
      }

      // Search in industry
      if (caseInfo.industry && caseInfo.industry.toLowerCase().includes(queryLower)) {
        return true;
      }

      return false;
    });

    return results.slice(0, limit);
  }

  /**
   * Get a random case
   * @param {object} criteria - Optional filters
   * @returns {object|null} Random case
   */
  getRandomCase(criteria = {}) {
    return this.findCase(criteria);
  }

  /**
   * Reload the index (useful after updating library)
   */
  reload() {
    this.loadIndex();
  }
}

module.exports = CaseLibrary;
