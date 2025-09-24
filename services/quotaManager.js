/**
 * Quota Manager Service
 * 
 * This service manages API quotas and provides intelligent fallback strategies
 * to ensure the AI processing pipeline continues working even when quotas are exceeded.
 */

class QuotaManager {
  constructor() {
    this.quotaStatus = {
      gemini: { available: true, resetTime: null, retryAfter: null },
      openai: { available: true, resetTime: null, retryAfter: null },
      anthropic: { available: true, resetTime: null, retryAfter: null }
    };
    
    this.fallbackStrategies = {
      gemini: 'enhanced-fallback-ocr',
      openai: 'anthropic-fallback',
      anthropic: 'openai-fallback'
    };
  }

  /**
   * Check if a service is available (not quota limited)
   * @param {string} service - Service name (gemini, openai, anthropic)
   * @returns {boolean} - True if service is available
   */
  isServiceAvailable(service) {
    return this.quotaStatus[service]?.available || false;
  }

  /**
   * Handle quota exceeded error
   * @param {string} service - Service name
   * @param {Error} error - The quota error
   */
  handleQuotaExceeded(service, error) {
    console.warn(`⚠️  Quota exceeded for ${service}:`, error.message);
    
    this.quotaStatus[service].available = false;
    
    // Extract retry information from error
    if (error.message.includes('retryDelay')) {
      const retryMatch = error.message.match(/retryDelay":"(\d+)s/);
      if (retryMatch) {
        this.quotaStatus[service].retryAfter = Date.now() + (parseInt(retryMatch[1]) * 1000);
      }
    }
    
    // Set reset time (typically 24 hours for daily quotas)
    this.quotaStatus[service].resetTime = Date.now() + (24 * 60 * 60 * 1000);
    
    console.log(`🔄 ${service} will retry after: ${new Date(this.quotaStatus[service].retryAfter || this.quotaStatus[service].resetTime).toLocaleString()}`);
  }

  /**
   * Get the best available service for a given task
   * @param {string} task - Task type (ocr, compliance)
   * @returns {string} - Best available service
   */
  getBestAvailableService(task) {
    if (task === 'ocr') {
      if (this.isServiceAvailable('gemini')) {
        return 'gemini';
      }
      return 'enhanced-fallback-ocr';
    }
    
    if (task === 'compliance') {
      if (this.isServiceAvailable('openai')) {
        return 'openai';
      }
      if (this.isServiceAvailable('anthropic')) {
        return 'anthropic';
      }
      return 'fallback-compliance';
    }
    
    return 'fallback';
  }

  /**
   * Check if we should retry a service
   * @param {string} service - Service name
   * @returns {boolean} - True if we should retry
   */
  shouldRetryService(service) {
    const status = this.quotaStatus[service];
    if (!status) return false;
    
    if (status.retryAfter && Date.now() < status.retryAfter) {
      return false;
    }
    
    if (status.resetTime && Date.now() < status.resetTime) {
      return false;
    }
    
    return true;
  }

  /**
   * Reset service availability (call when quota resets)
   * @param {string} service - Service name
   */
  resetServiceQuota(service) {
    this.quotaStatus[service].available = true;
    this.quotaStatus[service].resetTime = null;
    this.quotaStatus[service].retryAfter = null;
    console.log(`✅ ${service} quota reset - service available again`);
  }

  /**
   * Get quota status for all services
   * @returns {Object} - Quota status
   */
  getQuotaStatus() {
    return {
      gemini: {
        available: this.isServiceAvailable('gemini'),
        resetTime: this.quotaStatus.gemini.resetTime,
        retryAfter: this.quotaStatus.gemini.retryAfter
      },
      openai: {
        available: this.isServiceAvailable('openai'),
        resetTime: this.quotaStatus.openai.resetTime,
        retryAfter: this.quotaStatus.openai.retryAfter
      },
      anthropic: {
        available: this.isServiceAvailable('anthropic'),
        resetTime: this.quotaStatus.anthropic.resetTime,
        retryAfter: this.quotaStatus.anthropic.retryAfter
      }
    };
  }
}

module.exports = QuotaManager;
