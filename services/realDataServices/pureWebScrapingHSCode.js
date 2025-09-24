const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Pure Web Scraping HS Code Service - NO AI
 * Uses only web scraping to get the most matching HS code
 * NO FALLBACKS - Returns error if no real data found
 */
class PureWebScrapingHSCode {
  constructor() {
    this.baseURL = 'https://www.indiantradeportal.in';
    this.searchURL = 'https://www.indiantradeportal.in/vs.jsp';
    this.rateLimit = 2000; // 2 seconds between requests
    this.lastRequest = 0;
  }

  /**
   * Get HS code for product description using ONLY web scraping
   * @param {string} productDescription - Product description
   * @returns {Promise<Object>} Real HS code data or error
   */
  async getHSCode(productDescription) {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Pure web scraping HS code search for: ${productDescription}`);
      
      // Try multiple web scraping approaches
      const hsCodes = await this.searchHSCodesWebScraping(productDescription);
      
      if (!hsCodes || hsCodes.length === 0) {
        throw new Error(`No real HS code found via web scraping for: ${productDescription}`);
      }

      // Select the most matching HS code based on description similarity
      const primaryHSCode = this.selectMostMatchingHSCode(hsCodes, productDescription);
      
      console.log(`✅ Pure web scraping found HS code: ${primaryHSCode.code} for ${productDescription}`);
      
      return {
        success: true,
        hsCode: {
          code: primaryHSCode.code,
          description: primaryHSCode.description,
          chapter: primaryHSCode.chapter || primaryHSCode.structure?.chapter,
          heading: primaryHSCode.heading || primaryHSCode.structure?.heading,
          subHeading: primaryHSCode.subHeading || primaryHSCode.structure?.subHeading,
          tariffItem: primaryHSCode.tariffItem || primaryHSCode.structure?.tariffItem,
          category: primaryHSCode.category,
          source: primaryHSCode.source || 'Pure Web Scraping',
          confidence: primaryHSCode.confidence,
          rawCode: primaryHSCode.rawCode,
          isCBICFormat: primaryHSCode.isCBICFormat,
          gstRates: primaryHSCode.gstRates,
          structure: primaryHSCode.structure,
          allSuggestions: hsCodes,
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Pure Web Scraping - NO AI',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Pure Web Scraping HS Code Error:', error.message);
      return {
        success: false,
        error: `Failed to get real HS code via web scraping: ${error.message}`,
        metadata: {
          source: 'Pure Web Scraping - NO AI',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Search HS codes using only web scraping
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes from web scraping
   */
  async searchHSCodesWebScraping(productDescription) {
    const hsCodes = [];

    try {
      // Source 1: CBIC GST Portal scraping (Priority source for official rates)
      const cbicHSCodes = await this.scrapeCBICGSTPortal(productDescription);
      if (cbicHSCodes && cbicHSCodes.length > 0) {
        hsCodes.push(...cbicHSCodes);
      }
    } catch (error) {
      console.warn('CBIC GST Portal scraping failed:', error.message);
    }

    try {
      // Source 2: Indian Trade Portal web scraping
      const portalHSCodes = await this.scrapeIndianTradePortal(productDescription);
      if (portalHSCodes && portalHSCodes.length > 0) {
        hsCodes.push(...portalHSCodes);
      }
    } catch (error) {
      console.warn('Indian Trade Portal scraping failed:', error.message);
    }

    try {
      // Source 3: Direct HS code database scraping
      const dbHSCodes = await this.scrapeHSCodeDatabase(productDescription);
      if (dbHSCodes && dbHSCodes.length > 0) {
        hsCodes.push(...dbHSCodes);
      }
    } catch (error) {
      console.warn('HS Code database scraping failed:', error.message);
    }

    // NO FALLBACK - Only web scraping allowed
    // If web scraping fails, return empty array

    // Remove duplicates and return
    return this.removeDuplicateHSCodes(hsCodes);
  }

  /**
   * Scrape CBIC GST Portal for official HS codes and rates
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes with official GST rates
   */
  async scrapeCBICGSTPortal(productDescription) {
    try {
      console.log(`🔍 Scraping CBIC GST Portal for: ${productDescription}`);
      
      // Search CBIC GST rates page
      const response = await axios.get('https://cbic-gst.gov.in/gst-goods-services-rates.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseCBICGSTRates($, productDescription);
      
      console.log(`✅ CBIC GST Portal scraping found ${hsCodes.length} HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('CBIC GST Portal scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Parse CBIC GST rates from HTML response
   * @param {Object} $ - Cheerio object
   * @param {string} productDescription - Product description for matching
   * @returns {Array} Parsed HS codes with GST rates
   */
  parseCBICGSTRates($, productDescription) {
    const hsCodes = [];
    
    // Look for the goods table specifically (not services)
    // The goods table has a different structure and contains actual HS codes
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 6) {
        // CBIC GST goods table structure: Schedules | S.No | Chapter/Heading/Sub-heading/Tariff item | Description | CGST | SGST/UTGST | IGST | Compensation Cess
        const tariffItem = $(cells[2]).text().trim();
        const description = $(cells[3]).text().trim();
        const cgstRate = $(cells[4]).text().trim();
        const sgstRate = $(cells[5]).text().trim();
        const igstRate = $(cells[6]).text().trim();
        
        // Filter for goods entries (not services) - look for actual HS codes
        if (tariffItem && description && 
            !description.includes('[Omitted]') && 
            !description.includes('Services') &&
            !description.includes('Act, 20') && // Exclude service entries with years
            !description.includes('Nil') &&
            tariffItem.match(/^\d{4}(,\s*\d{4})*$/)) { // Only entries with HS codes like "0202" or "0202, 0203"
          
          const hsCodeMatches = tariffItem.match(/\b(\d{4})\b/g);
          
          if (hsCodeMatches && hsCodeMatches.length > 0) {
            const confidence = this.calculateMatchingConfidence(description, productDescription);
            
            // Create HS code entry for each code in the list
            hsCodeMatches.forEach(hsCode => {
              const structure = this.parseHSStructure(hsCode);
              
              hsCodes.push({
                code: hsCode + '.00.00', // Format as full HS code
                description: description,
                chapter: structure.chapter,
                heading: structure.heading,
                subHeading: structure.subHeading,
                tariffItem: structure.tariffItem,
                category: this.getCategoryFromChapter(structure.chapter),
                confidence: confidence,
                source: 'CBIC GST Portal Official',
                rawCode: tariffItem,
                isCBICFormat: true,
                gstRates: {
                  cgst: cgstRate,
                  sgst: sgstRate,
                  igst: igstRate
                },
                structure: {
                  chapter: structure.chapter,
                  heading: structure.heading,
                  subHeading: structure.subHeading,
                  tariffItem: structure.tariffItem
                }
              });
            });
          }
        }
      }
    });

