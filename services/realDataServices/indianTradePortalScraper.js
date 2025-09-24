const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Indian Trade Portal Scraper - Real HS Code Classification
 * Scrapes real HS codes from Indian Trade Portal
 * NO FALLBACKS - Returns error if no real data found
 */
class IndianTradePortalScraper {
  constructor() {
    this.baseURL = 'https://www.indiantradeportal.in';
    this.searchURL = 'https://www.indiantradeportal.in/vs.jsp';
    this.rateLimit = 2000; // 2 seconds between requests
    this.lastRequest = 0;
  }

  /**
   * Get HS code for product description
   * @param {string} productDescription - Product description
   * @returns {Promise<Object>} Real HS code data or error
   */
  async getHSCode(productDescription) {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Searching HS code for: ${productDescription}`);
      
      const response = await axios.post(this.searchURL, {
        btnSubmit: 'Search',
        pid: '1',
        txthscode: '',
        txtproduct: productDescription
      }, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseHSCodes($);
      
      if (!hsCodes || hsCodes.length === 0) {
        throw new Error(`No real HS code found for: ${productDescription}`);
      }

      // Return the most relevant HS code
      const primaryHSCode = hsCodes[0];
      
      console.log(`✅ Found real HS code: ${primaryHSCode.code} for ${productDescription}`);
      
      return {
        success: true,
        hsCode: {
          code: primaryHSCode.code,
          description: primaryHSCode.description,
          chapter: primaryHSCode.chapter,
          category: primaryHSCode.category,
          source: 'Indian Trade Portal',
          confidence: primaryHSCode.confidence || 95,
          allSuggestions: hsCodes,
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Indian Trade Portal',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Indian Trade Portal Scraper Error:', error.message);
      return {
        success: false,
        error: `Failed to get real HS code: ${error.message}`,
        metadata: {
          source: 'Indian Trade Portal',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Parse HS codes from HTML response
   * @param {Object} $ - Cheerio object
   * @returns {Array} Parsed HS codes
   */
  parseHSCodes($) {
    const hsCodes = [];
    
    // Look for HS code tables in the response
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        const code = $(cells[0]).text().trim();
        const description = $(cells[1]).text().trim();
        const chapter = $(cells[2]).text().trim();
        
        if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
          hsCodes.push({
            code: code,
            description: description,
            chapter: chapter,
            category: this.getCategoryFromChapter(chapter),
            confidence: this.calculateConfidence(description)
          });
        }
      }
    });

    // Alternative parsing for different page structures
    if (hsCodes.length === 0) {
      $('.hs-code, .hscode, [class*="hs"]').each((index, element) => {
        const text = $(element).text();
        const codeMatch = text.match(/(\d{4}\.\d{2}\.\d{2})/);
        
        if (codeMatch) {
          hsCodes.push({
            code: codeMatch[1],
            description: text.replace(codeMatch[1], '').trim(),
            chapter: codeMatch[1].substring(0, 2),
            category: this.getCategoryFromChapter(codeMatch[1].substring(0, 2)),
            confidence: this.calculateConfidence(text)
          });
        }
      });
    }

    return hsCodes;
  }

  /**
   * Get category from chapter number
   * @param {string} chapter - Chapter number
   * @returns {string} Category name
   */
  getCategoryFromChapter(chapter) {
    const categories = {
      '09': 'Coffee, Tea, Mate and Spices',
      '10': 'Cereals',
      '11': 'Products of the milling industry',
      '12': 'Oil seeds and oleaginous fruits',
      '13': 'Lac; gums, resins and other vegetable saps',
      '14': 'Vegetable plaiting materials',
      '15': 'Animal or vegetable fats and oils',
      '16': 'Preparations of meat, of fish or of crustaceans',
      '17': 'Sugars and sugar confectionery',
      '18': 'Cocoa and cocoa preparations',
      '19': 'Preparations of cereals, flour, starch or milk',
      '20': 'Preparations of vegetables, fruit, nuts or other parts of plants',
      '21': 'Miscellaneous edible preparations',
      '22': 'Beverages, spirits and vinegar',
      '23': 'Residues and waste from the food industries',
      '24': 'Tobacco and manufactured tobacco substitutes'
    };
    
    return categories[chapter] || 'Other';
  }

  /**
   * Calculate confidence score based on description match
   * @param {string} description - Product description
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidence(description) {
    // Simple confidence calculation based on description length and keywords
    let confidence = 70; // Base confidence
    
    if (description.length > 20) confidence += 10;
    if (description.toLowerCase().includes('organic')) confidence += 5;
    if (description.toLowerCase().includes('powder')) confidence += 5;
    if (description.toLowerCase().includes('turmeric')) confidence += 10;
    
    return Math.min(confidence, 100);
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

  /**
   * Validate HS code format
   * @param {string} code - HS code to validate
   * @returns {boolean} Is valid HS code
   */
  isValidHSCode(code) {
    return /^\d{4}\.\d{2}\.\d{2}$/.test(code);
  }
}

module.exports = IndianTradePortalScraper;
