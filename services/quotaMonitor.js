class QuotaMonitor {
  constructor() {
    this.quotaStatus = {
      gemini: { 
        available: false, 
        lastCheck: null, 
        retryAfter: null,
        quotaExceeded: true
      },
      openai: { 
        available: false, 
        lastCheck: null, 
        retryAfter: null,
        quotaExceeded: true
      },
      anthropic: { 
        available: false, 
        lastCheck: null, 
        retryAfter: null,
        quotaExceeded: false
      }
    };
    
    this.checkInterval = 30000; // Check every 30 seconds
    this.maxRetries = 5;
    this.startMonitoring();
  }

  /**
   * Start monitoring quota status
   */
  startMonitoring() {
    console.log('🔄 Starting quota monitoring...');
    setInterval(() => {
      this.checkQuotaStatus();
    }, this.checkInterval);
  }

  /**
   * Check quota status for all services
   */
  async checkQuotaStatus() {
    console.log('🔍 Checking quota status...');
    
    // Check Gemini
    await this.checkServiceQuota('gemini');
    
    // Check OpenAI
    await this.checkServiceQuota('openai');
    
    // Check Anthropic
    await this.checkServiceQuota('anthropic');
    
    this.logQuotaStatus();
  }

  /**
   * Check quota for a specific service
   */
  async checkServiceQuota(serviceName) {
    try {
      const isAvailable = await this.testServiceAvailability(serviceName);
      
      this.quotaStatus[serviceName] = {
        available: isAvailable,
        lastCheck: new Date(),
        retryAfter: isAvailable ? null : new Date(Date.now() + 3600000), // 1 hour
        quotaExceeded: !isAvailable
      };

      if (isAvailable) {
        console.log(`✅ ${serviceName.toUpperCase()} quota available!`);
      } else {
        console.log(`⚠️  ${serviceName.toUpperCase()} quota still exceeded`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${serviceName} quota: ${error.message}`);
    }
  }

  /**
   * Test service availability
   */
  async testServiceAvailability(serviceName) {
    try {
      switch (serviceName) {
        case 'gemini':
          return await this.testGemini();
        case 'openai':
          return await this.testOpenAI();
        case 'anthropic':
          return await this.testAnthropic();
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Gemini availability
   */
  async testGemini() {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent("test");
      return true;
    } catch (error) {
      if (error.message.includes('429')) {
        return false; // Quota exceeded
      }
      return false;
    }
  }

  /**
   * Test OpenAI availability
   */
  async testOpenAI() {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      
      return true;
    } catch (error) {
      if (error.message.includes('429')) {
        return false; // Quota exceeded
      }
      return false;
    }
  }

  /**
   * Test Anthropic availability
   */
  async testAnthropic() {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }]
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get quota status
   */
  getQuotaStatus() {
    return this.quotaStatus;
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName) {
    return this.quotaStatus[serviceName]?.available || false;
  }

  /**
   * Get best available service
   */
  getBestAvailableService(type) {
    switch (type) {
      case 'ocr':
        if (this.isServiceAvailable('gemini')) return 'gemini';
        return 'fallback';
      
      case 'compliance':
        if (this.isServiceAvailable('openai')) return 'openai';
        if (this.isServiceAvailable('anthropic')) return 'anthropic';
        return 'fallback';
      
      case 'hscodes':
        if (this.isServiceAvailable('anthropic')) return 'anthropic';
        if (this.isServiceAvailable('openai')) return 'openai';
        return 'fallback';
      
      default:
        return 'fallback';
    }
  }

  /**
   * Log quota status
   */
  logQuotaStatus() {
    console.log('\n📊 Quota Status:');
    console.log('================');
    
    Object.entries(this.quotaStatus).forEach(([service, status]) => {
      const statusIcon = status.available ? '✅' : '❌';
      const lastCheck = status.lastCheck ? status.lastCheck.toLocaleTimeString() : 'Never';
      console.log(`${statusIcon} ${service.toUpperCase()}: ${status.available ? 'Available' : 'Quota Exceeded'} (Last check: ${lastCheck})`);
    });
  }

  /**
   * Force quota check
   */
  async forceQuotaCheck() {
    console.log('🔄 Forcing quota check...');
    await this.checkQuotaStatus();
  }

  /**
   * Get retry recommendations
   */
  getRetryRecommendations() {
    const recommendations = [];
    
    Object.entries(this.quotaStatus).forEach(([service, status]) => {
      if (!status.available) {
        recommendations.push({
          service: service.toUpperCase(),
          action: 'Wait for quota reset or get new API key',
          estimatedWait: '1-24 hours',
          alternative: 'Use fallback processing'
        });
      }
    });
    
    return recommendations;
  }
}

module.exports = QuotaMonitor;
