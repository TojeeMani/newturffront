import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  TrashIcon,
  ArrowPathIcon,
  SparklesIcon,
  LightBulbIcon,
  MapPinIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat:isOpen') || 'false'); } catch { return false; }
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('chat:messages') || '[]');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return [{ id: 'welcome', role: 'assistant', content: "Hi! I'm your TurfEase assistant. I can help with bookings, prices, availability, owner registration and more.", ts: Date.now() }];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [actions, setActions] = useState([]);
  const [conversationContext, setConversationContext] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [lastIntent, setLastIntent] = useState('general');
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const baseSuggestions = useMemo(() => [
    'Show nearby turfs',
    'How to book a turf?',
    'Owner registration steps',
    'What are the prices?',
    'Contact support',
    'Dashboard help'
  ], []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && isOpen) {
      const scrollToBottom = () => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      };
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, loading]);

  // Save messages to localStorage
  useEffect(() => {
    try { 
      localStorage.setItem('chat:messages', JSON.stringify(messages)); 
    } catch (error) {
      console.warn('Failed to save chat messages:', error);
    }
  }, [messages]);

  // Save chat open state
  useEffect(() => {
    try { 
      localStorage.setItem('chat:isOpen', JSON.stringify(isOpen)); 
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: trimmed, 
      ts: Date.now(), 
      meta: { name: user ? `${user.firstName}` : 'Guest' } 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setIsTyping(true);

    try {
      const context = { 
        page: 'home', 
        userType: user?.userType,
        userName: user?.firstName || 'Guest',
        userId: user?.id,
        location: userLocation
      };
      
      const res = await chatService.sendMessage(trimmed, context, messages.slice(-10));
      const responseData = res?.data || res;
      
      const assistantMsg = { 
        id: `${Date.now()}-a`, 
        role: 'assistant', 
        content: responseData.reply || 'Sorry, I could not process that.',
        ts: Date.now(),
        intent: responseData.intent || 'general',
        suggestions: responseData.suggestions || [],
        actions: responseData.actions || []
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setDynamicSuggestions(responseData.suggestions || []);
      setActions(responseData.actions || []);
      setConversationContext(responseData.context || {});
      setLastIntent(responseData.intent || 'general');
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
      setMessages(prev => [...prev, { 
        id: `${Date.now()}-e`, 
        role: 'assistant', 
        content: 'I\'m having trouble responding right now. Please try again.', 
        ts: Date.now(),
        isError: true
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [input, loading, user, messages, userLocation]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{ 
      id: 'welcome', 
      role: 'assistant', 
      content: "Hi! I'm your TurfEase assistant. I can help with bookings, prices, availability, owner registration and more.", 
      ts: Date.now() 
    }]);
    setError(null);
    chatService.clearHistory();
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [messages]);

  // Request location permission
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setIsLocationEnabled(true);
      
      // Add location to context
      setConversationContext(prev => ({
        ...prev,
        location: { lat: latitude, lng: longitude }
      }));
    } catch (err) {
      console.error('Location error:', err);
      setError('Unable to get your location. You can still use the chat without location services.');
    }
  }, []);

  // Handle action clicks
  const handleActionClick = useCallback(async (action) => {
    try {
      const result = await chatService.executeAction(action, {
        userType: user?.userType,
        userId: user?.id,
        location: userLocation
      });
      
      if (result.success) {
        console.log('Action executed:', result);
      } else {
        setError(result.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
      setError('Failed to execute action');
    }
  }, [user, userLocation]);

  // Get analytics
  const getAnalytics = useCallback(() => {
    const stats = chatService.getChatStats();
    const analytics = chatService.getAnalytics();
    return { ...stats, ...analytics };
  }, []);

  // Generate smart suggestions based on context
  const generateSmartSuggestions = useCallback(() => {
    const suggestions = chatService.generateSmartSuggestions({
      userType: user?.userType,
      lastIntent: lastIntent
    });
    return suggestions;
  }, [user?.userType, lastIntent]);

  // Current suggestions to display
  const currentSuggestions = useMemo(() => {
    if (dynamicSuggestions.length > 0) {
      return dynamicSuggestions;
    }
    return generateSmartSuggestions();
  }, [dynamicSuggestions, generateSmartSuggestions]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="w-80 md:w-96 h-[32rem] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden mb-3 animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between">
            <div className="font-semibold flex items-center space-x-2">
              <div className="inline-flex w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">TurfEase AI Assistant</div>
                <div className="text-xs text-white/80 flex items-center space-x-2">
                  <span>{loading ? 'Typing...' : 'Online'}</span>
                  {isLocationEnabled && <MapPinIcon className="w-3 h-3" />}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                title="Analytics"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={clearChat}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                title="Clear chat"
                aria-label="Clear chat history"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                aria-label="Close chat"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Analytics Panel */}
          {showAnalytics && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Chat Analytics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(getAnalytics()).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button 
                  onClick={retryLastMessage}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  title="Retry last message"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {messages.map(m => {
              const isUser = m.role === 'user';
              const isError = m.isError;
              
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                  <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
                    <div className={`text-[10px] mb-1 ${isUser ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                      {isUser ? (user?.firstName || 'You') : 'Assistant'} · {new Date(m.ts || Date.now()).toLocaleTimeString()}
                      {m.intent && !isUser && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded">
                          {m.intent}
                        </span>
                      )}
                    </div>
                    <div className={`
                      ${isUser 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-l-lg rounded-tr-lg' 
                        : isError 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-r-lg rounded-tl-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-r-lg rounded-tl-lg'
                      } 
                      px-3 py-2 whitespace-pre-wrap shadow-sm
                    `}>
                      {m.content}
                    </div>
                    
                    {/* Render actions for assistant messages */}
                    {!isUser && m.actions && m.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleActionClick(action.action)}
                            className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            {action.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(loading || isTyping) && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-tl-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Smart Suggestions */}
          {!loading && currentSuggestions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-500 mb-2 flex items-center space-x-1">
                <LightBulbIcon className="w-3 h-3" />
                <span>Smart suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.slice(0, 4).map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleSuggestionClick(s)} 
                    className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all border border-blue-200 dark:border-blue-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Services */}
          {!isLocationEnabled && (
            <div className="px-4 pb-2">
              <button
                onClick={requestLocation}
                className="w-full text-xs px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800 flex items-center justify-center space-x-2"
              >
                <MapPinIcon className="w-3 h-3" />
                <span>Enable location for better recommendations</span>
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                maxLength={500}
                className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all max-h-20"
                style={{ minHeight: '40px' }}
                disabled={loading}
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !input.trim()} 
                className={`
                  p-2 rounded-lg text-sm transition-all flex items-center justify-center
                  ${loading || !input.trim() 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg'
                  } 
                  text-white min-w-[40px] h-[40px]
                `}
                aria-label="Send message"
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {input.length}/500
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Toggle Button */}
      <button 
        onClick={() => setIsOpen(v => !v)} 
        className="group relative rounded-full w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/30"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <div className="relative">
          {isOpen ? (
            <XMarkIcon className="w-8 h-8 text-white transition-transform group-hover:rotate-90" />
          ) : (
            <SparklesIcon className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
          )}
        </div>
        {!isOpen && messages.filter(m => m.role === 'assistant' && !m.read).length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        )}
        {isLocationEnabled && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-2 h-2 text-white" />
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;


