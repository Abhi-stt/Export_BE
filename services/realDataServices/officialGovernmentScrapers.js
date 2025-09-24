const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Official Indian Government Web Scrapers
 * Uses DGFT, CBIC, and ICEGATE for real official data
 * NO FALLBACKS - Returns error if no real data found
 */
class OfficialGovernmentScrapers {
  constructor() {
    this.rateLimit = 2000; // 2 seconds between requests
    this.lastRequest = 0;
    
    // Official Government URLs (Updated with correct endpoints)
    this.dgftUrl = 'https://www.dgft.gov.in';
    this.dgftIECUrl = 'https://www.dgft.gov.in/CP/?opt=dgfthq';
    this.cbicUrl = 'https://cbic-gst.gov.in';
    this.cbicGSTRatesUrl = 'https://cbic-gst.gov.in/gst-goods-services-rates.html';
    this.icegateUrl = 'https://old.icegate.gov.in';
    this.icegateTradeGuideUrl = 'https://old.icegate.gov.in/Webappl/Trade-Guide-on-Imports';
    this.icegateIECUrl = 'https://old.icegate.gov.in/EnqMod/searchIecCodeAction';
  }

  /**
   * Get HS codes from official government sources
   * @param {string} productDescription - Product description
   * @returns {Promise<Object>} Official HS codes or error
   */
  async getOfficialHSCodes(productDescription) {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Getting official HS codes for: ${productDescription}`);
      
      const hsCodes = [];
      
      // Try CBIC first (official HS code authority)
      try {
        const cbicCodes = await this.scrapeCBICHSCodes(productDescription);
        if (cbicCodes && cbicCodes.length > 0) {
          hsCodes.push(...cbicCodes);
        }
      } catch (error) {
        console.warn('CBIC scraping failed:', error.message);
      }

      // Try DGFT for trade-specific HS codes
      try {
        const dgftCodes = await this.scrapeDGFTHSCodes(productDescription);
        if (dgftCodes && dgftCodes.length > 0) {
          hsCodes.push(...dgftCodes);
        }
      } catch (error) {
        console.warn('DGFT scraping failed:', error.message);
      }

      // Try ICEGATE for customs HS codes
      try {
        const icegateCodes = await this.scrapeICEGATEHSCodes(productDescription);
        if (icegateCodes && icegateCodes.length > 0) {
          hsCodes.push(...icegateCodes);
        }
      } catch (error) {
        console.warn('ICEGATE scraping failed:', error.message);
      }

      if (hsCodes.length === 0) {
        throw new Error(`No official HS codes found from government sources for: ${productDescription}`);
      }

      // Remove duplicates and select best match
      const uniqueCodes = this.removeDuplicateHSCodes(hsCodes);
      const primaryHSCode = this.selectMostMatchingHSCode(uniqueCodes, productDescription);

      console.log(`✅ Found ${uniqueCodes.length} official HS codes from government sources`);
      
      return {
        success: true,
        hsCode: {
          code: primaryHSCode.code,
          description: primaryHSCode.description,
          chapter: primaryHSCode.chapter,
          category: primaryHSCode.category,
          source: 'Official Government Sources (CBIC/DGFT/ICEGATE)',
          confidence: primaryHSCode.confidence,
          allSuggestions: uniqueCodes,
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Official Government Web Scraping',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Government HS Code Error:', error.message);
      return {
        success: false,
        error: `Failed to get official HS codes: ${error.message}`,
        metadata: {
          source: 'Official Government Web Scraping',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get official exporters from government sources
   * @param {string} hsCode - HS code
   * @param {number} limit - Maximum results
   * @returns {Promise<Object>} Official exporters or error
   */
  async getOfficialExporters(hsCode, limit = 15) {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Getting official exporters for HS code: ${hsCode}`);
      
      const exporters = [];
      
      // Try DGFT (main exporter authority)
      try {
        const dgftExporters = await this.scrapeDGFTExporters(hsCode);
        if (dgftExporters && dgftExporters.length > 0) {
          exporters.push(...dgftExporters);
        }
      } catch (error) {
        console.warn('DGFT exporters scraping failed:', error.message);
      }

