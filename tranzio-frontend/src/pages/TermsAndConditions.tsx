import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileText, Calendar, Users, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 flex-shrink-0 hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Login</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Terms and Conditions</h1>
                <p className="text-xs sm:text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg border border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              Tranzio Terms and Conditions
            </CardTitle>
            <p className="text-blue-50 mt-2">
              By using Tranzio, you agree to be bound by these terms and conditions.
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                1. Introduction
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Tranzio, Nigeria's leading secure escrow platform. These Terms and Conditions 
                  ("Terms") govern your use of our platform, services, and any related applications 
                  (collectively, the "Service") operated by Tranzio Limited ("we," "us," or "our").
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                  with any part of these terms, then you may not access the Service.
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                2. Service Description
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Tranzio provides a secure escrow platform that facilitates safe transactions between buyers 
                  and sellers by holding funds in trust until both parties fulfill their obligations. Our 
                  services include:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Secure escrow transaction management</li>
                  <li>Payment processing and fund holding</li>
                  <li>Dispute resolution services</li>
                  <li>Identity verification and KYC services</li>
                  <li>Real-time messaging and communication tools</li>
                  <li>Transaction monitoring and reporting</li>
                </ul>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                3. User Accounts and Registration
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  To use our Service, you must create an account and provide accurate, complete, and 
                  up-to-date information. You are responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Providing valid identification documents for verification</li>
                  <li>Keeping your contact information current</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms or 
                  engage in fraudulent activities.
                </p>
              </div>
            </section>

            {/* Escrow Services */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                4. Escrow Services and Transaction Terms
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-medium text-gray-800 mb-3">4.1 Transaction Process</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Buyer initiates transaction and deposits funds into escrow</li>
                  <li>Seller is notified and can accept or decline the transaction</li>
                  <li>Funds are held securely until transaction completion</li>
                  <li>Funds are released upon mutual agreement or dispute resolution</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-3">4.2 Fees and Charges</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Transaction fees are clearly displayed before confirmation</li>
                  <li>Fees are deducted from the transaction amount</li>
                  <li>Refund policies apply as per our refund terms</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-3">4.3 Dispute Resolution</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Disputes must be reported within 7 days of transaction completion</li>
                  <li>We provide mediation services to resolve disputes fairly</li>
                  <li>Final decisions are binding on all parties</li>
                </ul>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                5. Prohibited Activities
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree not to use our Service for any of the following prohibited activities:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Money laundering or terrorist financing</li>
                  <li>Fraudulent or illegal transactions</li>
                  <li>Violation of any applicable laws or regulations</li>
                  <li>Attempting to circumvent security measures</li>
                  <li>Providing false or misleading information</li>
                  <li>Interfering with other users' transactions</li>
                  <li>Creating multiple accounts to avoid restrictions</li>
                  <li>Any activity that could harm our platform or users</li>
                </ul>
              </div>
            </section>

            {/* Privacy and Data Protection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                6. Privacy and Data Protection
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are committed to protecting your privacy and personal data. Our Privacy Policy 
                  explains how we collect, use, and protect your information. By using our Service, 
                  you consent to our data practices as described in our Privacy Policy.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>We collect only necessary information for service provision</li>
                  <li>Your data is encrypted and stored securely</li>
                  <li>We comply with applicable data protection laws</li>
                  <li>You have rights regarding your personal data</li>
                </ul>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                7. Limitation of Liability
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  To the maximum extent permitted by law, Tranzio shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages arising from third-party actions</li>
                  <li>System downtime or technical issues beyond our control</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Our total liability shall not exceed the amount of fees paid by you in the 
                  12 months preceding the claim.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                8. Disclaimers
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our Service is provided "as is" without warranties of any kind. We do not guarantee:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Uninterrupted or error-free service</li>
                  <li>Compatibility with all devices or browsers</li>
                  <li>Accuracy of third-party information</li>
                  <li>Successful completion of all transactions</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                9. Termination
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Either party may terminate this agreement at any time. We may suspend or terminate 
                  your account immediately if you:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Violate these Terms and Conditions</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Fail to pay required fees</li>
                  <li>Provide false information</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Upon termination, you must cease all use of our Service, and we will process 
                  any pending transactions according to our policies.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                10. Governing Law and Disputes
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms are governed by the laws of the Federal Republic of Nigeria. Any 
                  disputes arising from these Terms or your use of our Service shall be resolved 
                  through:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Good faith negotiations between parties</li>
                  <li>Mediation through a neutral third party</li>
                  <li>Arbitration in accordance with Nigerian arbitration laws</li>
                  <li>Courts of competent jurisdiction in Nigeria</li>
                </ul>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                11. Changes to Terms
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of 
                  significant changes through email or platform notifications. Continued use of our 
                  Service after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                12. Contact Information
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><strong>Email:</strong> legal@tranzio.com</p>
                  <p className="text-gray-700"><strong>Phone:</strong> +234 (0) 800 TRANZIO</p>
                  <p className="text-gray-700"><strong>Address:</strong> Tranzio Limited, Lagos, Nigeria</p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  <p>© {new Date().getFullYear()} Tranzio Limited. All rights reserved.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link to="/privacy-policy">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Privacy Policy
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