    return hsCodes;
  }

  /**
   * Scrape Indian Trade Portal for HS codes
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes
   */
  async scrapeIndianTradePortal(productDescription) {
    try {
      console.log(`🔍 Scraping Indian Trade Portal for: ${productDescription}`);
      
      // Try multiple approaches for Indian Trade Portal
      const approaches = [
        // Approach 1: Direct search URL
        () => axios.get(`https://www.indiantradeportal.in/vs.jsp?txtproduct=${encodeURIComponent(productDescription)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 30000
        }),
        
        // Approach 2: POST request
        () => axios.post(this.searchURL, new URLSearchParams({
          btnSubmit: 'Search',
          pid: '1',
          txthscode: '',
          txtproduct: productDescription
        }), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 30000
        }),
        
        // Approach 3: Alternative search endpoint
        () => axios.get(`https://www.indiantradeportal.in/search?q=${encodeURIComponent(productDescription)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 30000
        })
      ];

      let response = null;
      for (const approach of approaches) {
        try {
          response = await approach();
          if (response && response.data) {
            break;
          }
        } catch (error) {
          console.warn(`Approach failed: ${error.message}`);
          continue;
        }
      }

      if (!response || !response.data) {
        throw new Error('All scraping approaches failed');
      }

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseHSCodesFromHTML($, productDescription);
      
      console.log(`✅ Indian Trade Portal scraping found ${hsCodes.length} HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('Indian Trade Portal scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape HS code database directly
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes
   */
  async scrapeHSCodeDatabase(productDescription) {
    try {
      console.log(`🔍 Scraping HS Code database for: ${productDescription}`);
      
      // Try multiple HS code database sources
      const sources = [
        // Source 1: TariffNumber
        {
          url: `https://www.tariffnumber.com/search.php?search=${encodeURIComponent(productDescription)}`,
          parser: this.parseHSCodesFromTariffNumber.bind(this)
        },
        
        // Source 2: HS Code Lookup
        {
          url: `https://hscode.lookup/search?q=${encodeURIComponent(productDescription)}`,
          parser: this.parseHSCodesFromHSLookup.bind(this)
        },
        
        // Source 3: Trade Data Online
        {
          url: `https://www.tradedataonline.com/search?query=${encodeURIComponent(productDescription)}`,
          parser: this.parseHSCodesFromTradeData.bind(this)
        }
      ];

      let hsCodes = [];
      
      for (const source of sources) {
        try {
          const response = await axios.get(source.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 30000
          });

          const $ = cheerio.load(response.data);
          const codes = source.parser($, productDescription);
          
          if (codes && codes.length > 0) {
            hsCodes.push(...codes);
            console.log(`✅ Found ${codes.length} HS codes from ${source.url}`);
          }
        } catch (error) {
          console.warn(`Failed to scrape ${source.url}: ${error.message}`);
          continue;
        }
      }
      
      console.log(`✅ HS Code database scraping found ${hsCodes.length} total HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('HS Code database scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Parse HS codes from Indian Trade Portal HTML
   * @param {Object} $ - Cheerio object
   * @param {string} productDescription - Product description for matching
   * @returns {Array} Parsed HS codes
   */
  parseHSCodesFromHTML($, productDescription) {
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
          const confidence = this.calculateMatchingConfidence(description, productDescription);
          const structure = this.parseHSStructure(code);
          
          hsCodes.push({
            code: code,
            description: description,
            chapter: structure.chapter,
            heading: structure.heading,
            subHeading: structure.subHeading,
            tariffItem: structure.tariffItem,
            category: this.getCategoryFromChapter(structure.chapter),
            confidence: confidence,
            source: 'Indian Trade Portal Web Scraping',
            structure: {
              chapter: structure.chapter,
              heading: structure.heading,
              subHeading: structure.subHeading,
              tariffItem: structure.tariffItem
            }
          });
        }
      }
    });

    // Also look for HS codes in other elements
    $('.hs-code, .hscode, [class*="hs"], [id*="hs"]').each((index, element) => {
      const text = $(element).text();
      const codeMatch = text.match(/(\d{4}\.\d{2}\.\d{2})/);
      
      if (codeMatch) {
        const confidence = this.calculateMatchingConfidence(text, productDescription);
        const structure = this.parseHSStructure(codeMatch[1]);
        
        hsCodes.push({
          code: codeMatch[1],
          description: text.replace(codeMatch[1], '').trim(),
          chapter: structure.chapter,
          heading: structure.heading,
          subHeading: structure.subHeading,
          tariffItem: structure.tariffItem,
          category: this.getCategoryFromChapter(structure.chapter),
          confidence: confidence,
          source: 'Indian Trade Portal Web Scraping',
          structure: {
            chapter: structure.chapter,
            heading: structure.heading,
            subHeading: structure.subHeading,
            tariffItem: structure.tariffItem
          }
        });
      }
    });

    return hsCodes;
  }

  /**
   * Parse HS codes from HS Lookup HTML
   * @param {Object} $ - Cheerio object
   * @param {string} productDescription - Product description for matching
   * @returns {Array} Parsed HS codes
   */
  parseHSCodesFromHSLookup($, productDescription) {
    const hsCodes = [];
    
    // Look for HS code results in HS Lookup format
    $('.hs-result, .code-result, .search-result').each((index, element) => {
      const $element = $(element);
      const codeElement = $element.find('.code, .hs-code, .number');
      const descElement = $element.find('.description, .desc, .name');
      
      const code = codeElement.text().trim();
      const description = descElement.text().trim();
      
      if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/) && description) {
        const confidence = this.calculateMatchingConfidence(description, productDescription);
        const structure = this.parseHSStructure(code);
        
        hsCodes.push({
          code: code,
          description: description,
          chapter: structure.chapter,
          heading: structure.heading,
          subHeading: structure.subHeading,
          tariffItem: structure.tariffItem,
          category: this.getCategoryFromChapter(structure.chapter),
          confidence: confidence,
          source: 'HS Lookup Web Scraping',
          structure: {
            chapter: structure.chapter,
            heading: structure.heading,
            subHeading: structure.subHeading,
            tariffItem: structure.tariffItem
          }
        });
      }
    });

    return hsCodes;
  }

  /**
   * Parse HS codes from Trade Data Online HTML
   * @param {Object} $ - Cheerio object
   * @param {string} productDescription - Product description for matching
   * @returns {Array} Parsed HS codes
   */
  parseHSCodesFromTradeData($, productDescription) {
    const hsCodes = [];
    
    // Look for HS code results in Trade Data format
    $('.trade-result, .product-result, .hs-item').each((index, element) => {
      const $element = $(element);
      const codeElement = $element.find('.hs-code, .code, .tariff-code');
      const descElement = $element.find('.product-name, .description, .title');
      
      const code = codeElement.text().trim();
      const description = descElement.text().trim();
      
      if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/) && description) {
        const confidence = this.calculateMatchingConfidence(description, productDescription);
        const structure = this.parseHSStructure(code);
        
        hsCodes.push({
          code: code,
          description: description,
          chapter: structure.chapter,
          heading: structure.heading,
          subHeading: structure.subHeading,
          tariffItem: structure.tariffItem,
          category: this.getCategoryFromChapter(structure.chapter),
          confidence: confidence,
          source: 'Trade Data Online Web Scraping',
          structure: {
            chapter: structure.chapter,
            heading: structure.heading,
            subHeading: structure.subHeading,
            tariffItem: structure.tariffItem
          }
        });
      }
    });

    return hsCodes;
  }

  /**
   * Parse HS codes from TariffNumber HTML
   * @param {Object} $ - Cheerio object
   * @param {string} productDescription - Product description for matching
   * @returns {Array} Parsed HS codes
   */
  parseHSCodesFromTariffNumber($, productDescription) {
    const hsCodes = [];
    
    // Look for HS code results
    $('.result-item, .hs-code-item, table tr').each((index, row) => {
      const $row = $(row);
      const codeElement = $row.find('.code, .hs-code, td:first-child');
      const descElement = $row.find('.description, .desc, td:nth-child(2)');
      
      const code = codeElement.text().trim();
      const description = descElement.text().trim();
      
      if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/) && description) {
        const confidence = this.calculateMatchingConfidence(description, productDescription);
        const structure = this.parseHSStructure(code);
        
        hsCodes.push({
          code: code,
          description: description,
          chapter: structure.chapter,
          heading: structure.heading,
          subHeading: structure.subHeading,
          tariffItem: structure.tariffItem,
          category: this.getCategoryFromChapter(structure.chapter),
          confidence: confidence,
          source: 'TariffNumber Web Scraping',
          structure: {
            chapter: structure.chapter,
            heading: structure.heading,
            subHeading: structure.subHeading,
            tariffItem: structure.tariffItem
          }
        });
      }
    });

    return hsCodes;
  }

  /**
   * Calculate matching confidence based on description similarity
   * @param {string} description - HS code description
   * @param {string} productDescription - Product description
   * @returns {number} Confidence score (0-100)
   */
  calculateMatchingConfidence(description, productDescription) {
    const desc = description.toLowerCase();
    const product = productDescription.toLowerCase();
    
    // Exact match gets highest score
    if (desc === product) return 100;
    
    // Check for exact substring match (product description contained in HS description)
    if (desc.includes(product)) return 95;
    
    // Check for HS description contained in product description
    if (product.includes(desc)) return 90;
    
    let confidence = 0; // Start with 0 for more accurate scoring
    
    // Exact word matches
    const productWords = product.split(/\s+/).filter(word => word.length > 2);
    const descWords = desc.split(/\s+/).filter(word => word.length > 2);
    
    if (productWords.length === 0 || descWords.length === 0) return 0;
    
    let exactMatches = 0;
    productWords.forEach(word => {
      if (descWords.includes(word)) {
        exactMatches++;
      }
    });
    
    // Calculate confidence based on exact word matches
    confidence = (exactMatches / productWords.length) * 100;
    
    // Boost for key product terms that must match
    const keyTerms = ['wheat', 'meslin', 'fish', 'coffee', 'honey', 'cotton', 'coral', 'live'];
    let keyMatches = 0;
    keyTerms.forEach(term => {
      if (product.includes(term) && desc.includes(term)) {
        keyMatches++;
      }
    });
    
    if (keyMatches > 0) {
      confidence = Math.max(confidence, 80 + (keyMatches * 5));
    }
    
    // Special cases for exact product matches
    if (desc.includes('live fish') && product.includes('live fish')) confidence = 95;
    if (desc.includes('wheat') && product.includes('wheat') && desc.includes('meslin') && product.includes('meslin')) confidence = 95;
    if (desc.includes('coffee beans') && product.includes('coffee beans')) confidence = 95;
    if (desc.includes('natural honey') && product.includes('natural honey')) confidence = 95;
    if (desc.includes('cotton') && product.includes('cotton') && desc.includes('waste') && product.includes('waste')) confidence = 95;
    if (desc.includes('coral') && product.includes('coral')) confidence = 95;
    
    // Penalize for completely unrelated terms
    const unrelatedTerms = ['textile', 'machinery', 'apparatus', 'instruments'];
    let unrelatedMatches = 0;
    unrelatedTerms.forEach(term => {
      if (desc.includes(term) && !product.includes(term)) {
        unrelatedMatches++;
      }
    });
    
    if (unrelatedMatches > 0) {
      confidence = Math.max(0, confidence - (unrelatedMatches * 20));
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Select the most matching HS code based on confidence and description similarity
   * @param {Array} hsCodes - Array of HS codes
   * @param {string} productDescription - Product description
   * @returns {Object} Most matching HS code
   */
  selectMostMatchingHSCode(hsCodes, productDescription) {
    if (hsCodes.length === 0) return null;
    if (hsCodes.length === 1) return hsCodes[0];

    // Sort by priority: CBIC official data first, then exact matches, then confidence, then description length
    const sortedCodes = hsCodes.sort((a, b) => {
      // Primary sort: CBIC official data gets highest priority
      const aIsCBIC = a.source && a.source.includes('CBIC');
      const bIsCBIC = b.source && b.source.includes('CBIC');
      
      if (aIsCBIC && !bIsCBIC) return -1;
      if (!aIsCBIC && bIsCBIC) return 1;
      
      // Secondary sort: Exact matches get higher priority
      const aIsExact = a.description.toLowerCase().includes(productDescription.toLowerCase()) ||
                      productDescription.toLowerCase().includes(a.description.toLowerCase());
      const bIsExact = b.description.toLowerCase().includes(productDescription.toLowerCase()) ||
                      productDescription.toLowerCase().includes(b.description.toLowerCase());
      
      if (aIsExact && !bIsExact) return -1;
      if (!aIsExact && bIsExact) return 1;
      
      // Tertiary sort by confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Quaternary sort by description length (more specific descriptions)
      return b.description.length - a.description.length;
    });

    return sortedCodes[0];
  }

  /**
   * Remove duplicate HS codes
   * @param {Array} hsCodes - Array of HS codes
   * @returns {Array} Array of unique HS codes
   */
  removeDuplicateHSCodes(hsCodes) {
    const seen = new Set();
    return hsCodes.filter(hsCode => {
      const key = hsCode.code;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }


  /**
   * Parse HS code structure to extract Chapter/Heading/Sub-heading/Tariff item
   * Handles both standard format (0902.10.10) and CBIC format (0202, 0203, 0204)
   * @param {string} hsCode - Full HS code (e.g., "0902.10.10" or "0202, 0203, 0204")
   * @returns {Object} Parsed HS structure
   */
  parseHSStructure(hsCode) {
    if (!hsCode) {
      return {
        chapter: '',
        heading: '',
        subHeading: '',
        tariffItem: '',
        rawCode: hsCode
      };
    }

    // Handle CBIC format: "0202, 0203, 0204, 0205, 0206, 0207, 0208, 0209, 0210"
    if (hsCode.includes(',')) {
      const codes = hsCode.split(',').map(code => code.trim());
      const firstCode = codes[0];
      
      // Extract structure from first code in the list
      if (firstCode.match(/^\d{4}$/)) {
        return {
          chapter: firstCode.substring(0, 2),
          heading: firstCode.substring(0, 4),
          subHeading: firstCode + '00',  // Add 00 for sub-heading
          tariffItem: firstCode + '0000', // Add 0000 for tariff item
          rawCode: hsCode,
          allCodes: codes,
          isCBICFormat: true
        };
      }
    }

    // Handle standard format: "0902.10.10"
    if (hsCode.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
      const digits = hsCode.replace(/\./g, '');
      
      return {
        chapter: digits.substring(0, 2),           // First 2 digits (Chapter)
        heading: digits.substring(0, 4),           // First 4 digits (Heading)
        subHeading: digits.substring(0, 6),        // First 6 digits (Sub-heading)
        tariffItem: digits.substring(0, 8),        // All 8 digits (Tariff item)
        rawCode: hsCode,
        isCBICFormat: false
      };
    }

    // Handle 4-digit format: "0202"
    if (hsCode.match(/^\d{4}$/)) {
      return {
        chapter: hsCode.substring(0, 2),
        heading: hsCode.substring(0, 4),
        subHeading: hsCode + '00',
        tariffItem: hsCode + '0000',
        rawCode: hsCode,
        isCBICFormat: true
      };
    }

    // Default fallback
    return {
      chapter: '',
      heading: '',
      subHeading: '',
      tariffItem: '',
      rawCode: hsCode
    };
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
      '24': 'Tobacco and manufactured tobacco substitutes',
      '29': 'Organic chemicals',
      '30': 'Pharmaceutical products',
      '50': 'Silk',
      '51': 'Wool, fine or coarse animal hair',
      '52': 'Cotton',
      '84': 'Nuclear reactors, boilers, machinery',
      '85': 'Electrical machinery and equipment'
    };
    
    return categories[chapter] || 'Other';
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

module.exports = PureWebScrapingHSCode;
