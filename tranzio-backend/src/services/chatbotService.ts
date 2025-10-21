import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chatbot response types
export interface ChatbotResponse {
  message: string;
  type: 'text' | 'quick_reply' | 'action' | 'link';
  quickReplies?: string[];
  actions?: {
    type: 'navigate' | 'create_transaction' | 'join_transaction' | 'view_wallet' | 'contact_support';
    label: string;
    url?: string;
    data?: any;
  }[];
  links?: {
    text: string;
    url: string;
  }[];
  suggestions?: string[];
}

// Chatbot context
export interface ChatbotContext {
  userId?: string;
  userRole?: string;
  currentPage?: string;
  conversationHistory: ChatbotMessage[];
  userPreferences?: {
    language?: string;
    timezone?: string;
  };
}

// Chatbot message
export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'quick_reply' | 'action';
  metadata?: any;
}

// Knowledge base categories
const KNOWLEDGE_BASE = {
  general: {
    greetings: [
      "Hello! I'm Tranzio's AI assistant. How can I help you today?",
      "Hi there! Welcome to Tranzio. What can I assist you with?",
      "Good day! I'm here to help with any questions about our escrow platform."
    ],
    help: [
      "I can help you with transactions, payments, verification, fees, and general platform questions.",
      "What specific area would you like to know more about?",
      "I'm here to assist with any Tranzio-related questions you might have."
    ],
    goodbye: [
      "Thank you for using Tranzio! Have a great day!",
      "Goodbye! Feel free to reach out anytime you need help.",
      "Take care! Remember, I'm here 24/7 if you need assistance."
    ]
  },
  
  transactions: {
    create: [
      "To create a transaction, go to 'Create Transaction' in your dashboard. You'll need to provide transaction details, set the amount, and generate an invitation code.",
      "Creating a transaction is easy! Navigate to the Create Transaction page and fill in the required details.",
      "I can guide you through creating a transaction. Would you like step-by-step instructions?"
    ],
    join: [
      "To join a transaction, you'll need an invitation code from the transaction creator. Go to 'Join Transaction' and enter the code.",
      "Joining a transaction requires a valid invitation code. Make sure you have the code from the transaction creator.",
      "I can help you join a transaction. Do you have an invitation code?"
    ],
    status: [
      "You can check your transaction status in the 'My Transactions' section of your dashboard.",
      "Transaction statuses include: Pending, Active, Completed, Failed, and Disputed.",
      "Would you like me to explain what each transaction status means?"
    ]
  },
  
  payments: {
    escrow: [
      "Escrow payments are held securely until both parties complete their obligations. This protects both buyers and sellers.",
      "Your payment is held in escrow until the transaction is completed successfully.",
      "Escrow ensures your money is safe until you receive what you paid for."
    ],
    release: [
      "Payments are released when both parties confirm the transaction is complete, or based on automatic conditions you set.",
      "You can set automatic release conditions like time-based or delivery confirmation.",
      "Manual payment release is available for immediate transactions."
    ],
    fees: [
      "Our escrow fees range from 0.5% to 5% based on transaction risk factors.",
      "Use our Fee Calculator to see exactly what you'll pay for your transaction.",
      "Fees are calculated based on amount, verification level, transaction type, and other risk factors."
    ]
  },
  
  verification: {
    process: [
      "Identity verification helps reduce escrow fees and builds trust. You can verify with NIN, BVN, and document upload.",
      "Go to the Verification page to start your identity verification process.",
      "Verification levels: Basic (email only), Enhanced (NIN), Premium (NIN + BVN)."
    ],
    benefits: [
      "Verified users get lower escrow fees and are more trusted by other users.",
      "Verification increases your trust score and reduces transaction risks.",
      "Premium verification gives you the lowest fees and highest trust level."
    ]
  },
  
  security: {
    safety: [
      "Tranzio uses bank-level security to protect your funds and personal information.",
      "All transactions are encrypted and monitored for suspicious activity.",
      "Your money is held in secure escrow accounts until transactions are completed."
    ],
    fraud: [
      "If you suspect fraud, report it immediately through our support system.",
      "We have fraud detection systems and dispute resolution processes.",
      "Never share your invitation codes with unauthorized parties."
    ]
  },
  
  technical: {
    issues: [
      "For technical issues, try refreshing the page or clearing your browser cache.",
      "Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge).",
      "If problems persist, contact our technical support team."
    ],
    mobile: [
      "Tranzio works on mobile browsers and has a PWA for app-like experience.",
      "You can install Tranzio as a mobile app for easier access.",
      "Mobile users get the same features as desktop users."
    ]
  }
};