      // Try ICEGATE for customs exporter data
      try {
        const icegateExporters = await this.scrapeICEGATEExporters(hsCode);
        if (icegateExporters && icegateExporters.length > 0) {
          exporters.push(...icegateExporters);
        }
      } catch (error) {
        console.warn('ICEGATE exporters scraping failed:', error.message);
      }

      if (exporters.length === 0) {
        throw new Error(`No official exporters found from government sources for HS code: ${hsCode}`);
      }

      // Remove duplicates and limit results
      const uniqueExporters = this.removeDuplicateCompanies(exporters).slice(0, limit);
      const enrichedExporters = this.enrichOfficialExporterData(uniqueExporters, hsCode);

      console.log(`✅ Found ${enrichedExporters.length} official exporters from government sources`);
      
      return {
        success: true,
        exporters: {
          total: enrichedExporters.length,
          companies: enrichedExporters,
          hsCode: hsCode,
          source: 'Official Government Sources (DGFT/ICEGATE)',
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Official Government Web Scraping',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Government Exporters Error:', error.message);
      return {
        success: false,
        error: `Failed to get official exporters: ${error.message}`,
        metadata: {
          source: 'Official Government Web Scraping',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get official importers from government sources
   * @param {string} hsCode - HS code
   * @param {number} limit - Maximum results
   * @returns {Promise<Object>} Official importers or error
   */
  async getOfficialImporters(hsCode, limit = 15) {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Getting official importers for HS code: ${hsCode}`);
      
      const importers = [];
      
      // Try DGFT for importer data
      try {
        const dgftImporters = await this.scrapeDGFTImporters(hsCode);
        if (dgftImporters && dgftImporters.length > 0) {
          importers.push(...dgftImporters);
        }
      } catch (error) {
        console.warn('DGFT importers scraping failed:', error.message);
      }

      // Try ICEGATE for customs importer data
      try {
        const icegateImporters = await this.scrapeICEGATEImporters(hsCode);
        if (icegateImporters && icegateImporters.length > 0) {
          importers.push(...icegateImporters);
        }
      } catch (error) {
        console.warn('ICEGATE importers scraping failed:', error.message);
      }

      if (importers.length === 0) {
        throw new Error(`No official importers found from government sources for HS code: ${hsCode}`);
      }

      // Remove duplicates and limit results
      const uniqueImporters = this.removeDuplicateCompanies(importers).slice(0, limit);
      const enrichedImporters = this.enrichOfficialImporterData(uniqueImporters, hsCode);

      console.log(`✅ Found ${enrichedImporters.length} official importers from government sources`);
      
      return {
        success: true,
        importers: {
          total: enrichedImporters.length,
          companies: enrichedImporters,
          hsCode: hsCode,
          source: 'Official Government Sources (DGFT/ICEGATE)',
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Official Government Web Scraping',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Government Importers Error:', error.message);
      return {
        success: false,
        error: `Failed to get official importers: ${error.message}`,
        metadata: {
          source: 'Official Government Web Scraping',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get official blacklist data from government sources
   * @returns {Promise<Object>} Official blacklist data or error
   */
  async getOfficialBlacklist() {
    try {
      await this.enforceRateLimit();
      
      console.log(`🔍 Getting official blacklist data from government sources`);
      
      const blacklistData = [];
      
      // Try DGFT denied entities list
      try {
        const dgftBlacklist = await this.scrapeDGFTBlacklist();
        if (dgftBlacklist && dgftBlacklist.length > 0) {
          blacklistData.push(...dgftBlacklist);
        }
      } catch (error) {
        console.warn('DGFT blacklist scraping failed:', error.message);
      }

      // Try CBIC prohibited entities
      try {
        const cbicBlacklist = await this.scrapeCBICBlacklist();
        if (cbicBlacklist && cbicBlacklist.length > 0) {
          blacklistData.push(...cbicBlacklist);
        }
      } catch (error) {
        console.warn('CBIC blacklist scraping failed:', error.message);
      }

      // Try ICEGATE restricted entities
      try {
        const icegateBlacklist = await this.scrapeICEGATEBlacklist();
        if (icegateBlacklist && icegateBlacklist.length > 0) {
          blacklistData.push(...icegateBlacklist);
        }
      } catch (error) {
        console.warn('ICEGATE blacklist scraping failed:', error.message);
      }

      if (blacklistData.length === 0) {
        throw new Error('No official blacklist data found from government sources');
      }

      // Remove duplicates
      const uniqueBlacklist = this.removeDuplicateBlacklist(blacklistData);

      console.log(`✅ Found ${uniqueBlacklist.length} official blacklist entries from government sources`);
      
      return {
        success: true,
        blacklist: {
          total: uniqueBlacklist.length,
          entries: uniqueBlacklist,
          source: 'Official Government Sources (DGFT/CBIC/ICEGATE)',
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          source: 'Official Government Web Scraping',
          realData: true,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Official Government Blacklist Error:', error.message);
      return {
        success: false,
        error: `Failed to get official blacklist: ${error.message}`,
        metadata: {
          source: 'Official Government Web Scraping',
          realData: false,
          noFallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Scrape CBIC for official HS codes
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes
   */
  async scrapeCBICHSCodes(productDescription) {
    try {
      console.log(`🔍 Scraping CBIC GST portal for HS codes: ${productDescription}`);
      
      // Use the correct CBIC GST portal endpoint
      const response = await axios.get(this.cbicGSTRatesUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseCBICHSCodes($, productDescription);
      
      console.log(`✅ CBIC GST portal scraping found ${hsCodes.length} HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('CBIC GST portal HS code scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape DGFT for HS codes
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes
   */
  async scrapeDGFTHSCodes(productDescription) {
    try {
      console.log(`🔍 Scraping DGFT for HS codes: ${productDescription}`);
      
      const response = await axios.get(`${this.dgftUrl}/scripts/db2.dll`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseDGFTHSCodes($, productDescription);
      
      console.log(`✅ DGFT scraping found ${hsCodes.length} HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('DGFT HS code scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape ICEGATE for HS codes
   * @param {string} productDescription - Product description
   * @returns {Promise<Array>} Array of HS codes
   */
  async scrapeICEGATEHSCodes(productDescription) {
    try {
      console.log(`🔍 Scraping ICEGATE for HS codes: ${productDescription}`);
      
      // Use the correct ICEGATE Trade Guide endpoint
      const response = await axios.get(this.icegateTradeGuideUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hsCodes = this.parseICEGATEHSCodes($, productDescription);
      
      console.log(`✅ ICEGATE scraping found ${hsCodes.length} HS codes`);
      return hsCodes;

    } catch (error) {
      console.warn('ICEGATE HS code scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape DGFT for exporters
   * @param {string} hsCode - HS code
   * @returns {Promise<Array>} Array of exporters
   */
  async scrapeDGFTExporters(hsCode) {
    try {
      console.log(`🔍 Scraping DGFT for exporters: ${hsCode}`);
      
      // Use the correct DGFT IEC search endpoint
      const response = await axios.get(this.dgftIECUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exporters = this.parseDGFTExporters($, hsCode);
      
      console.log(`✅ DGFT exporters scraping found ${exporters.length} exporters`);
      return exporters;

    } catch (error) {
      console.warn('DGFT exporters scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape ICEGATE for exporters
   * @param {string} hsCode - HS code
   * @returns {Promise<Array>} Array of exporters
   */
  async scrapeICEGATEExporters(hsCode) {
    try {
      console.log(`🔍 Scraping ICEGATE for exporters: ${hsCode}`);
      
      // Use the correct ICEGATE IEC search endpoint
      const response = await axios.get(this.icegateIECUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exporters = this.parseICEGATEExporters($, hsCode);
      
      console.log(`✅ ICEGATE exporters scraping found ${exporters.length} exporters`);
      return exporters;

    } catch (error) {
      console.warn('ICEGATE exporters scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape DGFT for importers
   * @param {string} hsCode - HS code
   * @returns {Promise<Array>} Array of importers
   */
  async scrapeDGFTImporters(hsCode) {
    try {
      console.log(`🔍 Scraping DGFT for importers: ${hsCode}`);
      
      const response = await axios.get(`${this.dgftUrl}/scripts/db2.dll`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const importers = this.parseDGFTImporters($, hsCode);
      
      console.log(`✅ DGFT importers scraping found ${importers.length} importers`);
      return importers;

    } catch (error) {
      console.warn('DGFT importers scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape ICEGATE for importers
   * @param {string} hsCode - HS code
   * @returns {Promise<Array>} Array of importers
   */
  async scrapeICEGATEImporters(hsCode) {
    try {
      console.log(`🔍 Scraping ICEGATE for importers: ${hsCode}`);
      
      const response = await axios.get(`${this.icegateUrl}/ICEGATE?page=oekha&requestType=TRADELINES&actionName=showTradelines&submit=Submit`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const importers = this.parseICEGATEImporters($, hsCode);
      
      console.log(`✅ ICEGATE importers scraping found ${importers.length} importers`);
      return importers;

    } catch (error) {
      console.warn('ICEGATE importers scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape DGFT for blacklist
   * @returns {Promise<Array>} Array of blacklist entries
   */
  async scrapeDGFTBlacklist() {
    try {
      console.log(`🔍 Scraping DGFT for blacklist`);
      
      const response = await axios.get(`${this.dgftUrl}/scripts/db2.dll`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const blacklist = this.parseDGFTBlacklist($);
      
      console.log(`✅ DGFT blacklist scraping found ${blacklist.length} entries`);
      return blacklist;

    } catch (error) {
      console.warn('DGFT blacklist scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape CBIC for blacklist
   * @returns {Promise<Array>} Array of blacklist entries
   */
  async scrapeCBICBlacklist() {
    try {
      console.log(`🔍 Scraping CBIC for blacklist`);
      
      const response = await axios.get(`${this.cbicUrl}/htdocs-cbec/deptt_offcr/ao-chapterwise.html`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const blacklist = this.parseCBICBlacklist($);
      
      console.log(`✅ CBIC blacklist scraping found ${blacklist.length} entries`);
      return blacklist;

    } catch (error) {
      console.warn('CBIC blacklist scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Scrape ICEGATE for blacklist
   * @returns {Promise<Array>} Array of blacklist entries
   */
  async scrapeICEGATEBlacklist() {
    try {
      console.log(`🔍 Scraping ICEGATE for blacklist`);
      
      const response = await axios.get(`${this.icegateUrl}/ICEGATE?page=oekha&requestType=TRADELINES&actionName=showTradelines&submit=Submit`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const blacklist = this.parseICEGATEBlacklist($);
      
      console.log(`✅ ICEGATE blacklist scraping found ${blacklist.length} entries`);
      return blacklist;

    } catch (error) {
      console.warn('ICEGATE blacklist scraping failed:', error.message);
      return [];
    }
  }

  // Parse methods for different government sources
  parseCBICHSCodes($, productDescription) {
    const hsCodes = [];
    
    // Parse CBIC GST rates table
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        // CBIC GST table structure: Schedule | S.No | Chapter/Heading/Sub-heading/Tariff item | Description | CGST | SGST | IGST | Cess
        const tariffItem = $(cells[2]).text().trim();
        const description = $(cells[3]).text().trim();
        const cgstRate = $(cells[4]).text().trim();
        const sgstRate = $(cells[5]).text().trim();
        const igstRate = $(cells[6]).text().trim();
        
        // Extract HS codes from tariff item column
        if (tariffItem && description) {
          // Look for HS codes in format like "0202, 0203, 0204" or "0303, 0304, 0305"
          const hsCodeMatches = tariffItem.match(/\b(\d{4})\b/g);
          
          if (hsCodeMatches && hsCodeMatches.length > 0) {
            hsCodeMatches.forEach(hsCode => {
              const confidence = this.calculateMatchingConfidence(description, productDescription);
              
              hsCodes.push({
                code: hsCode + '.00.00', // Format as full HS code
                description: description,
                chapter: hsCode.substring(0, 2),
                category: this.getCategoryFromChapter(hsCode.substring(0, 2)),
                confidence: confidence,
                source: 'CBIC GST Portal Official',
                gstRates: {
                  cgst: cgstRate,
                  sgst: sgstRate,
                  igst: igstRate
                }
              });
            });
          }
        }
      }
    });

    // Also look for HS codes in the description column
    $('table tr td:nth-child(4)').each((index, element) => {
      const description = $(element).text().trim();
      const codeMatch = description.match(/(\d{4}\.\d{2}\.\d{2})/);
      
      if (codeMatch && description.length > 10) { // Ensure it's a real description, not just a code
        const confidence = this.calculateMatchingConfidence(description, productDescription);
        
        hsCodes.push({
          code: codeMatch[1],
          description: description,
          chapter: codeMatch[1].substring(0, 2),
          category: this.getCategoryFromChapter(codeMatch[1].substring(0, 2)),
          confidence: confidence,
          source: 'CBIC GST Portal Official'
        });
      }
    });

    return hsCodes;
  }

  parseDGFTHSCodes($, productDescription) {
    const hsCodes = [];
    
    // Parse DGFT HS code tables
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const code = $(cells[0]).text().trim();
        const description = $(cells[1]).text().trim();
        
        if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/) && description) {
          const confidence = this.calculateMatchingConfidence(description, productDescription);
          
          hsCodes.push({
            code: code,
            description: description,
            chapter: code.substring(0, 2),
            category: this.getCategoryFromChapter(code.substring(0, 2)),
            confidence: confidence,
            source: 'DGFT Official'
          });
        }
      }
    });

    return hsCodes;
  }

  parseICEGATEHSCodes($, productDescription) {
    const hsCodes = [];
    
    // Parse ICEGATE Trade Guide results
    $('.result-item, .hs-code-item, table tr').each((index, row) => {
      const $row = $(row);
      const codeElement = $row.find('.code, .hs-code, td:first-child');
      const descElement = $row.find('.description, .desc, td:nth-child(2)');
      
      const code = codeElement.text().trim();
      const description = descElement.text().trim();
      
      if (code && code.match(/^\d{4}\.\d{2}\.\d{2}$/) && description) {
        const confidence = this.calculateMatchingConfidence(description, productDescription);
        
        hsCodes.push({
          code: code,
          description: description,
          chapter: code.substring(0, 2),
          category: this.getCategoryFromChapter(code.substring(0, 2)),
          confidence: confidence,
          source: 'ICEGATE Official'
        });
      }
    });

    return hsCodes;
  }

  parseDGFTExporters($, hsCode) {
    const exporters = [];
    
    // Parse DGFT IEC database results
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        const companyName = $(cells[0]).text().trim();
        const iecCode = $(cells[1]).text().trim();
        const city = $(cells[2]).text().trim();
        
        if (companyName && companyName.length > 3 && !this.isFormElement(companyName)) {
          exporters.push({
            companyName: companyName,
            iecCode: iecCode,
            city: city,
            state: this.getStateFromCity(city),
            hsCode: hsCode,
            source: 'DGFT Official'
          });
        }
      }
    });

    return exporters;
  }

  parseICEGATEExporters($, hsCode) {
    const exporters = [];
    
    // Parse ICEGATE IEC search results
    $('.iec-result, .company-result, table tr').each((index, row) => {
      const $row = $(row);
      const companyElement = $row.find('.company-name, .firm-name, td:first-child');
      const iecElement = $row.find('.iec-code, .code, td:nth-child(2)');
      const locationElement = $row.find('.location, .city, td:nth-child(3)');
      
      const companyName = companyElement.text().trim();
      const iecCode = iecElement.text().trim();
      const location = locationElement.text().trim();
      
      if (companyName && companyName.length > 3 && !this.isFormElement(companyName)) {
        exporters.push({
          companyName: companyName,
          iecCode: iecCode,
          city: location.split(',')[0]?.trim() || '',
          state: location.split(',')[1]?.trim() || '',
          hsCode: hsCode,
          source: 'ICEGATE Official'
        });
      }
    });

    return exporters;
  }

  parseDGFTImporters($, hsCode) {
    const importers = [];
    
    // Parse DGFT importer data (similar to exporters)
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        const companyName = $(cells[0]).text().trim();
        const businessReg = $(cells[1]).text().trim();
        const city = $(cells[2]).text().trim();
        
        if (companyName && companyName.length > 3 && !this.isFormElement(companyName)) {
          importers.push({
            companyName: companyName,
            businessRegistrationNumber: businessReg,
            city: city,
            state: this.getStateFromCity(city),
            hsCode: hsCode,
            source: 'DGFT Official'
          });
        }
      }
    });

    return importers;
  }

  parseICEGATEImporters($, hsCode) {
    const importers = [];
    
    // Parse ICEGATE importer data
    $('.importer-result, .company-result, table tr').each((index, row) => {
      const $row = $(row);
      const companyElement = $row.find('.company-name, .firm-name, td:first-child');
      const regElement = $row.find('.registration, .business-reg, td:nth-child(2)');
      const locationElement = $row.find('.location, .city, td:nth-child(3)');
      
      const companyName = companyElement.text().trim();
      const businessReg = regElement.text().trim();
      const location = locationElement.text().trim();
      
      if (companyName && companyName.length > 3 && !this.isFormElement(companyName)) {
        importers.push({
          companyName: companyName,
          businessRegistrationNumber: businessReg,
          city: location.split(',')[0]?.trim() || '',
          state: location.split(',')[1]?.trim() || '',
          hsCode: hsCode,
          source: 'ICEGATE Official'
        });
      }
    });

    return importers;
  }

  parseDGFTBlacklist($) {
    const blacklist = [];
    
    // Parse DGFT denied entities list
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const entityName = $(cells[0]).text().trim();
        const reason = $(cells[1]).text().trim();
        
        if (entityName && entityName.length > 3 && !this.isFormElement(entityName)) {
          blacklist.push({
            name: entityName,
            reason: reason,
            source: 'DGFT Official',
            status: 'Denied'
          });
        }
      }
    });

    return blacklist;
  }

  parseCBICBlacklist($) {
    const blacklist = [];
    
    // Parse CBIC prohibited entities
    $('.blacklist-item, .prohibited-item, table tr').each((index, row) => {
      const $row = $(row);
      const entityElement = $row.find('.entity-name, .company-name, td:first-child');
      const reasonElement = $row.find('.reason, .violation, td:nth-child(2)');
      
      const entityName = entityElement.text().trim();
      const reason = reasonElement.text().trim();
      
      if (entityName && entityName.length > 3 && !this.isFormElement(entityName)) {
        blacklist.push({
          name: entityName,
          reason: reason,
          source: 'CBIC Official',
          status: 'Prohibited'
        });
      }
    });

    return blacklist;
  }

  parseICEGATEBlacklist($) {
    const blacklist = [];
    
    // Parse ICEGATE restricted entities
    $('.restricted-item, .blacklist-item, table tr').each((index, row) => {
      const $row = $(row);
      const entityElement = $row.find('.entity-name, .company-name, td:first-child');
      const reasonElement = $row.find('.reason, .violation, td:nth-child(2)');
      
      const entityName = entityElement.text().trim();
      const reason = reasonElement.text().trim();
      
      if (entityName && entityName.length > 3 && !this.isFormElement(entityName)) {
        blacklist.push({
          name: entityName,
          reason: reason,
          source: 'ICEGATE Official',
          status: 'Restricted'
        });
      }
    });

    return blacklist;
  }

  // Utility methods
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

  removeDuplicateCompanies(companies) {
    const seen = new Set();
    return companies.filter(company => {
      const key = company.name ? company.name.toLowerCase() : '';
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  removeDuplicateBlacklist(blacklist) {
    const seen = new Set();
    return blacklist.filter(entry => {
      const key = entry.name ? entry.name.toLowerCase() : '';
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  selectMostMatchingHSCode(hsCodes, productDescription) {
    if (hsCodes.length === 0) return null;
    if (hsCodes.length === 1) return hsCodes[0];

    const sortedCodes = hsCodes.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return b.description.length - a.description.length;
    });

    return sortedCodes[0];
  }

  enrichOfficialExporterData(exporters, hsCode) {
    return exporters.map((exporter, index) => ({
      ...exporter,
      hsCode: hsCode,
      businessType: 'Exporter',
      dataSource: 'Official Government (DGFT/ICEGATE)',
      dataType: 'official',
      lastUpdated: new Date().toISOString()
    }));
  }

  enrichOfficialImporterData(importers, hsCode) {
    return importers.map((importer, index) => ({
      ...importer,
      hsCode: hsCode,
      businessType: 'Importer',
      dataSource: 'Official Government (DGFT/ICEGATE)',
      dataType: 'official',
      lastUpdated: new Date().toISOString()
    }));
  }

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
   * Calculate matching confidence based on description similarity
   * @param {string} description - HS code description
   * @param {string} productDescription - Product description
   * @returns {number} Confidence score (0-100)
   */
  calculateMatchingConfidence(description, productDescription) {
    const desc = description.toLowerCase();
    const product = productDescription.toLowerCase();
    
    let confidence = 50; // Base confidence
    
    // Exact word matches
    const productWords = product.split(/\s+/);
    const descWords = desc.split(/\s+/);
    
    let exactMatches = 0;
    productWords.forEach(word => {
      if (word.length > 2 && descWords.includes(word)) {
        exactMatches++;
      }
    });
    
    confidence += (exactMatches / productWords.length) * 30;
    
    // Partial matches
    let partialMatches = 0;
    productWords.forEach(word => {
      if (word.length > 3) {
        descWords.forEach(descWord => {
          if (descWord.includes(word) || word.includes(descWord)) {
            partialMatches++;
          }
        });
      }
    });
    
    confidence += (partialMatches / productWords.length) * 20;
    
    // Special cases for common products - prioritize direct matches
    if (desc.includes('turmeric') && product.includes('turmeric')) confidence = 98;
    if (desc.includes('pepper') && product.includes('pepper')) confidence = 98;
    if (desc.includes('cardamom') && product.includes('cardamom')) confidence = 98;
    if (desc.includes('spice') && product.includes('spice')) confidence += 10;
    if (desc.includes('organic') && product.includes('organic')) confidence += 5;
    if (desc.includes('powder') && product.includes('powder')) confidence += 5;
    
    // Milk-specific prioritization
    if (product.includes('milk')) {
      if (desc.includes('milk') && desc.includes('cream') && !desc.includes('whey')) confidence = 98; // Direct milk
      if (desc.includes('milk') && desc.includes('ultra') && desc.includes('temperature')) confidence = 97; // UHT milk
      if (desc.includes('milk') && desc.includes('concentrated')) confidence = 96; // Concentrated milk
      if (desc.includes('milk') && desc.includes('yoghurt')) confidence = 95; // Yogurt
      if (desc.includes('whey') && desc.includes('milk')) confidence = 85; // Whey (lower priority)
      if (desc.includes('milk') && desc.includes('soya')) confidence = 80; // Soya milk
      if (desc.includes('milk') && desc.includes('butter')) confidence = 75; // Butter
      if (desc.includes('milk') && desc.includes('machinery')) confidence = 60; // Machinery
    }
    
    // Fresh product prioritization
    if (product.includes('fresh')) {
      if (desc.includes('fresh')) confidence += 10;
      if (desc.includes('other than fresh')) confidence -= 15; // Lower priority for processed
    }
    
    // Product type prioritization
    if (product.includes('dairy')) {
      if (desc.includes('dairy')) confidence += 10;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
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
   * Check if text is a form element
   * @param {string} text - Text to check
   * @returns {boolean} True if form element
   */
  isFormElement(text) {
    const formElements = [
      'email', 'message', 'captcha', 'username', 'password', 'login', 'submit',
      'search', 'query', 'input', 'button', 'form', 'field', 'label'
    ];
    return formElements.some(element =>
      text.toLowerCase().includes(element) ||
      text.toLowerCase().startsWith(element)
    );
  }

  /**
   * Get state from city name
   * @param {string} city - City name
   * @returns {string} State name
   */
  getStateFromCity(city) {
    const cityStateMap = {
      'mumbai': 'Maharashtra',
      'delhi': 'Delhi',
      'bangalore': 'Karnataka',
      'chennai': 'Tamil Nadu',
      'hyderabad': 'Telangana',
      'ahmedabad': 'Gujarat',
      'kolkata': 'West Bengal',
      'pune': 'Maharashtra',
      'jaipur': 'Rajasthan',
      'kochi': 'Kerala',
      'indore': 'Madhya Pradesh',
      'gurgaon': 'Haryana',
      'noida': 'Uttar Pradesh'
    };
    
    return cityStateMap[city.toLowerCase()] || 'Unknown';
  }
}

module.exports = OfficialGovernmentScrapers;
