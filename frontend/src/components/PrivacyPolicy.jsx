import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Hero Section */}
      <div className="relative bg-[#032A24] overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="absolute -top-24 -right-24 w-96 h-96 text-[#C9A44B]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="/itqaan_logo.png" 
              alt="Itqaan" 
              className="h-12 md:h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#C9A44B]/20 text-[#C9A44B] text-xs font-medium">
              Shariah Compliant
            </span>
            <span className="text-[#B7C0BA] text-sm">Version 2.0</span>
            <span className="text-[#B7C0BA] text-sm">•</span>
            <span className="text-[#B7C0BA] text-sm">Effective: 15 August 2026</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[#032A24]/60 hover:text-[#032A24] transition-colors text-sm font-medium group"
        >
          
        
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10">
          {/* ISSC Badge */}
          <div className="flex items-start gap-4 p-4 mb-8 bg-gradient-to-r from-[#032A24]/5 to-transparent rounded-xl border-l-4 border-[#C9A44B]">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A44B] flex items-center justify-center">
              <span className="text-[#032A24] font-bold text-xs">ISSC</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#032A24]">Itqaan Shariah Supervisory Committee</p>
              <p className="text-xs text-[#032A24]/60">This Privacy Policy has been reviewed and approved for Shariah compliance.</p>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">Introduction</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              ITTQANIYUN LIMITED respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Itqaan platform, mobile application, website, and related services.
            </p>
            <p className="text-sm text-[#1A1A1A] leading-relaxed mt-2">
              This Privacy Policy applies to all users, including clients, vendors, leaders, and administrators. By using the platform, you consent to the data practices described in this policy.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-[#032A24] text-sm">1.1 Personal Information You Provide</p>
                <ul className="list-disc pl-6 text-sm text-[#1A1A1A]/80 space-y-1 mt-1">
                  <li>Account Information: Full name, phone number, email address, national ID, and PIN</li>
                  <li>Location Information: County, sub-county, ward, and physical address</li>
                  <li>Profile Information: Profile image, bio, business name, KRA PIN, and business registration number</li>
                  <li>KYC Information: Identification documents and passport photos for regulatory compliance</li>
                  <li>Payment Information: M-Pesa phone number and transaction history. Payment card details are never stored.</li>
                  <li>User Content: Reviews, ratings, messages, listings, and product descriptions</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[#032A24] text-sm">1.2 Information Automatically Collected</p>
                <ul className="list-disc pl-6 text-sm text-[#1A1A1A]/80 space-y-1 mt-1">
                  <li>Device Information: Device type, operating system, and unique device identifiers</li>
                  <li>Usage Data: App interactions, features used, pages viewed, and navigation patterns</li>
                  <li>Location Data: Approximate location based on IP address or GPS</li>
                  <li>Log Data: IP address, browser type, access times, and referring URLs</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[#032A24] text-sm">1.3 Information from Third Parties</p>
                <ul className="list-disc pl-6 text-sm text-[#1A1A1A]/80 space-y-1 mt-1">
                  <li>Payment Processors: Transaction status and payment confirmations</li>
                  <li>Verification Providers: Identity verification results for KYC compliance</li>
                  <li>Service Providers: Information from vendors, leaders, and service providers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">2. How We Use Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24] text-sm">Provide Services</p>
                <ul className="list-disc pl-4 text-xs text-[#1A1A1A]/80 space-y-0.5 mt-1">
                  <li>Create and manage accounts</li>
                  <li>Process transactions and payments</li>
                  <li>Facilitate bookings and orders</li>
                  <li>Enable P2P transfers and contributions</li>
                </ul>
              </div>
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24] text-sm">Communicate</p>
                <ul className="list-disc pl-4 text-xs text-[#1A1A1A]/80 space-y-0.5 mt-1">
                  <li>Send transaction confirmations</li>
                  <li>Provide customer support</li>
                  <li>Send service updates and alerts</li>
                </ul>
              </div>
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24] text-sm">Enhance & Improve</p>
                <ul className="list-disc pl-4 text-xs text-[#1A1A1A]/80 space-y-0.5 mt-1">
                  <li>Analyze usage patterns</li>
                  <li>Develop new features</li>
                  <li>Optimize performance</li>
                </ul>
              </div>
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24] text-sm">Legal & Compliance</p>
                <ul className="list-disc pl-4 text-xs text-[#1A1A1A]/80 space-y-0.5 mt-1">
                  <li>Comply with AML and KYC regulations</li>
                  <li>Prevent fraud and abuse</li>
                  <li>Enforce Terms and Conditions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">3. Legal Basis for Processing</h2>
            <div className="space-y-3 text-sm text-[#1A1A1A] leading-relaxed">
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24]">Contractual Necessity</p>
                <p className="text-xs text-[#1A1A1A]/70">Processing is necessary to perform the contract we have with you, including account creation and service delivery.</p>
              </div>
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24]">Legal Compliance</p>
                <p className="text-xs text-[#1A1A1A]/70">Processing is necessary to comply with legal obligations, including AML, KYC, and regulatory reporting.</p>
              </div>
              <div className="bg-[#FAFAF7] rounded-xl p-3">
                <p className="font-semibold text-[#032A24]">Legitimate Interests</p>
                <p className="text-xs text-[#1A1A1A]/70">Processing is necessary for our legitimate interests, including fraud prevention and service improvement.</p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">4. How We Share Your Information</h2>
            <div className="space-y-3 text-sm text-[#1A1A1A] leading-relaxed">
              <p><strong>With Service Providers:</strong> Payment processors, KYC verification providers, cloud service providers, and communication services.</p>
              <p><strong>With Other Users:</strong> Your name and contact details are shared with vendors for order fulfilment, with leaders for consultation bookings, and with mosque administrators for event registration.</p>
              <p><strong>For Legal Purposes:</strong> To comply with court orders, respond to regulator requests, and enforce our Terms.</p>
              <p><strong>With Your Consent:</strong> We may share your information with third parties when you provide explicit consent.</p>
              <p><strong>Shariah Supervisory Committee:</strong> Aggregated and anonymized data may be shared for audit and compliance purposes.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">5. Data Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Encryption', desc: 'Data is encrypted in transit and at rest' },
                { title: 'Access Controls', desc: 'Access restricted to authorized personnel only' },
                { title: 'Monitoring', desc: 'Continuous monitoring for security breaches' },
                { title: 'Regular Audits', desc: 'Security audits and penetration testing' },
                { title: 'PCI-DSS Compliance', desc: 'Payment data handled by compliant processors' },
                { title: 'Shariah Security', desc: 'Additional measures against Riba, Maysir, and Gharar' },
              ].map((item, i) => (
                <div key={i} className="bg-[#FAFAF7] rounded-xl p-3">
                  <p className="font-semibold text-[#032A24] text-sm">{item.title}</p>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">6. Data Retention</h2>
            <div className="space-y-3 text-sm text-[#1A1A1A] leading-relaxed">
              <p>We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Active Accounts:</strong> Data is retained while your account is active</li>
                <li><strong>Regulatory Requirements:</strong> AML and KYC records are retained for 7 years</li>
                <li><strong>Transaction Records:</strong> Financial transaction records are retained for 7 years</li>
                <li><strong>Legal Disputes:</strong> Data may be retained to resolve legal disputes</li>
              </ul>
              <p>Upon account deletion, your personal data will be deleted in accordance with this Privacy Policy and applicable law.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">7. Your Rights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Right to Access — Request a copy of your personal data',
                'Right to Rectification — Request correction of inaccurate data',
                'Right to Deletion — Request deletion of your personal data',
                'Right to Restriction — Request restriction of processing',
                'Right to Data Portability — Request transfer of your data',
                'Right to Object — Object to processing based on legitimate interests',
              ].map((right, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#FAFAF7] rounded-lg p-2.5">
                  <svg className="w-3.5 h-3.5 text-[#C9A44B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-[#1A1A1A]/80">{right}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#1A1A1A] mt-3">To exercise any of these rights, contact us at <strong className="text-[#032A24]">itqanllc@yahoo.com</strong>.</p>
          </div>

          {/* Section 8 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">8. Account Deletion</h2>
            <div className="space-y-3 text-sm text-[#1A1A1A] leading-relaxed">
              <p>You may delete your account at any time:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>In-App:</strong> Settings → Account → Delete Account</li>
                <li><strong>Email:</strong> Send a deletion request to itqanllc@yahoo.com</li>
              </ul>
              <div className="bg-[#032A24]/5 rounded-xl p-3 border border-[#032A24]/10">
                <p className="text-xs font-medium text-[#032A24]">Effect of Deletion</p>
                <ul className="list-disc pl-4 text-xs text-[#1A1A1A]/70 space-y-0.5 mt-1">
                  <li>Your account becomes inaccessible</li>
                  <li>Personal data is deleted, subject to legally required retention</li>
                  <li>Digital Will records are permanently erased</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">9. Children's Privacy</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              The Itqaan platform is not directed at children under 18 years of age. We do not knowingly collect personal data from children under 18. If we discover that we have collected data from a child under 18, we will delete it immediately. Regulated features including P2P, Takaful, Pension, Hajj and Umrah, and Digital Wills require users to be 18 and KYC-verified.
            </p>
          </div>

          {/* Section 10 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">10. International Data Transfers</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Your personal data may be transferred to and processed in countries outside your jurisdiction. We ensure that appropriate safeguards are in place, including standard contractual clauses and data processing agreements with service providers.
            </p>
          </div>

          {/* Section 11 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">11. Cookies and Tracking</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              We use cookies and similar tracking technologies to maintain your session and preferences, analyze usage patterns, and improve the platform. You can manage your cookie preferences through your browser or device settings.
            </p>
          </div>

          {/* Section 12 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">12. Third-Party Links</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              The platform may contain links to third-party websites or services. This Privacy Policy does not apply to third-party websites. We are not responsible for the privacy practices of third parties.
            </p>
          </div>

          {/* Section 13 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">13. Changes to This Policy</h2>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes through in-app notifications, email, or an updated effective date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </div>

          {/* Section 14 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#032A24] mb-3">14. Contact Us</h2>
            <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100 space-y-1">
              <p className="text-sm font-semibold text-[#032A24]">ITTQANIYUN LIMITED</p>
              <p className="text-xs text-[#1A1A1A]/70">Company No.: CLG-ABF6ZP</p>
              <p className="text-xs text-[#1A1A1A]/70">Email: itqanllc@yahoo.com</p>
              <p className="text-xs text-[#1A1A1A]/70">Phone: +254790211888</p>
              <p className="text-xs text-[#1A1A1A]/70">Postal Address: P.O Box 248, Ukunda, 80400</p>
              <p className="text-xs text-[#1A1A1A]/70">Physical Address: Itqaan House, Mombasa, Mombasa County, Kenya</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#032A24]/60">
              <div className="flex items-center gap-3">
                <img 
                  src="/itqaan_logo.png" 
                  alt="Itqaan" 
                  className="h-6 w-auto object-contain"
                />
                <span>|</span>
                <span>ITTQANIYUN LIMITED</span>
                <span>|</span>
                <span>Version 2.0</span>
              </div>
              <span>Effective: 15 August 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;