// Common questions and responses
const COMMON_QUESTIONS = {
  "how to create transaction": "transactions.create",
  "how to join transaction": "transactions.join",
  "transaction status": "transactions.status",
  "escrow fees": "payments.fees",
  "payment release": "payments.release",
  "identity verification": "verification.process",
  "verification benefits": "verification.benefits",
  "security": "security.safety",
  "fraud": "security.fraud",
  "technical issues": "technical.issues",
  "mobile app": "technical.mobile",
  "help": "general.help",
  "hello": "general.greetings",
  "hi": "general.greetings",
  "goodbye": "general.goodbye",
  "bye": "general.goodbye"
};

export class ChatbotService {
  /**
   * Process user message and generate response
   */
  static async processMessage(
    userMessage: string,
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    try {
      const message = userMessage.toLowerCase().trim();
      
      // Handle greetings
      if (this.isGreeting(message)) {
        return this.generateGreetingResponse(context);
      }
      
      // Handle goodbye
      if (this.isGoodbye(message)) {
        return this.generateGoodbyeResponse();
      }
      
      // Handle common questions
      const matchedQuestion = this.findMatchingQuestion(message);
      if (matchedQuestion) {
        return this.generateKnowledgeResponse(matchedQuestion, context);
      }
      
      // Handle specific intents
      const intent = this.detectIntent(message);
      if (intent) {
        return this.generateIntentResponse(intent, context);
      }
      
      // Handle transaction-specific queries
      if (this.isTransactionQuery(message)) {
        return this.generateTransactionResponse(message, context);
      }
      
      // Handle payment queries
      if (this.isPaymentQuery(message)) {
        return this.generatePaymentResponse(message, context);
      }
      
      // Handle verification queries
      if (this.isVerificationQuery(message)) {
        return this.generateVerificationResponse(message, context);
      }
      
      // Default response with suggestions
      return this.generateDefaultResponse(context);
      
    } catch (error) {
      console.error('Chatbot processing error:', error);
      return this.generateErrorResponse();
    }
  }
  
