import React from 'react';
import { Link } from 'react-router-dom';

// This component provides structured internal linking for better SEO
// It helps Google understand the relationship between pages
export const SEOLinks: React.FC = () => {
  return (
    <div className="hidden" aria-hidden="true">
      {/* These links are hidden but help with SEO structure */}
      <Link to="/login" title="Login to Tranzio Escrow Platform">
        Login to Tranzio Escrow Platform
      </Link>
      <Link to="/signup" title="Sign Up for Secure Escrow Trading">
        Sign Up for Secure Escrow Trading
      </Link>
      <Link to="/app/dashboard" title="Tranzio Dashboard - Manage Transactions">
        Tranzio Dashboard - Manage Transactions
      </Link>
      <Link to="/app/create-transaction" title="Create New Escrow Transaction">
        Create New Escrow Transaction
      </Link>
      <Link to="/app/join-transaction" title="Join Existing Escrow Transaction">
        Join Existing Escrow Transaction
      </Link>
      <Link to="/app/transactions" title="View All Your Escrow Transactions">
        View All Your Escrow Transactions
      </Link>
      <Link to="/app/wallet" title="Tranzio Wallet - Manage Your Funds">
        Tranzio Wallet - Manage Your Funds
      </Link>
      <Link to="/app/disputes" title="Resolve Escrow Disputes">
        Resolve Escrow Disputes
      </Link>
      <Link to="/app/profile" title="Manage Your Tranzio Profile">
        Manage Your Tranzio Profile
      </Link>
      <Link to="/terms-and-conditions" title="Tranzio Terms and Conditions">
        Tranzio Terms and Conditions
      </Link>
      <Link to="/privacy-policy" title="Tranzio Privacy Policy">
        Tranzio Privacy Policy
      </Link>
    </div>
  );
};

// Breadcrumb component for better navigation structure
export const Breadcrumbs: React.FC<{ items: Array<{ label: string; href?: string }> }> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {item.href ? (
              <Link to={item.href} className="hover:text-blue-600">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
