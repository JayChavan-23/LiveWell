import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import FloatingNavbar from '../../components/FloatingNavbar';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const ChatBot = () => {
  const [activeTab, setActiveTab] = useState('Chat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showSummariseModal, setShowSummariseModal] = useState(false);
  const [summariseCategory, setSummariseCategory] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState('');
  const [pendingGoal, setPendingGoal] = useState(null);
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const previousUserRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Track if we're in the middle of a conversation (not loading initial chat)
  const [isInConversation, setIsInConversation] = useState(false);

  // Only scroll to bottom when new messages are added during conversation, not on initial load
  useEffect(() => {
    // Only scroll if we're actively in a conversation and not loading
    if (isInConversation && chatHistory.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [chatHistory.length, isLoading, isInConversation]);

  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Clear chat state when user changes (logout/login)
  useEffect(() => {
    const currentUserId = user?.uid;
    const previousUserId = previousUserRef.current;
    
    // If user changed (different user logged in), clear all state first
    if (currentUserId && previousUserId && currentUserId !== previousUserId) {
      console.log('ChatBot: User changed, clearing state for new user:', currentUserId);
      setChatHistory([]);
      setCurrentChatId(null);
      setMessage('');
      setChatList([]);
      setShowDeleteConfirm(false);
      setChatToDelete(null);
      setIsInConversation(false);
      setShowSummariseModal(false);
      setSummariseCategory('');
      setSummaryResult('');
      setIsGeneratingSummary(false);
      
      // Then fetch the new user's chat history after a delay
      setTimeout(() => {
        fetchChatHistory();
      }, 200);
    } else if (!user) {
      // User logged out, clear all chat state
      console.log('ChatBot: User logged out, clearing state');
      setChatHistory([]);
      setCurrentChatId(null);
      setMessage('');
      setChatList([]);
      setShowDeleteConfirm(false);
      setChatToDelete(null);
      setIsInConversation(false);
      setShowSummariseModal(false);
      setSummariseCategory('');
      setSummaryResult('');
      setIsGeneratingSummary(false);
    } else if (currentUserId && !previousUserId) {
      // First time user login, fetch chat history
      console.log('ChatBot: First time user login, fetching chat history');
      fetchChatHistory();
    }
    
    // Update the ref with current user
    previousUserRef.current = currentUserId;
  }, [user]);

  const fetchChatHistory = async () => {
    if (!user) {
      setChatList([]);
      return;
    }
    
    setIsLoadingChats(true);
    try {
      const response = await apiFetch('/api/chats');
      setChatList(response.chats || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleChatSelect = async (chatId) => {
    if (chatId === currentChatId) return;
    
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/chat/${chatId}`);
      // Convert backend message format to frontend format
      const formattedMessages = (response.messages || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.role === 'user' ? 'user' : 'bot',
        timestamp: msg.createdAt
      }));
      setChatHistory(formattedMessages);
      setCurrentChatId(chatId);
      setIsInConversation(false); // Loading existing chat, don't auto-scroll
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setCurrentChatId(null);
    setMessage('');
    setIsInConversation(false); // Starting new chat, don't auto-scroll yet
  };

  const handleSummariseClick = () => {
    setShowSummariseModal(true);
    setSummariseCategory('');
    setSummaryResult('');
  };

  const handleCategorySelect = async (category) => {
    setSummariseCategory(category);
    setIsGeneratingSummary(true);
    
    try {
      // Get all chat messages from all chats
      const allChats = [];
      for (const chat of chatList) {
        try {
          const response = await apiFetch(`/api/chat/${chat.id}`);
          const messages = response.messages || [];
          allChats.push({
            chatId: chat.id,
            title: chat.title,
            messages: messages
          });
        } catch (error) {
          console.error(`Error fetching chat ${chat.id}:`, error);
        }
      }

      // Filter messages based on category keywords
      const filteredMessages = filterMessagesByCategory(allChats, category);
      
      console.log(`Found ${filteredMessages.length} messages for ${category} category`);
      console.log('Filtered messages:', filteredMessages);
      
      if (filteredMessages.length === 0) {
        setSummaryResult(`No ${category.toLowerCase()} related conversations found in your chat history.`);
        return;
      }

      // Generate summary
      const summary = await generateSummary(filteredMessages, category);
      console.log('Generated summary:', summary);
      setSummaryResult(summary);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryResult('Sorry, there was an error generating the summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const filterMessagesByCategory = (allChats, category) => {
    const keywords = {
      'Physical': ['exercise', 'workout', 'running', 'walking', 'gym', 'fitness', 'sport', 'physical', 'activity', 'steps', 'cardio', 'strength', 'yoga', 'swimming', 'cycling', 'jogging', 'dance', 'hiking', 'tennis', 'basketball', 'football', 'soccer', 'weight', 'muscle', 'endurance', 'flexibility', 'stamina'],
      'Social': ['social', 'friend', 'family', 'meeting', 'event', 'party', 'gathering', 'community', 'group', 'relationship', 'communication', 'interaction', 'support', 'lonely', 'isolated', 'connect', 'network', 'socialize', 'hangout', 'visit', 'call', 'text', 'message', 'chat', 'conversation'],
      'Nutritional': ['food', 'meal', 'diet', 'nutrition', 'eat', 'eating', 'hungry', 'hunger', 'breakfast', 'lunch', 'dinner', 'snack', 'calorie', 'protein', 'vitamin', 'mineral', 'vegetable', 'fruit', 'meat', 'fish', 'chicken', 'beef', 'pork', 'vegetarian', 'vegan', 'healthy', 'unhealthy', 'weight loss', 'weight gain', 'obesity', 'malnutrition', 'supplement', 'water', 'hydration', 'drink', 'beverage', 'alcohol', 'sugar', 'salt', 'fat', 'carb', 'carbohydrate'],
      'Mental': ['mental', 'stress', 'anxiety', 'depression', 'mood', 'emotion', 'feeling', 'sad', 'happy', 'angry', 'worried', 'calm', 'relaxed', 'tired', 'energetic', 'sleep', 'insomnia', 'dream', 'nightmare', 'therapy', 'counseling', 'meditation', 'mindfulness', 'breathing', 'relaxation', 'coping', 'overwhelmed', 'burnout', 'exhausted', 'focused', 'concentration', 'memory', 'cognitive', 'brain', 'mental health']
    };

    const categoryKeywords = keywords[category] || [];
    const filteredMessages = [];

    allChats.forEach(chat => {
      chat.messages.forEach(message => {
        const messageText = message.text.toLowerCase();
        const hasKeyword = categoryKeywords.some(keyword => 
          messageText.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword) {
          filteredMessages.push({
            chatId: chat.chatId,
            chatTitle: chat.title,
            text: message.text,
            role: message.role,
            createdAt: message.createdAt
          });
        }
      });
    });

    return filteredMessages;
  };

  const generateSummary = async (messages, category) => {
    try {
      // Create a prompt for the AI to summarize the messages
      const messageTexts = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n\n');

      const prompt = `Please provide a comprehensive summary of the ${category.toLowerCase()} related conversations from the following chat messages. Focus on key insights, patterns, advice given, and important information related to ${category.toLowerCase()} health and wellness. Keep the summary informative but concise (2-3 paragraphs):

${messageTexts}`;

      // Use a direct API call to a summarization endpoint that doesn't create a chat
      const response = await apiFetch('/api/summarize', {
        method: 'POST',
        body: {
          messages: messages,
          category: category,
          prompt: prompt
        }
      });

      console.log('Summary API response:', response);

      // Handle response
      if (response && response.summary) {
        return response.summary;
      } else if (response && response.text) {
        return response.text;
      } else if (response && response.message) {
        return response.message;
      } else {
        // Fallback to local summary if API fails
        return createLocalSummary(messages, category);
      }

    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to local summary if API call fails
      return createLocalSummary(messages, category);
    }
  };

  const createLocalSummary = (messages, category) => {
    // Create a simple local summary without using the chat API
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    const summary = `Based on your ${category.toLowerCase()} related conversations, here's what I found:

**Key Topics Discussed:**
${userMessages.slice(0, 5).map(msg => `• ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`).join('\n')}

**Main Advice Given:**
${assistantMessages.slice(0, 3).map(msg => `• ${msg.text.substring(0, 150)}${msg.text.length > 150 ? '...' : ''}`).join('\n')}

**Summary:**
You've had ${messages.length} ${category.toLowerCase()} related conversations covering various aspects of ${category.toLowerCase()} health and wellness. The discussions included practical advice, recommendations, and guidance tailored to your specific needs and questions.

This summary is based on ${userMessages.length} questions you asked and ${assistantMessages.length} responses provided, focusing on ${category.toLowerCase()} related topics.`;

    return summary;
  };

  const closeSummariseModal = () => {
    setShowSummariseModal(false);
    setSummariseCategory('');
    setSummaryResult('');
    setIsGeneratingSummary(false);
  };

  const handleDeleteClick = (chatId, e) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    setChatToDelete(chatId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;
    
    try {
      // Delete from backend
      await apiFetch(`/api/chat/${chatToDelete}`, {
        method: 'DELETE'
      });
      
      // Remove from local state
      setChatList(prev => prev.filter(chat => chat.id !== chatToDelete));
      
      // If the deleted chat was currently active, clear the chat
      if (currentChatId === chatToDelete) {
        setChatHistory([]);
        setCurrentChatId(null);
        setMessage('');
        setIsInConversation(false); // Chat deleted, don't auto-scroll
      }
      
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      // You could add a toast notification here
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      navigate('/dashboard');
    } else if (tab === 'Health') {
      navigate('/health');
    } else if (tab === 'Goals') {
      navigate('/goals');
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading && user) {
      const userMessage = {
        id: Date.now(),
        text: message.trim(),
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Add user message to chat
      setChatHistory(prev => [...prev, userMessage]);
      setIsInConversation(true); // User sent message, now we're in conversation
      setIsLoading(true);
      
      try {
        // Send message to backend
        const response = await apiFetch('/api/chat', {
          method: 'POST',
          body: {
            message: message.trim(),
            chatId: currentChatId
          }
        });
        
        // Check if response contains goal creation request
        if (response.goalCreation) {
          // Store pending goal and show confirmation
          setPendingGoal({
            ...response.goalCreation,
            chatId: response.chatId
          });
          setShowGoalConfirmation(true);
          
          // Add bot's confirmation message
          const botMessage = {
            id: Date.now() + 1,
            text: response.goalCreation.confirmationMessage || response.reply,
            sender: 'bot',
            timestamp: response.at,
            isGoalConfirmation: true
          };
          setChatHistory(prev => [...prev, botMessage]);
        } else {
          // Normal message response
          const botMessage = {
            id: Date.now() + 1,
            text: response.reply,
            sender: 'bot',
            timestamp: response.at
          };
          setChatHistory(prev => [...prev, botMessage]);
        }
        
        setCurrentChatId(response.chatId);
        setMessage('');
        
        // Refresh chat list to show new chat or updated title
        fetchChatHistory();
      } catch (error) {
        console.error('Chat error:', error);
        
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle goal confirmation
  const handleGoalConfirm = async () => {
    if (!pendingGoal) return;
    
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/chat/create-goal', {
        method: 'POST',
        body: {
          goalType: pendingGoal.goalType,
          details: pendingGoal.details,
          chatId: pendingGoal.chatId
        }
      });
      
      // Add success message to chat
      const successMessage = {
        id: Date.now(),
        text: response.confirmationMessage + ' You can view and track it in the Goals section! 🎯',
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, successMessage]);
      
      // Clear pending goal and hide confirmation
      setPendingGoal(null);
      setShowGoalConfirmation(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now(),
        text: 'Sorry, I couldn\'t create the goal. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle goal rejection
  const handleGoalReject = () => {
    // Add rejection message to chat
    const rejectionMessage = {
      id: Date.now(),
      text: 'No problem! Let me know if you\'d like to set a different goal.',
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, rejectionMessage]);
    
    // Clear pending goal and hide confirmation
    setPendingGoal(null);
    setShowGoalConfirmation(false);
  };

  const handleQuestionClick = async (question) => {
    setMessage(question);
    // Auto-send the question
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
      {/* Navbar */}
      <nav className="glass-effect shadow-xl border-b border-white/20 sticky top-0 z-40">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Name */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="relative">
                <img src="/livewell-logo.svg" alt="LiveWell Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                LiveWell
              </span>
            </div>
            
            {/* Right side - Profile */}
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/profile')}
                className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="transition-transform duration-300 group-hover:scale-110"><i className="fi fi-sr-user"></i></span>
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen">
        {/* Sidebar - Always visible */}
        <div className="w-80 bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col border-r border-gray-700 shadow-2xl">
          <div className="p-4 flex-1 overflow-y-auto">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mb-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New chat</span>
            </button>

            {/* Summarise Button */}
            <button
              onClick={handleSummariseClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mb-6"
            >
              <i className="fi fi-sr-select text-lg"></i>
              <span>Summarise</span>
            </button>

            {/* Chat History */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>
              {isLoadingChats ? (
                <div className="text-gray-400 text-center py-4">Loading chats...</div>
              ) : chatList.length === 0 ? (
                <div className="text-gray-400 text-center py-4 text-sm">No chats yet</div>
              ) : (
                chatList.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full p-3 rounded-lg transition-colors group ${
                      chat.id === currentChatId
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleChatSelect(chat.id)}
                        className="flex-1 flex items-center space-x-3 text-left min-w-0"
                      >
                        <img 
                          src="/src/assets/chat.png" 
                          alt="Chat Icon" 
                          className="w-5 h-5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-sm">{chat.title}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(chat.id, e)}
                        className="opacity-100 p-1 hover:bg-gray-600 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col w-full px-6">
            {/* Chat Content Area */}
            <div className="flex-1 flex flex-col glass-effect my-6 rounded-xl shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
              <div className="flex-1 overflow-y-auto p-6">
                {/* Welcome message if no chat history */}
                {chatHistory.length === 0 && (
                  <div className="flex items-start space-x-3 mb-6">
                    <div className="w-15 h-15 rounded-full overflow-hidden">
                      <img 
                        src="/src/assets/chatbotavatar.png" 
                        alt="ChatBot Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Welcome to LiveWell{user?.displayName ? `, ${user.displayName}` : ''}!
                      </h3>
                      <p className="text-gray-800 text-base leading-relaxed">I'm your friendly health assistant, here to help you stay healthy and active. Ask me anything about exercise, nutrition, safety, or general wellness!</p>
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-3 mb-4 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                        <img 
                          src="/src/assets/chatbotavatar.png" 
                          alt="ChatBot Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-2xl rounded-lg p-3 ${
                      msg.sender === 'user' 
                        ? 'bg-green-500 text-white' 
                        : msg.isError 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    } ${msg.sender === 'bot' ? 'lg:max-w-4xl' : ''}`}>
                      {msg.sender === 'bot' ? (
                        <div className="prose prose-sm max-w-none text-left">
                          {msg.text.split('\n').map((line, index) => {
                            // Handle headings (lines that start with #)
                            if (line.trim().startsWith('#')) {
                              const level = line.match(/^#+/)[0].length;
                              const text = line.trim().replace(/^#+\s*/, '');
                              const headingClass = level === 1 ? 'text-xl font-bold' : 'text-lg font-semibold';
                              return (
                                <h3 key={index} className={`${headingClass} text-gray-900 mb-3 mt-4 first:mt-0 border-b border-gray-200 pb-2`}>
                                  {text}
                                </h3>
                              );
                            }
                            // Handle headings (lines that end with :)
                            else if (line.trim().endsWith(':') && line.trim().length > 3) {
                              return (
                                <h3 key={index} className="text-lg font-semibold text-gray-900 mb-3 mt-4 first:mt-0 border-b border-gray-200 pb-2">
                                  {line.trim()}
                                </h3>
                              );
                            }
                            // Handle bullet points (lines that start with • or - or *)
                            else if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                              return (
                                <div key={index} className="flex items-start space-x-3 mb-3">
                                  <span className="text-green-600 font-bold mt-1 text-lg flex-shrink-0">•</span>
                                  <span className="text-gray-800 text-base leading-relaxed">{line.trim().substring(1).trim()}</span>
                                </div>
                              );
                            }
                            // Handle numbered lists
                            else if (/^\d+\./.test(line.trim())) {
                              return (
                                <div key={index} className="flex items-start space-x-3 mb-3">
                                  <span className="text-green-600 font-bold mt-1 text-lg flex-shrink-0">{line.trim().match(/^\d+\./)[0]}</span>
                                  <span className="text-gray-800 text-base leading-relaxed">{line.trim().replace(/^\d+\.\s*/, '')}</span>
                                </div>
                              );
                            }
                            // Handle empty lines
                            else if (line.trim() === '') {
                              return <div key={index} className="h-4"></div>;
                            }
                            // Handle regular text
                            else {
                              // Check for bold text with **
                              const text = line.trim();
                              if (text.includes('**')) {
                                const parts = [];
                                let currentText = text;
                                
                                while (currentText.includes('**')) {
                                  const startIndex = currentText.indexOf('**');
                                  const endIndex = currentText.indexOf('**', startIndex + 2);
                                  
                                  if (endIndex === -1) break; // No closing ** found
                                  
                                  // Add text before the bold part
                                  if (startIndex > 0) {
                                    const beforeText = currentText.slice(0, startIndex);
                                    parts.push({
                                      type: 'text',
                                      content: beforeText
                                    });
                                  }
                                  
                                  // Add the bold part
                                  const boldContent = currentText.slice(startIndex + 2, endIndex);
                                  parts.push({
                                    type: 'bold',
                                    content: boldContent
                                  });
                                  
                                  // Update currentText to continue processing
                                  currentText = currentText.slice(endIndex + 2);
                                }
                                
                                // Add remaining text
                                if (currentText.length > 0) {
                                  parts.push({
                                    type: 'text',
                                    content: currentText
                                  });
                                }
                                
                                return (
                                  <p key={index} className="text-gray-800 mb-3 leading-relaxed text-base">
                                    {parts.map((part, partIndex) => {
                                      if (part.type === 'bold') {
                                        return <strong key={partIndex} className="font-semibold text-gray-900">{part.content}</strong>;
                                      }
                                      return <span key={partIndex}>{part.content}</span>;
                                    })}
                                  </p>
                                );
                              }
                              return (
                                <p key={index} className="text-gray-800 mb-3 leading-relaxed text-base">
                                  {text}
                                </p>
                              );
                            }
                          })}
                        </div>
                      ) : (
                        <p className="text-sm">{msg.text}</p>
                      )}
                      <p className={`text-xs mt-2 ${
                        msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src="/src/assets/chatbotavatar.png" 
                        alt="ChatBot Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions - Only 2 questions */}
              {chatHistory.length === 0 && (
                <div className="px-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "What gentle exercises can I do today?",
                      "How can I improve my balance?"
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question)}
                        disabled={isLoading}
                        className="text-left p-4 glass-effect bg-gradient-to-br from-white/60 to-gray-50/60 hover:from-white/80 hover:to-gray-100/80 rounded-lg border border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg card-hover"
                      >
                        <span className="text-sm text-gray-700 font-medium">{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Message Input */}
              <div className="border-t border-gray-200 p-6 pb-34">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder="Type your health question here..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                  >
                    <span>{isLoading ? 'Sending...' : 'Send'}</span>
                    {!isLoading && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Try asking about exercise, nutrition, safety, or general wellness
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Goal Confirmation Modal */}
      {showGoalConfirmation && pendingGoal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <i className="fi fi-sr-target text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Goal Creation</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4 leading-relaxed">
                {pendingGoal.confirmationMessage}
              </p>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <i className="fi fi-sr-info text-green-600 mr-2"></i>
                  Goal Details:
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li><strong>Type:</strong> {pendingGoal.goalType}</li>
                  {pendingGoal.details.type && <li><strong>Activity:</strong> {pendingGoal.details.type}</li>}
                  {pendingGoal.details.amount && <li><strong>Amount:</strong> {pendingGoal.details.amount}</li>}
                  {pendingGoal.details.days && <li><strong>Days:</strong> {pendingGoal.details.days}</li>}
                  {pendingGoal.details.name && <li><strong>Name:</strong> {pendingGoal.details.name}</li>}
                  {pendingGoal.details.date && <li><strong>Date:</strong> {pendingGoal.details.date}</li>}
                  {pendingGoal.details.frequency && <li><strong>Frequency:</strong> {pendingGoal.details.frequency}</li>}
                </ul>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleGoalReject}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGoalConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="fi fi-sr-check"></i>
                    <span>Create Goal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-white/30 bg-gradient-to-br from-white/90 to-gray-50/90">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summarise Modal */}
      {showSummariseModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl border border-white/30 bg-gradient-to-br from-white/90 to-gray-50/90">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fi fi-sr-select text-blue-600 text-lg"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Summarise Conversations</h3>
              </div>
              <button
                onClick={closeSummariseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fi fi-sr-cross text-xl"></i>
              </button>
            </div>

            {!summariseCategory ? (
              <div>
                <p className="text-gray-600 mb-6">
                  Choose a category to get a summary of all related conversations from your chat history.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCategorySelect('Physical')}
                    className="p-4 rounded-lg border-2 border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <i className="fi fi-sr-treadmill text-blue-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Physical</h4>
                        <p className="text-sm text-gray-600">Exercise, fitness, and physical activities</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCategorySelect('Social')}
                    className="p-4 rounded-lg border-2 border-green-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left group shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <i className="fi fi-sr-users text-green-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Social</h4>
                        <p className="text-sm text-gray-600">Social interactions and relationships</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCategorySelect('Nutritional')}
                    className="p-4 rounded-lg border-2 border-orange-200 bg-white hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-left group shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <i className="fi fi-sr-salad text-orange-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Nutritional</h4>
                        <p className="text-sm text-gray-600">Food, diet, and nutrition advice</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCategorySelect('Mental')}
                    className="p-4 rounded-lg border-2 border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-left group shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <i className="fi fi-sr-brain text-purple-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mental</h4>
                        <p className="text-sm text-gray-600">Mental health and emotional wellbeing</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    summariseCategory === 'Physical' ? 'bg-blue-100' :
                    summariseCategory === 'Social' ? 'bg-green-100' :
                    summariseCategory === 'Nutritional' ? 'bg-orange-100' :
                    'bg-purple-100'
                  }`}>
                    <i className={`text-lg ${
                      summariseCategory === 'Physical' ? 'fi fi-sr-treadmill text-blue-600' :
                      summariseCategory === 'Social' ? 'fi fi-sr-users text-green-600' :
                      summariseCategory === 'Nutritional' ? 'fi fi-sr-salad text-orange-600' :
                      'fi fi-sr-brain text-purple-600'
                    }`}></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{summariseCategory} Summary</h4>
                </div>

                {isGeneratingSummary ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating summary...</p>
                  </div>
                ) : summaryResult ? (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto shadow-sm">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                        {summaryResult}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSummariseCategory('')}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors bg-white"
                      >
                        Choose Different Category
                      </button>
                      <button
                        onClick={closeSummariseModal}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Navigation Bar */}
      <FloatingNavbar />
    </div>
  );
};

export default ChatBot;