  /**
   * Check if message is a greeting
   */
  private static isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
    return greetings.some(greeting => message.includes(greeting));
  }
  
  /**
   * Check if message is a goodbye
   */
  private static isGoodbye(message: string): boolean {
    const goodbyes = ['bye', 'goodbye', 'see you', 'farewell', 'thanks', 'thank you'];
    return goodbyes.some(goodbye => message.includes(goodbye));
  }
  
  /**
   * Find matching question in knowledge base
   */
  private static findMatchingQuestion(message: string): string | null {
    for (const [question, response] of Object.entries(COMMON_QUESTIONS)) {
      if (message.includes(question)) {
        return response;
      }
    }
    return null;
  }
  
  /**
   * Detect user intent
   */
  private static detectIntent(message: string): string | null {
    const intents = {
      'create_transaction': ['create', 'start', 'new transaction', 'begin'],
      'join_transaction': ['join', 'enter', 'participate', 'accept'],
      'check_status': ['status', 'progress', 'where', 'how is'],
      'payment_help': ['payment', 'money', 'funds', 'pay'],
      'verification_help': ['verify', 'verification', 'identity', 'kyc'],
      'fee_help': ['fee', 'cost', 'price', 'charge'],
      'security_help': ['safe', 'secure', 'protection', 'fraud'],
      'technical_help': ['bug', 'error', 'problem', 'issue', 'not working']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    
    return null;
  }
  
  /**
   * Check if message is about transactions
   */
  private static isTransactionQuery(message: string): boolean {
    const keywords = ['transaction', 'deal', 'trade', 'exchange', 'order'];
    return keywords.some(keyword => message.includes(keyword));
  }
  
  /**
   * Check if message is about payments
   */
  private static isPaymentQuery(message: string): boolean {
    const keywords = ['payment', 'money', 'funds', 'escrow', 'release', 'fee'];
    return keywords.some(keyword => message.includes(keyword));
  }
  
  /**
   * Check if message is about verification
   */
  private static isVerificationQuery(message: string): boolean {
    const keywords = ['verify', 'verification', 'identity', 'kyc', 'nin', 'bvn', 'document'];
    return keywords.some(keyword => message.includes(keyword));
  }
  
  /**
   * Generate greeting response
   */
  private static generateGreetingResponse(context: ChatbotContext): ChatbotResponse {
    const greetings = KNOWLEDGE_BASE.general.greetings;
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return {
      message: randomGreeting,
      type: 'quick_reply',
      quickReplies: [
        'How do I create a transaction?',
        'How do I join a transaction?',
        'What are the fees?',
        'How does verification work?'
      ],
      suggestions: [
        'Create Transaction',
        'Join Transaction',
        'Check Fees',
        'Identity Verification'
      ]
    };
  }
  
  /**
   * Generate goodbye response
   */
  private static generateGoodbyeResponse(): ChatbotResponse {
    const goodbyes = KNOWLEDGE_BASE.general.goodbye;
    const randomGoodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];
    
    return {
      message: randomGoodbye,
      type: 'text'
    };
  }
  
  /**
   * Generate knowledge base response
   */
  private static generateKnowledgeResponse(
    knowledgePath: string,
    context: ChatbotContext
  ): ChatbotResponse {
    const [category, subcategory] = knowledgePath.split('.');
    const responses = (KNOWLEDGE_BASE as any)[category]?.[subcategory];
    
    if (responses && responses.length > 0) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        message: randomResponse,
        type: 'action',
        actions: this.getContextualActions(category, context),
        suggestions: this.getContextualSuggestions(category)
      };
    }
    
    return this.generateDefaultResponse(context);
  }
  
  /**
   * Generate intent-based response
   */
  private static generateIntentResponse(
    intent: string,
    context: ChatbotContext
  ): ChatbotResponse {
    switch (intent) {
      case 'create_transaction':
        return {
          message: "I'll help you create a transaction! Go to 'Create Transaction' in your dashboard, or I can guide you through the process step by step.",
          type: 'action',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Create Transaction',
              url: '/app/create-transaction'
            }
          ],
          suggestions: ['Step-by-step guide', 'Transaction requirements', 'Fee calculation']
        };
        
      case 'join_transaction':
        return {
          message: "To join a transaction, you need an invitation code from the transaction creator. Go to 'Join Transaction' and enter the code.",
          type: 'action',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Join Transaction',
              url: '/app/join-transaction'
            }
          ],
          suggestions: ['What is an invitation code?', 'How to get invitation code?', 'Transaction requirements']
        };
        
      case 'check_status':
        return {
          message: "You can check your transaction status in 'My Transactions'. I can also help you understand what each status means.",
          type: 'action',
          actions: [
            {
              type: 'navigate',
              label: 'View My Transactions',
              url: '/app/transactions'
            }
          ],
          suggestions: ['Transaction status meanings', 'How to update status', 'Troubleshooting']
        };
        
      case 'payment_help':
        return {
          message: "I can help with payment questions! Our escrow system holds funds securely until transactions are completed.",
          type: 'quick_reply',
          quickReplies: [
            'How does escrow work?',
            'When are payments released?',
            'What are the fees?',
            'Payment methods'
          ]
        };
        
      case 'verification_help':
        return {
          message: "Identity verification helps reduce fees and builds trust. You can verify with NIN, BVN, and document upload.",
          type: 'action',
          actions: [
            {
              type: 'navigate',
              label: 'Start Verification',
              url: '/app/verification'
            }
          ],
          suggestions: ['Verification benefits', 'Required documents', 'Verification levels']
        };
        
      case 'fee_help':
        return {
          message: "Our fees range from 0.5% to 5% based on risk factors. Use our Fee Calculator to see exactly what you'll pay.",
          type: 'action',
          actions: [
            {
              type: 'navigate',
              label: 'Calculate Fees',
              url: '/app/escrow-calculator'
            }
          ],
          suggestions: ['Fee structure', 'How to reduce fees', 'Risk factors']
        };
        
      case 'security_help':
        return {
          message: "Tranzio uses bank-level security to protect your funds. All transactions are encrypted and monitored.",
          type: 'quick_reply',
          quickReplies: [
            'How secure is Tranzio?',
            'Fraud protection',
            'Data privacy',
            'Report suspicious activity'
          ]
        };
        
      case 'technical_help':
        return {
          message: "I'm here to help with technical issues! Try refreshing the page or clearing your browser cache first.",
          type: 'quick_reply',
          quickReplies: [
            'Page not loading',
            'Login problems',
            'Mobile issues',
            'Contact technical support'
          ]
        };
        
      default:
        return this.generateDefaultResponse(context);
    }
  }
  
  /**
   * Generate transaction-specific response
   */
  private static generateTransactionResponse(
    message: string,
    context: ChatbotContext
  ): ChatbotResponse {
    if (message.includes('create') || message.includes('start')) {
      return this.generateIntentResponse('create_transaction', context);
    } else if (message.includes('join') || message.includes('enter')) {
      return this.generateIntentResponse('join_transaction', context);
    } else if (message.includes('status') || message.includes('progress')) {
      return this.generateIntentResponse('check_status', context);
    }
    
    return {
      message: "I can help with transaction questions! What specifically would you like to know?",
      type: 'quick_reply',
      quickReplies: [
        'How to create a transaction',
        'How to join a transaction',
        'Check transaction status',
        'Transaction requirements'
      ]
    };
  }
  
  /**
   * Generate payment-specific response
   */
  private static generatePaymentResponse(
    message: string,
    context: ChatbotContext
  ): ChatbotResponse {
    if (message.includes('fee') || message.includes('cost')) {
      return this.generateIntentResponse('fee_help', context);
    } else if (message.includes('release') || message.includes('when')) {
      return {
        message: "Payments are released when both parties confirm completion, or based on automatic conditions you set.",
        type: 'quick_reply',
        quickReplies: [
          'How to set auto-release',
          'Manual payment release',
          'Payment conditions',
          'Dispute resolution'
        ]
      };
    }
    
    return this.generateIntentResponse('payment_help', context);
  }
  
  /**
   * Generate verification-specific response
   */
  private static generateVerificationResponse(
    message: string,
    context: ChatbotContext
  ): ChatbotResponse {
    return this.generateIntentResponse('verification_help', context);
  }
  
  /**
   * Generate default response
   */
  private static generateDefaultResponse(context: ChatbotContext): ChatbotResponse {
    return {
      message: "I'm here to help! I can assist with transactions, payments, verification, fees, and general platform questions. What would you like to know?",
      type: 'quick_reply',
      quickReplies: [
        'How to create a transaction?',
        'How to join a transaction?',
        'What are the fees?',
        'How does verification work?',
        'Is Tranzio secure?',
        'Contact human support'
      ],
      suggestions: [
        'Create Transaction',
        'Join Transaction',
        'Fee Calculator',
        'Identity Verification',
        'My Transactions',
        'Wallet'
      ]
    };
  }
  
  /**
   * Generate error response
   */
  private static generateErrorResponse(): ChatbotResponse {
    return {
      message: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team for immediate assistance.",
      type: 'action',
      actions: [
        {
          type: 'contact_support',
          label: 'Contact Support',
          url: '/app/contact'
        }
      ]
    };
  }
  
  /**
   * Get contextual actions based on category
   */
  private static getContextualActions(category: string, context: ChatbotContext): any[] {
    const actions: { type: string; label: string; url: string }[] = [];
    
    switch (category) {
      case 'transactions':
        actions.push(
          { type: 'navigate', label: 'Create Transaction', url: '/app/create-transaction' },
          { type: 'navigate', label: 'Join Transaction', url: '/app/join-transaction' },
          { type: 'navigate', label: 'My Transactions', url: '/app/transactions' }
        );
        break;
      case 'payments':
        actions.push(
          { type: 'navigate', label: 'Fee Calculator', url: '/app/escrow-calculator' },
          { type: 'navigate', label: 'Wallet', url: '/app/wallet' }
        );
        break;
      case 'verification':
        actions.push(
          { type: 'navigate', label: 'Start Verification', url: '/app/verification' }
        );
        break;
    }
    
    return actions;
  }
  
  /**
   * Get contextual suggestions based on category
   */
  private static getContextualSuggestions(category: string): string[] {
    switch (category) {
      case 'transactions':
        return ['Create Transaction', 'Join Transaction', 'Transaction Status', 'Requirements'];
      case 'payments':
        return ['Fee Calculator', 'Payment Methods', 'Escrow Process', 'Release Conditions'];
      case 'verification':
        return ['Start Verification', 'Verification Benefits', 'Required Documents', 'Trust Score'];
      case 'security':
        return ['Security Features', 'Fraud Protection', 'Data Privacy', 'Report Issues'];
      default:
        return ['Help', 'Contact Support', 'Platform Guide', 'FAQ'];
    }
  }
  
  /**
   * Save conversation to database
   */
  static async saveConversation(
    userId: string,
    userMessage: string,
    botResponse: ChatbotResponse
  ): Promise<void> {
    try {
      // In a real implementation, you would save to database
      // For now, we'll just log the conversation
      console.log('Chatbot conversation:', {
        userId,
        userMessage,
        botResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
  
  /**
   * Get conversation history
   */
  static async getConversationHistory(userId: string): Promise<ChatbotMessage[]> {
    try {
      // In a real implementation, you would fetch from database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }
}
