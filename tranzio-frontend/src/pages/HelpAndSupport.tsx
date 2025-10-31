import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock,
  HelpCircle,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Shield,
  CreditCard,
  Package,
  Settings,
  Rocket
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    questions: [
      {
        q: 'How do I create my first transaction?',
        a: 'Click on "Create Transaction" from your dashboard, select your role (Buyer or Seller), and follow the step-by-step process to set up your transaction details.'
      },
      {
        q: 'What information do I need to create a transaction?',
        a: 'You need the item description, price, shipping method, and your counterparty\'s contact information. All fields are clearly marked during the transaction creation process.'
      },
      {
        q: 'How does the escrow system work?',
        a: 'Funds are securely held in our escrow account until both parties are satisfied. Once the buyer confirms receipt and quality, funds are released to the seller.'
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Fees',
    icon: CreditCard,
    questions: [
      {
        q: 'What are the transaction fees?',
        a: 'We charge a 2.5% transaction fee on all escrow transactions. This fee is deducted from the transaction amount before funds are released.'
      },
      {
        q: 'When do I get paid?',
        a: 'Sellers receive payment once the buyer confirms receipt and satisfaction with the item. This typically happens within 24-48 hours after delivery confirmation.'
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We support all major Nigerian bank transfers. You\'ll receive a unique virtual account number for receiving payments directly to your bank account.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Safety',
    icon: Shield,
    questions: [
      {
        q: 'How secure is my money?',
        a: 'All funds are held in secure escrow accounts with bank-level encryption. We never access your funds except to process legitimate transactions.'
      },
      {
        q: 'What if something goes wrong with my transaction?',
        a: 'You can open a dispute through the Disputes section. Our team will review the case and help resolve it fairly within 48-72 hours.'
      },
      {
        q: 'How do I verify a transaction is legitimate?',
        a: 'All transactions on Tranzio are verified and monitored. Check the transaction status and use our messaging system to communicate with your counterparty.'
      }
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: Package,
    questions: [
      {
        q: 'How do I add shipping details?',
        a: 'After creating a transaction, navigate to the transaction details page and click "Add Shipping Details". Enter tracking information and delivery address.'
      },
      {
        q: 'What if my item gets lost in transit?',
        a: 'If you have shipping insurance, file a claim. Otherwise, open a dispute and we\'ll help investigate and resolve the issue based on the shipping information provided.'
      },
      {
        q: 'Can I use my own courier service?',
        a: 'Yes, you can use any courier service. Just make sure to provide accurate tracking information in the shipping details section.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: Settings,
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'Go to your Profile page from the navigation menu. You can update your personal information, email, password, and notification preferences.'
      },
      {
        q: 'How do I change my password?',
        a: 'Navigate to Settings in your profile, then click on "Change Password". Enter your current password and your new password twice for confirmation.'
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes, you can delete your account from the Settings page. Note that you must have no active transactions before account deletion.'
      }
    ]
  }
];

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email',
    contact: 'support@tranzio.com',
    action: 'Send Email'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available 24/7',
    action: 'Start Chat'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Call us directly',
    contact: '+234 800 TRANZIO',
    action: 'Call Now'
  }
];

export default function HelpAndSupport() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  useSEO({
    title: 'Help & Support - Tranzio',
    description: 'Get help with your Tranzio account. Find answers to common questions, contact support, or browse our help articles.'
  });

  const filteredCategories = faqCategories.filter(category => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return category.title.toLowerCase().includes(searchLower) ||
           category.questions.some(q => 
             q.q.toLowerCase().includes(searchLower) || 
             q.a.toLowerCase().includes(searchLower)
           );
  });

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-600 mt-1">Find answers or get in touch with our team</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                    <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              View All
            </Button>
          )}
        </div>

        {/* Category Filters */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-blue-100 w-fit mb-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{category.title}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Questions */}
        <div className="space-y-4">
          {(selectedCategory 
            ? faqCategories.filter(c => c.id === selectedCategory)
            : filteredCategories
          ).map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <div className="flex items-center space-x-3">
                  {React.createElement(category.icon, { className: "h-5 w-5 text-blue-600" })}
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {category.questions.map((faq, index) => {
                  const globalIndex = faqCategories.indexOf(category) * 10 + index;
                  const isExpanded = expandedQuestion === globalIndex;
                  
                  return (
                    <div
                      key={index}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleQuestion(globalIndex)}
                        className="w-full p-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 flex-1 pr-4">
                          {faq.q}
                        </span>
                        <ChevronRight
                          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-gray-600">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>Send us a message and we'll get back to you within 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <Input placeholder="What can we help you with?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <Textarea 
                placeholder="Tell us more about your issue..."
                className="min-h-[120px]"
              />
            </div>
            <Button className="w-full sm:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Help Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Help Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Documentation</h3>
              <p className="text-sm text-gray-600">Comprehensive guides</p>
            </a>
            <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all">
              <Video className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Video Tutorials</h3>
              <p className="text-sm text-gray-600">Step-by-step videos</p>
            </a>
            <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all">
              <BookOpen className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Knowledge Base</h3>
              <p className="text-sm text-gray-600">Browse articles</p>
            </a>
            <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all">
              <MessageCircle className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Community Forum</h3>
              <p className="text-sm text-gray-600">Connect with users</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

