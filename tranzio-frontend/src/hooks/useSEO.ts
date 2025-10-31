import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DOMAIN = 'https://tranzzio.com';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; item: string }>;
}

const defaultSEO: SEOProps = {
  title: "Tranzio - Nigeria's #1 Secure Escrow Platform | Buy & Sell with Zero Risk",
  description: "Nigeria's leading secure escrow platform. Protect your transactions with bank-grade security, instant payments, and 24/7 support. Join 840,000+ trusted users and 250+ marketplace partners. Start trading safely today!",
  keywords: "escrow Nigeria, secure trading platform, online escrow service, buyer protection, seller protection, secure payments Nigeria, escrow trading, safe transactions, digital escrow, fintech Nigeria, secure marketplace, transaction protection, online trading security, escrow platform, secure payments, trading platform Nigeria, fintech escrow, digital payments, secure commerce, transaction security, safe online shopping, secure money transfer, escrow service Lagos, secure trading app, online payment protection, digital escrow Nigeria, secure marketplace platform, transaction security Nigeria, safe online transactions, escrow payment system",
  ogImage: `${DOMAIN}/og-image.png?v=20241201-1`,
  twitterImage: `${DOMAIN}/og-image.png?v=20241201-1`,
};

const seoData: Record<string, Partial<SEOProps>> = {
  '/': defaultSEO,
  '/login': {
    title: "Login to Tranzio - Secure Escrow Platform | Sign In",
    description: "Sign in to your Tranzio account. Access your secure escrow transactions, wallet, and trading dashboard. Join 840,000+ trusted users.",
    keywords: "login Tranzio, sign in escrow, secure trading login, Tranzio account, escrow platform login",
    ogTitle: "Login to Tranzio - Access Your Secure Escrow Account",
    ogDescription: "Sign in to Tranzio and manage your secure escrow transactions. Fast, secure login to Nigeria's leading escrow platform.",
  },
  '/signup': {
    title: "Sign Up for Tranzio - Create Your Secure Escrow Account | Free Registration",
    description: "Create your free Tranzio account in minutes. Start secure trading with buyer and seller protection. Join Nigeria's leading escrow platform.",
    keywords: "sign up Tranzio, create account, escrow registration, secure trading signup, free escrow account",
    ogTitle: "Sign Up for Tranzio - Start Secure Trading Today",
    ogDescription: "Join Tranzio and start trading securely. Free registration with buyer and seller protection. Nigeria's trusted escrow platform.",
  },
  '/app/dashboard': {
    title: "Dashboard - Tranzio Escrow Platform | Manage Your Transactions",
    description: "Access your Tranzio dashboard to manage transactions, view wallet balance, and track your secure trading activity. Complete transaction overview.",
    keywords: "Tranzio dashboard, transaction management, escrow dashboard, trading overview, secure trading dashboard",
    ogTitle: "Tranzio Dashboard - Manage Your Escrow Transactions",
    ogDescription: "View and manage all your secure escrow transactions in one place. Track payments, shipments, and transaction status.",
  },
  '/app/create-transaction': {
    title: "Create Transaction - Tranzio Escrow | Start Secure Trading",
    description: "Create a new secure escrow transaction on Tranzio. Protect your trades with buyer and seller protection. Start trading safely today.",
    keywords: "create transaction, start escrow, secure trading, new transaction, escrow transaction creator",
    ogTitle: "Create Secure Escrow Transaction - Tranzio",
    ogDescription: "Start a new secure escrow transaction with full buyer and seller protection. Simple process, maximum security.",
  },
  '/app/join-transaction': {
    title: "Join Transaction - Tranzio Escrow | Participate in Secure Trading",
    description: "Join an existing escrow transaction on Tranzio. Participate in secure trading with full buyer and seller protection.",
    keywords: "join transaction, participate escrow, secure trading join, transaction participation, join escrow trade",
    ogTitle: "Join Secure Escrow Transaction - Tranzio",
    ogDescription: "Join existing escrow transactions securely. Buyer and seller protection guaranteed on all transactions.",
  },
  '/app/transactions': {
    title: "My Transactions - Tranzio Escrow | View All Your Trades",
    description: "View and manage all your Tranzio escrow transactions. Track transaction status, payments, and trading history in one place.",
    keywords: "my transactions, transaction history, escrow trades, trading records, view transactions",
    ogTitle: "My Transactions - Tranzio Escrow Platform",
    ogDescription: "View all your escrow transactions in one place. Track status, payments, and trading history.",
  },
  '/app/wallet': {
    title: "Wallet - Tranzio Escrow | Manage Your Funds Securely",
    description: "Manage your Tranzio wallet securely. View balance, transaction history, and fund your account for secure escrow trading.",
    keywords: "Tranzio wallet, manage funds, secure wallet, escrow payments, digital wallet",
    ogTitle: "Tranzio Wallet - Manage Your Escrow Funds",
    ogDescription: "Secure wallet for managing your escrow funds. View balance, transaction history, and fund your account.",
  },
  '/app/disputes': {
    title: "Disputes - Tranzio Escrow | Resolve Trading Issues",
    description: "Manage and resolve escrow disputes on Tranzio. Get fair resolution for trading issues with our dispute resolution system.",
    keywords: "escrow disputes, resolve issues, trading disputes, dispute resolution, escrow conflict",
    ogTitle: "Dispute Resolution - Tranzio Escrow",
    ogDescription: "Fair and fast dispute resolution for escrow transactions. Expert mediators ensure quick resolution.",
  },
  '/app/profile': {
    title: "Profile - Tranzio Escrow | Manage Your Account",
    description: "Manage your Tranzio profile and account settings. Update personal information, security settings, and trading preferences.",
    keywords: "Tranzio profile, account settings, user profile, escrow account, account management",
    ogTitle: "Account Profile - Tranzio Escrow",
    ogDescription: "Manage your Tranzio account settings, security preferences, and personal information.",
  },
  '/app/help': {
    title: "Help & Support - Tranzio Escrow | Get Help with Your Account",
    description: "Get help with your Tranzio account. Find answers to common questions, contact support, or browse our help articles.",
    keywords: "Tranzio help, escrow support, customer service, help center, escrow help",
    ogTitle: "Help & Support - Tranzio Escrow Platform",
    ogDescription: "Get help with your Tranzio account. Comprehensive FAQ, contact support, and help resources.",
  },
  '/terms-and-conditions': {
    title: "Terms and Conditions - Tranzio Escrow Platform",
    description: "Read Tranzio's terms and conditions for using our secure escrow platform. Understand your rights and responsibilities.",
    keywords: "terms conditions, Tranzio terms, escrow terms, platform terms, legal terms",
  },
  '/privacy-policy': {
    title: "Privacy Policy - Tranzio Escrow | Your Data Protection",
    description: "Learn how Tranzio protects your privacy and personal data. Our commitment to secure and private escrow trading.",
    keywords: "privacy policy, data protection, Tranzio privacy, secure data, privacy protection",
  },
};

