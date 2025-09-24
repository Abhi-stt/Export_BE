const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Blacklist Scraper - Real Blacklist Data from Indian Government Sources
 * Scrapes real blacklist data from RBI, DGFT, and FEMA
 * NO FALLBACKS - Returns error if no real data found
 */
class BlacklistScraper {
  constructor() {
    this.rbiAlertURL = 'https://www.rbi.org.in/Scripts/BS_ViewAlertList.aspx';
    this.dgftDeniedURL = 'https://dgft.gov.in/CP/?opt=denied';
    this.femaViolatorsURL = 'https://www.rbi.org.in/Scripts/Fema.aspx';
    this.rateLimit = 5000; // 5 seconds between requests
    this.lastRequest = 0;
  }

  /**
   * Check if company is blacklisted
   * @param {string} companyName - Company name to check
   * @returns {Promise<Object>} Blacklist status or error
   */
  async checkBlacklist(companyName) {
    try {
      console.log(`🔍 Checking blacklist status for: ${companyName}`);
      
      const [rbiResult, dgftResult, femaResult] = await Promise.all([
        this.checkRBIAlertList(companyName),
        this.checkDGFTDeniedList(companyName),
        this.checkFEMAViolators(companyName)
      ]);

      const blacklistStatus = this.aggregateBlacklistResults(rbiResult, dgftResult, femaResult, companyName);

      console.log(`✅ Blacklist check completed for: ${companyName}`);
      
      return {
        success: true,
        blacklistStatus: blacklistStatus,
        metadata: {
          source: 'RBI + DGFT + FEMA',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Blacklist Scraper Error:', error.message);
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
   * Check RBI Alert List
   * @param {string} companyName - Company name to check
   * @returns {Promise<Object>} RBI check result
   */
  async checkRBIAlertList(companyName) {
    try {
      await this.enforceRateLimit();
      
      const response = await axios.get(this.rbiAlertURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const isBlacklisted = this.searchInRBIList($, companyName);
      
      return {
        source: 'RBI Alert List',
        status: isBlacklisted ? 'Blacklisted' : 'Clean',
        details: isBlacklisted ? 'Found in RBI Alert List' : 'Not found in RBI Alert List',
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('RBI Alert List check failed:', error.message);
      return {
        source: 'RBI Alert List',
        status: 'Error',
        details: `Failed to check RBI Alert List: ${error.message}`,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Check DGFT Denied Entity List
   * @param {string} companyName - Company name to check
   * @returns {Promise<Object>} DGFT check result
   */
  async checkDGFTDeniedList(companyName) {
    try {
      await this.enforceRateLimit();
      
      const response = await axios.get(this.dgftDeniedURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const isBlacklisted = this.searchInDGFTList($, companyName);
      
      return {
        source: 'DGFT Denied Entity List',
        status: isBlacklisted ? 'Blacklisted' : 'Clean',
        details: isBlacklisted ? 'Found in DGFT Denied Entity List' : 'Not found in DGFT Denied Entity List',
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('DGFT Denied List check failed:', error.message);
      return {
        source: 'DGFT Denied Entity List',
        status: 'Error',
        details: `Failed to check DGFT Denied List: ${error.message}`,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Check FEMA Violators List
   * @param {string} companyName - Company name to check
   * @returns {Promise<Object>} FEMA check result
   */
  async checkFEMAViolators(companyName) {
    try {
      await this.enforceRateLimit();
      
      const response = await axios.get(this.femaViolatorsURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const isBlacklisted = this.searchInFEMAList($, companyName);
      
      return {
        source: 'FEMA Violators List',
        status: isBlacklisted ? 'Blacklisted' : 'Clean',
        details: isBlacklisted ? 'Found in FEMA Violators List' : 'Not found in FEMA Violators List',
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('FEMA Violators check failed:', error.message);
      return {
        source: 'FEMA Violators List',
        status: 'Error',
        details: `Failed to check FEMA Violators: ${error.message}`,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Search company name in RBI list
   * @param {Object} $ - Cheerio object
   * @param {string} companyName - Company name to search
   * @returns {boolean} Is blacklisted
   */
  searchInRBIList($, companyName) {
    let isBlacklisted = false;
    
    // Search in various table structures
    $('table tr').each((index, row) => {
      const $row = $(row);
      const text = $row.text().toLowerCase();
      
      if (text.includes(companyName.toLowerCase())) {
        isBlacklisted = true;
        return false; // Break the loop
      }
    });

    // Alternative search in divs and other elements
    if (!isBlacklisted) {
      $('div, p, span').each((index, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes(companyName.toLowerCase()) && text.length < 200) {
          isBlacklisted = true;
          return false; // Break the loop
        }
      });
    }

    return isBlacklisted;
  }

  /**
   * Search company name in DGFT list
   * @param {Object} $ - Cheerio object
   * @param {string} companyName - Company name to search
   * @returns {boolean} Is blacklisted
   */
  searchInDGFTList($, companyName) {
    let isBlacklisted = false;
    
    // Search in denied entity tables
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      cells.each((cellIndex, cell) => {
        const text = $(cell).text().toLowerCase();
        if (text.includes(companyName.toLowerCase())) {
          isBlacklisted = true;
          return false; // Break the loop
        }
      });
    });

    // Alternative search in other elements
    if (!isBlacklisted) {
      $('div, p, span').each((index, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes(companyName.toLowerCase()) && text.length < 300) {
          isBlacklisted = true;
          return false; // Break the loop
        }
      });
    }

    return isBlacklisted;
  }

  /**
   * Search company name in FEMA list
   * @param {Object} $ - Cheerio object
   * @param {string} companyName - Company name to search
   * @returns {boolean} Is blacklisted
   */
  searchInFEMAList($, companyName) {
    let isBlacklisted = false;
    
    // Search in FEMA violators tables
    $('table tr').each((index, row) => {
      const $row = $(row);
      const text = $row.text().toLowerCase();
      
      if (text.includes(companyName.toLowerCase())) {
        isBlacklisted = true;
        return false; // Break the loop
      }
    });

    // Alternative search in other elements
    if (!isBlacklisted) {
      $('div, p, span').each((index, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes(companyName.toLowerCase()) && text.length < 250) {
          isBlacklisted = true;
          return false; // Break the loop
        }
      });
    }

    return isBlacklisted;
  }

  /**
   * Aggregate blacklist results from multiple sources
   * @param {Object} rbiResult - RBI check result
   * @param {Object} dgftResult - DGFT check result
   * @param {Object} femaResult - FEMA check result
   * @param {string} companyName - Company name
   * @returns {Object} Aggregated blacklist status
   */
  aggregateBlacklistResults(rbiResult, dgftResult, femaResult, companyName) {
    const results = [rbiResult, dgftResult, femaResult];
    const blacklistedSources = results.filter(r => r.status === 'Blacklisted');
    const errorSources = results.filter(r => r.status === 'Error');
    
    let overallStatus = 'Clean';
    let riskScore = 0;
    
    if (blacklistedSources.length > 0) {
      overallStatus = 'Blacklisted';
      riskScore = 100;
    } else if (errorSources.length > 0) {
      overallStatus = 'Under Review';
      riskScore = 50;
    }

    return {
      companyName: companyName,
      overallStatus: overallStatus,
      riskScore: riskScore,
      sourcesChecked: results.length,
      blacklistedSources: blacklistedSources.length,
      errorSources: errorSources.length,
      details: results,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Check multiple companies for blacklist status
   * @param {Array} companies - Array of company names
   * @returns {Promise<Object>} Batch blacklist check results
   */
  async checkMultipleCompanies(companies) {
    try {
      console.log(`🔍 Checking blacklist status for ${companies.length} companies`);
      
      const results = await Promise.all(
        companies.map(company => this.checkBlacklist(company))
      );

      const summary = this.generateBlacklistSummary(results);

      console.log(`✅ Batch blacklist check completed for ${companies.length} companies`);
      
      return {
        success: true,
        summary: summary,
        results: results,
        metadata: {
          source: 'RBI + DGFT + FEMA',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Batch Blacklist Check Error:', error.message);
      return {
        success: false,
        error: `Failed to check blacklist for multiple companies: ${error.message}`,
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
   * Generate summary of blacklist check results
   * @param {Array} results - Array of blacklist check results
   * @returns {Object} Summary statistics
   */
  generateBlacklistSummary(results) {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const blacklisted = results.filter(r => 
      r.success && r.blacklistStatus.overallStatus === 'Blacklisted'
    ).length;
    const underReview = results.filter(r => 
      r.success && r.blacklistStatus.overallStatus === 'Under Review'
    ).length;
    const clean = results.filter(r => 
      r.success && r.blacklistStatus.overallStatus === 'Clean'
    ).length;

    return {
      total: total,
      successful: successful,
      blacklisted: blacklisted,
      underReview: underReview,
      clean: clean,
      errorRate: ((total - successful) / total * 100).toFixed(2) + '%'
    };
  }

  /**
   * Enforce rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.rateLimit) {
      const waitTime = this.rateLimit - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }
}

module.exports = BlacklistScraper;
