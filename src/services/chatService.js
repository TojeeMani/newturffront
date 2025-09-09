import api from './api';

class AdvancedChatService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.conversationContext = new Map();
    this.analytics = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      averageResponseTime: 0
    };
  }

  async sendMessage(message, context = {}, history = []) {
    const startTime = Date.now();
    
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    const enhancedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const payload = {
      message: message.trim(),
      context: enhancedContext,
      history: Array.isArray(history) ? history.slice(-10) : [] // Keep last 10 messages
    };

    try {
      const response = await this.sendWithRetry(payload);
      const responseTime = Date.now() - startTime;
      
      // Update analytics
      this.updateAnalytics(true, responseTime);
      
      // Store conversation context
      this.storeConversationContext(context.userId, message, response.data);
      
      return response;
    } catch (error) {
      this.updateAnalytics(false, Date.now() - startTime);
      throw error;
    }
  }

  async sendWithRetry(payload, attempt = 1) {
    try {
      const response = await api.request('/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Validate enhanced response structure
      if (!response || !response.data) {
        throw new Error('Invalid response format from chat service');
      }

      // Ensure we have the required fields
      const enhancedResponse = {
        ...response,
        data: {
          reply: response.data.reply || 'Sorry, I couldn\'t process that.',
          intent: response.data.intent || 'general',
          suggestions: response.data.suggestions || [],
          actions: response.data.actions || [],
          context: response.data.context || {},
          timestamp: response.data.timestamp || new Date().toISOString()
        }
      };

      return enhancedResponse;
    } catch (error) {
      console.error(`Chat service error (attempt ${attempt}):`, error);

      // Retry logic for network errors
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        console.log(`Retrying chat request in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.sendWithRetry(payload, attempt + 1);
      }

      // Return a user-friendly error response
      return {
        success: false,
        data: {
          reply: this.getErrorMessage(error),
          intent: 'error',
          suggestions: ['Try again', 'Contact support', 'Browse turfs'],
          actions: [],
          context: {},
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async getSuggestions(context = {}) {
    try {
      const response = await api.request('/chat/suggestions', {
        method: 'GET',
        params: { context: JSON.stringify(context) }
      });

      return response.data?.suggestions || [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return ['Browse turfs', 'Check prices', 'Find nearby', 'My bookings'];
    }
  }

  async getConversationHistory(userId, limit = 50) {
    try {
      const response = await api.request('/chat/history', {
        method: 'GET',
        params: { limit }
      });

      return response.data?.history || [];
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
      return [];
    }
  }

  async clearConversationHistory(userId) {
    try {
      await api.request('/chat/history', {
        method: 'DELETE'
      });
      
      // Clear local storage as well
      this.clearHistory();
      
      return true;
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      return false;
    }
  }

  async executeAction(action, context = {}) {
    try {
      const response = await api.request('/chat/action', {
        method: 'POST',
        body: JSON.stringify({ action, context }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to execute action:', error);
      return { success: false, error: 'Action execution failed' };
    }
  }

  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      (error.response && error.response.status >= 500)
    );
  }

  getErrorMessage(error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'I\'m having trouble connecting right now. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('timeout')) {
      return 'The request is taking too long. Please try again.';
    }

    if (error.response?.status === 401) {
      return 'Please log in to continue the conversation.';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    return 'I\'m experiencing some technical difficulties. Please try again in a moment.';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  storeConversationContext(userId, message, response) {
    if (!userId) return;
    
    const context = this.conversationContext.get(userId) || {
      lastMessage: null,
      lastResponse: null,
      lastIntent: null,
      messageCount: 0,
      topics: [],
      preferences: {}
    };
    
    context.lastMessage = message;
    context.lastResponse = response.reply;
    context.lastIntent = response.intent;
    context.messageCount += 1;
    context.lastUpdated = new Date().toISOString();
    
    // Extract topics from message (simple keyword extraction)
    const topics = this.extractTopics(message);
    context.topics = [...new Set([...context.topics, ...topics])].slice(-10); // Keep last 10 topics
    
    this.conversationContext.set(userId, context);
  }

  extractTopics(message) {
    const topicKeywords = {
      'booking': ['book', 'reserve', 'schedule', 'appointment'],
      'pricing': ['price', 'cost', 'rate', 'fee', 'expensive', 'cheap'],
      'location': ['nearby', 'location', 'address', 'close', 'distance'],
      'support': ['help', 'support', 'problem', 'issue', 'complaint'],
      'account': ['profile', 'account', 'login', 'register', 'password'],
      'turf': ['turf', 'field', 'ground', 'facility', 'amenities']
    };
    
    const topics = [];
    const lowerMessage = message.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  getConversationContext(userId) {
    return this.conversationContext.get(userId) || {};
  }

  updateAnalytics(success, responseTime) {
    this.analytics.totalInteractions += 1;
    
    if (success) {
      this.analytics.successfulInteractions += 1;
    } else {
      this.analytics.failedInteractions += 1;
    }
    
    // Update average response time
    const totalTime = this.analytics.averageResponseTime * (this.analytics.totalInteractions - 1) + responseTime;
    this.analytics.averageResponseTime = totalTime / this.analytics.totalInteractions;
  }

  getAnalytics() {
    return {
      ...this.analytics,
      successRate: this.analytics.totalInteractions > 0 
        ? (this.analytics.successfulInteractions / this.analytics.totalInteractions) * 100 
        : 0
    };
  }

  // Method to clear chat history if needed
  clearHistory() {
    try {
      localStorage.removeItem('chat:messages');
      localStorage.removeItem('chat:isOpen');
      localStorage.removeItem('chat:context');
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  }

  // Method to get chat statistics
  getChatStats() {
    try {
      const messages = JSON.parse(localStorage.getItem('chat:messages') || '[]');
      return {
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
        lastMessageTime: messages.length > 0 ? messages[messages.length - 1].ts : null
      };
    } catch (error) {
      console.warn('Failed to get chat stats:', error);
      return { totalMessages: 0, userMessages: 0, assistantMessages: 0, lastMessageTime: null };
    }
  }

  // Method to save conversation context to localStorage
  saveConversationContext(userId) {
    try {
      const context = this.conversationContext.get(userId);
      if (context) {
        localStorage.setItem('chat:context', JSON.stringify(context));
      }
    } catch (error) {
      console.warn('Failed to save conversation context:', error);
    }
  }

  // Method to load conversation context from localStorage
  loadConversationContext(userId) {
    try {
      const saved = localStorage.getItem('chat:context');
      if (saved) {
        const context = JSON.parse(saved);
        this.conversationContext.set(userId, context);
        return context;
      }
    } catch (error) {
      console.warn('Failed to load conversation context:', error);
    }
    return null;
  }

  // Method to generate smart suggestions based on context
  generateSmartSuggestions(context = {}) {
    const suggestions = [];
    const userType = context.userType || 'guest';
    const lastIntent = context.lastIntent || 'general';
    
    // Base suggestions
    suggestions.push('Browse turfs', 'Check prices', 'Find nearby');
    
    // User type specific suggestions
    if (userType === 'owner') {
      suggestions.push('View my turfs', 'Check bookings', 'Analytics dashboard');
    } else if (userType === 'player') {
      suggestions.push('My bookings', 'Book a turf', 'Check availability');
    }
    
    // Intent based suggestions
    switch (lastIntent) {
      case 'booking':
        suggestions.push('Available slots', 'Book for tomorrow', 'Check my bookings');
        break;
      case 'pricing':
        suggestions.push('Compare prices', 'Budget options', 'Premium turfs');
        break;
      case 'location':
        suggestions.push('Use my location', 'Different area', 'Show on map');
        break;
    }
    
    return [...new Set(suggestions)].slice(0, 6); // Remove duplicates and limit to 6
  }
}

const chatService = new AdvancedChatService();
export default chatService;


