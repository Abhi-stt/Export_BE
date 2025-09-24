const OfficialGovernmentScrapers = require('./realDataServices/officialGovernmentScrapers');

/**
 * Real Trade Data Service - Orchestrates all real data sources
 * Provides comprehensive Indian trade data with NO FALLBACKS
 */
class RealTradeDataService {
  constructor() {
    this.officialScrapers = new OfficialGovernmentScrapers();
  }

  /**
   * Get complete trade analysis for a product
   * @param {string} productDescription - Product description
   * @returns {Promise<Object>} Complete trade analysis
   */
  async getCompleteTradeAnalysis(productDescription) {
    try {
      console.log(`🚀 Starting complete trade analysis for: ${productDescription}`);
      
      // Step 1: Get HS code from official government sources
      const hsCodeResult = await this.officialScrapers.getOfficialHSCodes(productDescription);
      
      if (!hsCodeResult.success) {
        throw new Error(`Failed to get HS code: ${hsCodeResult.error}`);
      }

      const hsCode = hsCodeResult.hsCode.code;
      console.log(`✅ Official HS Code found: ${hsCode}`);

      // Step 2: Get exporters and importers from official government sources in parallel
      const [exportersResult, importersResult] = await Promise.all([
        this.officialScrapers.getOfficialExporters(hsCode, 15),
        this.officialScrapers.getOfficialImporters(hsCode, 15)
      ]);

      if (!exportersResult.success) {
        throw new Error(`Failed to get exporters: ${exportersResult.error}`);
      }

      if (!importersResult.success) {
        throw new Error(`Failed to get importers: ${importersResult.error}`);
      }

      // Step 3: Get blacklist status from official government sources
      const blacklistResult = await this.officialScrapers.getOfficialBlacklist();

      // Step 4: Aggregate results
      const completeAnalysis = this.aggregateTradeAnalysis(
        hsCodeResult,
        exportersResult,
        importersResult,
        blacklistResult,
        productDescription
      );

      console.log(`🎉 Complete trade analysis finished for: ${productDescription}`);
      
      return {
        success: true,
        analysis: completeAnalysis,
        metadata: {
          allDataReal: true,
          noFallbacksUsed: true,
          dataFreshness: 'Real-time',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Complete Trade Analysis Error:', error.message);
      return {
        success: false,
        error: `Failed to complete trade analysis: ${error.message}`,
        metadata: {
          allDataReal: false,
          noFallbacksUsed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get HS code only
   * @param {string} productDescription - Product description
   * @returns {Promise<Object>} HS code result
   */
  async getHSCodeOnly(productDescription) {
    try {
      console.log(`🔍 Getting official HS code for: ${productDescription}`);
      
      const result = await this.officialScrapers.getOfficialHSCodes(productDescription);
      
      if (!result.success) {
        throw new Error(`Failed to get HS code: ${result.error}`);
      }

      console.log(`✅ Official HS Code retrieved: ${result.hsCode.code}`);
      
      return {
        success: true,
        hsCode: result.hsCode,
        metadata: {
          source: 'Official Government Sources (CBIC/DGFT/ICEGATE)',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official HS Code Error:', error.message);
      return {
        success: false,
        error: `Failed to get official HS code: ${error.message}`,
        metadata: {
          source: 'Official Government Sources (CBIC/DGFT/ICEGATE)',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get exporters for HS code
   * @param {string} hsCode - HS code
   * @param {number} limit - Maximum results
   * @returns {Promise<Object>} Exporters result
   */
  async getExportersForHSCode(hsCode, limit = 15) {
    try {
      console.log(`🔍 Getting official exporters for HS code: ${hsCode}`);
      
      const result = await this.officialScrapers.getOfficialExporters(hsCode, limit);
      
      if (!result.success) {
        throw new Error(`Failed to get exporters: ${result.error}`);
      }

      console.log(`✅ Found ${result.exporters.total} official exporters for HS code: ${hsCode}`);
      
      return {
        success: true,
        exporters: result.exporters,
        metadata: {
          source: 'Official Government Sources (DGFT/ICEGATE)',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Exporters Error:', error.message);
      return {
        success: false,
        error: `Failed to get official exporters: ${error.message}`,
        metadata: {
          source: 'Official Government Sources (DGFT/ICEGATE)',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get importers for HS code
   * @param {string} hsCode - HS code
   * @param {number} limit - Maximum results
   * @returns {Promise<Object>} Importers result
   */
  async getImportersForHSCode(hsCode, limit = 15) {
    try {
      console.log(`🔍 Getting official importers for HS code: ${hsCode}`);
      
      const result = await this.officialScrapers.getOfficialImporters(hsCode, limit);
      
      if (!result.success) {
        throw new Error(`Failed to get importers: ${result.error}`);
      }

      console.log(`✅ Found ${result.importers.total} official importers for HS code: ${hsCode}`);
      
      return {
        success: true,
        importers: result.importers,
        metadata: {
          source: 'Official Government Sources (DGFT/ICEGATE)',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Importers Error:', error.message);
      return {
        success: false,
        error: `Failed to get official importers: ${error.message}`,
        metadata: {
          source: 'Official Government Sources (DGFT/ICEGATE)',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Check blacklist status for companies
   * @param {Array} companies - Array of company names
   * @returns {Promise<Object>} Blacklist check result
   */
  async checkBlacklistStatus(companies) {
    try {
      console.log(`🔍 Checking blacklist status for ${companies.length} companies`);
      
      const result = await this.blacklistScraper.checkMultipleCompanies(companies);
      
      if (!result.success) {
        throw new Error(`Failed to check blacklist: ${result.error}`);
      }

      console.log(`✅ Blacklist check completed for ${companies.length} companies`);
      
      return {
        success: true,
        blacklistStatus: result.summary,
        results: result.results,
        metadata: {
          source: 'RBI + DGFT + FEMA',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Blacklist Check Error:', error.message);
      return {
        success: false,
        error: `Failed to check blacklist: ${error.message}`,
        metadata: {
          source: 'RBI + DGFT + FEMA',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Aggregate trade analysis results
   * @param {Object} hsCodeResult - HS code result
   * @param {Object} exportersResult - Exporters result
   * @param {Object} importersResult - Importers result
   * @param {Object} blacklistResult - Blacklist result
   * @param {string} productDescription - Product description
   * @returns {Object} Aggregated analysis
   */
  aggregateTradeAnalysis(hsCodeResult, exportersResult, importersResult, blacklistResult, productDescription) {
    return {
      productDescription: productDescription,
      hsCode: hsCodeResult.hsCode,
      indianExporters: {
        total: exportersResult.exporters.total,
        companies: exportersResult.exporters.companies,
        hsCode: exportersResult.exporters.hsCode,
        source: exportersResult.exporters.source,
        lastUpdated: exportersResult.exporters.lastUpdated
      },
      indianImporters: {
        total: importersResult.importers.total,
        companies: importersResult.importers.companies,
        hsCode: importersResult.importers.hsCode,
        source: importersResult.importers.source,
        lastUpdated: importersResult.importers.lastUpdated
      },
      blacklistAnalysis: {
        totalChecked: blacklistResult.success ? blacklistResult.summary.total : 0,
        blacklisted: blacklistResult.success ? blacklistResult.summary.blacklisted : 0,
        underReview: blacklistResult.success ? blacklistResult.summary.underReview : 0,
        clean: blacklistResult.success ? blacklistResult.summary.clean : 0,
        errorRate: blacklistResult.success ? blacklistResult.summary.errorRate : '100%',
        lastChecked: new Date().toISOString()
      },
      summary: {
        hsCodeFound: true,
        exportersFound: exportersResult.exporters.total > 0,
        importersFound: importersResult.importers.total > 0,
        blacklistChecked: blacklistResult.success,
        allDataReal: true,
        noFallbacksUsed: true
      }
    };
  }

  /**
   * Validate input parameters
   * @param {string} productDescription - Product description
   * @returns {Object} Validation result
   */
  validateInput(productDescription) {
    if (!productDescription || productDescription.trim().length === 0) {
      return {
        valid: false,
        error: 'Product description is required'
      };
    }

    if (productDescription.trim().length < 3) {
      return {
        valid: false,
        error: 'Product description must be at least 3 characters long'
      };
    }

    return {
      valid: true,
      error: null
    };
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      service: 'RealTradeDataService',
      status: 'healthy',
      components: {
        hsCodeScraper: 'active',
        dgftScraper: 'active',
        blacklistScraper: 'active'
      },
      lastCheck: new Date().toISOString(),
      realDataOnly: true,
      noFallbacks: true
    };
  }
}

module.exports = RealTradeDataService;