export const useSEO = (customSEO?: Partial<SEOProps>) => {
  const location = useLocation();
  
  useEffect(() => {
    const currentPath = location.pathname;
    const pathSEO = seoData[currentPath] || {};
    const seo: SEOProps = { 
      ...defaultSEO, 
      ...pathSEO, 
      ...customSEO 
    };
    
    // Update document title
    if (seo.title) {
      document.title = seo.title;
    }
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    if (seo.description) {
      metaDescription.setAttribute('content', seo.description);
    }
    
    // Update meta keywords
    if (seo.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', seo.keywords);
    }
    
    // Update canonical URL
    const canonicalUrl = seo.canonical || `${DOMAIN}${currentPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
    
    // Update Open Graph tags
    const ogTitle = seo.ogTitle || seo.title || defaultSEO.title;
    const ogDescription = seo.ogDescription || seo.description || defaultSEO.description;
    const ogImage = seo.ogImage || defaultSEO.ogImage;
    const ogUrl = seo.ogUrl || `${DOMAIN}${currentPath}`;
    
    const updateOGMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateOGMeta('og:title', ogTitle);
    updateOGMeta('og:description', ogDescription);
    updateOGMeta('og:image', ogImage!);
    updateOGMeta('og:url', ogUrl);
    
    // Update Twitter Card tags
    const twitterTitle = seo.twitterTitle || ogTitle;
    const twitterDescription = seo.twitterDescription || ogDescription;
    const twitterImage = seo.twitterImage || ogImage!;
    
    const updateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateTwitterMeta('twitter:title', twitterTitle);
    updateTwitterMeta('twitter:description', twitterDescription);
    updateTwitterMeta('twitter:image', twitterImage);
    
    // Add structured data
    if (seo.structuredData) {
      let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-seo]');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        structuredDataScript.setAttribute('data-seo', 'true');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(seo.structuredData);
    }
    
    // Add breadcrumb structured data
    if (seo.breadcrumbs && seo.breadcrumbs.length > 0) {
      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": seo.breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.item
        }))
      };
      
      let breadcrumbScript = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.setAttribute('type', 'application/ld+json');
        breadcrumbScript.setAttribute('data-breadcrumb', 'true');
        document.head.appendChild(breadcrumbScript);
      }
      breadcrumbScript.textContent = JSON.stringify(breadcrumbList);
    }
    
  }, [location.pathname, customSEO]);
  
  return seoData[location.pathname] || defaultSEO;
};
