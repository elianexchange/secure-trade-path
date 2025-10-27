import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileText, Calendar, Users, Eye, Lock, Database, Globe, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link to="/terms-and-conditions">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Terms</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Privacy Policy</h1>
                <p className="text-xs sm:text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              Tranzio Privacy Policy
            </CardTitle>
            <p className="text-green-100 mt-2">
              We are committed to protecting your privacy and personal information.
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                1. Introduction
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  At Tranzio Limited ("we," "us," or "our"), we are committed to protecting your privacy 
                  and personal information. This Privacy Policy explains how we collect, use, disclose, 
                  and safeguard your information when you use our escrow platform and related services.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By using our Service, you consent to the data practices described in this Privacy Policy. 
                  If you do not agree with the terms of this Privacy Policy, please do not use our Service.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                2. Information We Collect
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We collect personal information that you voluntarily provide to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Name, email address, and phone number</li>
                  <li>Date of birth and gender</li>
                  <li>Address and location information</li>
                  <li>Government-issued identification documents</li>
                  <li>Bank account and payment information</li>
                  <li>Profile pictures and other images</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Transaction Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Transaction details and history</li>
                  <li>Payment amounts and methods</li>
                  <li>Communication records and messages</li>
                  <li>Dispute and resolution information</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system and device identifiers</li>
                  <li>Usage patterns and analytics data</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                3. How We Use Your Information
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use your information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide and maintain our escrow services</li>
                  <li>Process transactions and payments</li>
                  <li>Verify your identity and prevent fraud</li>
                  <li>Communicate with you about your account</li>
                  <li>Send important updates and notifications</li>
                  <li>Improve our services and user experience</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Protect our rights and prevent abuse</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                4. Information Sharing and Disclosure
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may 
                  share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To complete transactions you have authorized</li>
                  <li>With service providers who assist our operations</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a business transfer or merger</li>
                  <li>With law enforcement when required by law</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600" />
                5. Data Security
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your 
                  personal information against unauthorized access, alteration, disclosure, or destruction:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure servers and databases</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  However, no method of transmission over the internet or electronic storage is 
                  100% secure. While we strive to protect your information, we cannot guarantee 
                  absolute security.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                6. Data Retention
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  When we no longer need your information, we will securely delete or anonymize it 
                  in accordance with our data retention policies.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                7. Your Privacy Rights
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                8. Cookies and Tracking Technologies
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience and analyze 
                  usage patterns:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for basic functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Security Cookies:</strong> Protect against fraud and abuse</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookie settings through your browser preferences, but disabling 
                  certain cookies may affect the functionality of our Service.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                9. Third-Party Services
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our Service may contain links to third-party websites or integrate with third-party 
                  services. We are not responsible for the privacy practices of these third parties. 
                  We encourage you to review their privacy policies before providing any information.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Third-party services we may use include payment processors, identity verification 
                  services, and analytics providers.
                </p>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                10. International Data Transfers
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your 
                  country of residence. We ensure that such transfers comply with applicable data 
                  protection laws and implement appropriate safeguards to protect your information.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                11. Children's Privacy
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Our Service is not intended for children under 18 years of age. We do not knowingly 
                  collect personal information from children under 18. If we become aware that we have 
                  collected personal information from a child under 18, we will take steps to delete 
                  such information promptly.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                12. Changes to This Privacy Policy
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  material changes by posting the new Privacy Policy on this page and updating the 
                  "Last updated" date. We encourage you to review this Privacy Policy periodically 
                  for any changes.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                13. Contact Us
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><strong>Email:</strong> privacy@tranzio.com</p>
                  <p className="text-gray-700"><strong>Phone:</strong> +234 (0) 800 TRANZIO</p>
                  <p className="text-gray-700"><strong>Address:</strong> Tranzio Limited, Lagos, Nigeria</p>
                  <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@tranzio.com</p>
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
                  <Link to="/terms-and-conditions">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Terms & Conditions
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm" className="w-full sm:w-auto">
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
