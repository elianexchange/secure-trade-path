import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
}

const defaultSEO: SEOData = {
  title: "Tranzio - Nigeria's #1 Secure Escrow Platform | Buy & Sell with Zero Risk",
  description: "Nigeria's leading secure escrow platform. Protect your transactions with bank-grade security, instant payments, and 24/7 support. Join 840,000+ trusted users.",
  keywords: "escrow Nigeria, secure trading platform, online escrow service, buyer protection, seller protection"
};

const seoData: Record<string, SEOData> = {
  '/': defaultSEO,
  '/login': {
    title: "Login to Tranzio - Secure Escrow Platform | Sign In",
    description: "Sign in to your Tranzio account. Access your secure escrow transactions, wallet, and trading dashboard. Join 840,000+ trusted users.",
    keywords: "login Tranzio, sign in escrow, secure trading login, Tranzio account"
  },
  '/signup': {
    title: "Sign Up for Tranzio - Create Your Secure Escrow Account | Free Registration",
    description: "Create your free Tranzio account in minutes. Start secure trading with buyer and seller protection. Join Nigeria's leading escrow platform.",
    keywords: "sign up Tranzio, create account, escrow registration, secure trading signup"
  },
  '/app/dashboard': {
    title: "Dashboard - Tranzio Escrow Platform | Manage Your Transactions",
    description: "Access your Tranzio dashboard to manage transactions, view wallet balance, and track your secure trading activity. Complete transaction overview.",
    keywords: "Tranzio dashboard, transaction management, escrow dashboard, trading overview"
  },
  '/app/create-transaction': {
    title: "Create Transaction - Tranzio Escrow | Start Secure Trading",
    description: "Create a new secure escrow transaction on Tranzio. Protect your trades with buyer and seller protection. Start trading safely today.",
    keywords: "create transaction, start escrow, secure trading, new transaction"
  },
  '/app/join-transaction': {
    title: "Join Transaction - Tranzio Escrow | Participate in Secure Trading",
    description: "Join an existing escrow transaction on Tranzio. Participate in secure trading with full buyer and seller protection.",
    keywords: "join transaction, participate escrow, secure trading join, transaction participation"
  },
  '/app/transactions': {
    title: "My Transactions - Tranzio Escrow | View All Your Trades",
    description: "View and manage all your Tranzio escrow transactions. Track transaction status, payments, and trading history in one place.",
    keywords: "my transactions, transaction history, escrow trades, trading records"
  },
  '/app/wallet': {
    title: "Wallet - Tranzio Escrow | Manage Your Funds Securely",
    description: "Manage your Tranzio wallet securely. View balance, transaction history, and fund your account for secure escrow trading.",
    keywords: "Tranzio wallet, manage funds, secure wallet, escrow payments"
  },
  '/app/disputes': {
    title: "Disputes - Tranzio Escrow | Resolve Trading Issues",
    description: "Manage and resolve escrow disputes on Tranzio. Get fair resolution for trading issues with our dispute resolution system.",
    keywords: "escrow disputes, resolve issues, trading disputes, dispute resolution"
  },
  '/app/profile': {
    title: "Profile - Tranzio Escrow | Manage Your Account",
    description: "Manage your Tranzio profile and account settings. Update personal information, security settings, and trading preferences.",
    keywords: "Tranzio profile, account settings, user profile, escrow account"
  },
  '/terms-and-conditions': {
    title: "Terms and Conditions - Tranzio Escrow Platform",
    description: "Read Tranzio's terms and conditions for using our secure escrow platform. Understand your rights and responsibilities.",
    keywords: "terms conditions, Tranzio terms, escrow terms, platform terms"
  },
  '/privacy-policy': {
    title: "Privacy Policy - Tranzio Escrow | Your Data Protection",
    description: "Learn how Tranzio protects your privacy and personal data. Our commitment to secure and private escrow trading.",
    keywords: "privacy policy, data protection, Tranzio privacy, secure data"
  }
};

export const useSEO = (customSEO?: Partial<SEOData>) => {
  const location = useLocation();
  
  useEffect(() => {
    const currentPath = location.pathname;
    const seo = { ...defaultSEO, ...seoData[currentPath], ...customSEO };
    
    // Update document title
    document.title = seo.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description);
    }
    
    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && seo.keywords) {
      metaKeywords.setAttribute('content', seo.keywords);
    }
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://tranzzio.netlify.app${currentPath}`);
    }
    
    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', seo.title);
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', seo.description);
    }
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', seo.title);
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', seo.description);
    }
    
  }, [location.pathname, customSEO]);
  
  return seoData[location.pathname] || defaultSEO;
};
