import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = ({ isModal = false }) => {
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'definitions', title: 'Definitions' },
    { id: 'eligibility', title: 'Eligibility & Age Restrictions' },
    { id: 'role', title: "Itqaan's Role & Regulatory Status" },
    { id: 'shariah', title: 'Shariah Governance' },
    { id: 'prohibited', title: 'Prohibited Activities' },
    { id: 'services', title: 'Service-Specific Terms' },
    { id: 'payments', title: 'Payments & Billing' },
    { id: 'content', title: 'User Content & Moderation' },
    { id: 'deletion', title: 'Account Deletion & Data Rights' },
    { id: 'privacy', title: 'Privacy & Data Safety' },
    { id: 'compliance', title: 'Legal Compliance' },
    { id: 'intellectual', title: 'Intellectual Property' },
    { id: 'disclaimers', title: 'Disclaimers' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'google', title: 'Google Play Notices' },
    { id: 'governing', title: 'Governing Law & Disputes' },
    { id: 'contact', title: 'Contact Information' },
    { id: 'acknowledgement', title: 'Acknowledgement' },
  ];

  return (
    <div className={`min-h-screen ${!isModal ? 'bg-[#FAFAF7]' : ''}`}>
      {/* Hero Section - Hidden in Modal */}
      {!isModal && (
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
              Terms of Service
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
      )}

      {/* Back Button - Hidden in Modal */}
      {!isModal && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[#032A24]/60 hover:text-[#032A24] transition-colors text-sm font-medium group"
          >
            
        
          </Link>
        </div>
      )}

      {/* Content */}
      <div className={`${!isModal ? 'max-w-6xl mx-auto px-4 sm:px-6 pb-16' : ''}`}>
        <div className={`${!isModal ? 'grid grid-cols-1 lg:grid-cols-4 gap-8' : ''}`}>
          {/* Sidebar - Hidden in Modal */}
          {!isModal && (
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-[#032A24] mb-3">Contents</h3>
                <nav className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C9A44B]/30">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block text-xs py-1.5 px-2 rounded-lg transition-all duration-200 ${
                        activeSection === section.id 
                          ? 'text-[#C9A44B] bg-[#C9A44B]/10 font-medium' 
                          : 'text-[#032A24]/70 hover:text-[#032A24] hover:bg-[#032A24]/5'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={!isModal ? 'lg:col-span-3' : ''}>
            <div className={`${!isModal ? 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10' : ''}`}>
              {/* ISSC Badge */}
              <div className="flex items-start gap-4 p-4 mb-8 bg-gradient-to-r from-[#032A24]/5 to-transparent rounded-xl border-l-4 border-[#C9A44B]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A44B] flex items-center justify-center">
                  <span className="text-[#032A24] font-bold text-xs">ISSC</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#032A24]">Itqaan Shariah Supervisory Committee (ISSC)</p>
                  <p className="text-xs text-[#032A24]/60">All services, products, and transactions are reviewed and approved for Shariah compliance.</p>
                </div>
              </div>

              {/* All sections - same as before */}
              <div id="acceptance" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">1. Acceptance of Terms</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p>1.1 These Terms and Conditions constitute a legally binding agreement between you and ITTQANIYUN LIMITED governing your access to and use of the Itqaan platform, mobile application, website, and all related services.</p>
                  <p>1.2 By downloading, installing, accessing, or using the platform, you confirm that you have read, understood, and agree to be bound by these Terms, the Privacy Policy, any in-app disclosures, and any service-specific terms presented to you.</p>
                  <p>1.3 If you do not agree to these Terms, you must not download, access, or use the platform. Your only remedy is to cease use and delete the application from your device.</p>
                  <div className="bg-[#032A24]/5 rounded-xl p-4 border border-[#032A24]/10">
                    <p className="text-xs font-medium text-[#032A24]">Order of Precedence</p>
                    <ul className="text-xs text-[#032A24]/70 mt-1 space-y-0.5 list-disc pl-4">
                      <li>Mandatory local consumer and financial protection law</li>
                      <li>Google Play and Apple App Store terms</li>
                      <li>Service-specific terms accepted in-app</li>
                      <li>These Terms of Service</li>
                      <li>Privacy Policy</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div id="definitions" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">2. Definitions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">Platform</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">The Itqaan software, features, and services.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">Services</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">All features including Sadaqa, Zakat, HalalStay, Halal E-Commerce, Utility Payments, ItqaanPension, Find a Scholar, Halal Restaurants, Dial a Free Hearse & Shroud, P2P, Hajj & Umrah, Takaful, and Digital Wills.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">Provider</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">Any third party offering products or services through the platform.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">Shariah</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">Islamic law derived from the Qur'an, authentic Sunnah, and established Islamic jurisprudence.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">SSB</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">Shariah Supervisory Board — the independent board of qualified Shariah scholars appointed by Itqaan.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3">
                    <p className="font-semibold text-[#032A24]">Service Fee</p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-0.5">The disclosed fee charged for facilitation, listing, access, or premium features.</p>
                  </div>
                </div>
              </div>

              <div id="eligibility" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">3. Eligibility & Age Restrictions</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>3.1</strong> You must be at least 18 years old or the age of legal majority in your jurisdiction to create an account. The platform is not directed at children.</p>
                  <p><strong>3.2</strong> Access to regulated features including P2P, Takaful, ItqaanPension, Zakat disbursements, Hajj and Umrah facilitation, and Digital Wills is restricted to verified users aged 18 and above who have completed identity verification.</p>
                  <p><strong>3.3</strong> You must provide accurate, current, and complete information and update it promptly. You are responsible for safeguarding your credentials and for all activity on your account.</p>
                  <p><strong>3.4</strong> You may not create multiple accounts, impersonate any person, or use another person's identity or payment instruments.</p>
                  <p><strong>3.5</strong> You represent and warrant that all funds you transact through the platform originate from lawful, Halal sources.</p>
                </div>
              </div>

              <div id="role" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">4. Itqaan's Role & Regulatory Status</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>4.1</strong> Itqaan is a technology and facilitation platform. It is not a bank, payment institution, e-money issuer, money transmitter, investment adviser, broker-dealer, insurer, Takaful operator, pension fund manager, trustee, travel agency, funeral director, law firm, charity, issuer of fatwas, or executor of wills.</p>
                  <div className="bg-[#032A24]/5 rounded-xl p-4 border border-[#032A24]/10">
                    <p className="text-sm font-medium text-[#032A24]">Client Funds Policy</p>
                    <p className="text-sm text-[#032A24]/70 mt-1">Itqaan does not hold, pool, custody, manage, invest, or take possession of client funds at any time. All payments for services are transmitted directly to providers or beneficiaries through licensed, regulated third-party payment processors. Itqaan earns no interest on any funds.</p>
                  </div>
                  <p><strong>4.3</strong> Revenue consists solely of disclosed Service Fees. No income is derived from Riba, Maysir, Gharar-based contracts, or any Haram activity.</p>
                  <p><strong>4.4</strong> Itqaan facilitates transactions but does not assume the obligations of providers. Contracts for services are formed strictly between you and the provider.</p>
                </div>
              </div>

              <div id="shariah" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">5. Shariah Governance</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>5.1</strong> Itqaan appoints an independent Shariah Supervisory Board of qualified scholars responsible for:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Reviewing and approving all services, product structures, fee models, and provider categories</li>
                    <li>Auditing ongoing Shariah compliance of Itqaan and listed providers</li>
                    <li>Issuing Shariah opinions on disputed matters of compliance</li>
                    <li>Directing purification or remediation where non-compliance is discovered</li>
                  </ul>
                  <p><strong>5.2</strong> Every product, service, provider, listing, and transaction on the platform must be Halal. Itqaan applies a direct and indirect prohibition standard.</p>
                  <p><strong>5.3</strong> Itqaan may require providers to obtain certification from recognized Halal or Shariah audit bodies and submit to periodic audits.</p>
                  <p><strong>5.4</strong> If Itqaan discovers it has received any fee traceable to a non-compliant transaction, that fee shall be purified under board direction.</p>
                  <p><strong>5.5</strong> You agree to use the platform exclusively for Halal and lawful purposes.</p>
                </div>
              </div>

              <div id="prohibited" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">6. Prohibited Activities</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>6.1</strong> The following are strictly prohibited on or through the platform:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'Riba in any form',
                      'Maysir including gambling and lotteries',
                      'Gharar-laden contracts',
                      'Alcohol and intoxicants',
                      'Pork and non-Halal meat',
                      'Adult content and pornography',
                      'Conventional non-Shariah-compliant insurance',
                      'Weapons and ammunition',
                      'Counterfeit or stolen goods',
                      'Money laundering and terrorism financing',
                      'Human trafficking and forced labour',
                      'Hate speech and incitement'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#032A24]/5 rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-xs text-[#1A1A1A]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p><strong>6.2</strong> P2P transfers may not be used for payment for Haram goods or services, interest-bearing loans, or commercial reselling outside Halal E-Commerce.</p>
                  <p><strong>6.3</strong> You must not attempt to disguise, split, re-label, or otherwise structure any activity to evade these prohibitions. Itqaan employs automated screening and human review to detect circumvention.</p>
                </div>
              </div>

              <div id="services" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">7. Service-Specific Terms</h2>
                <div className="space-y-4">
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-[#032A24] text-sm mb-2">7.1 Sadaqa & Zakat</h3>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Donations are transmitted directly to verified charitable organizations through regulated processors.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan does not solicit, pool, or intermediate charitable funds.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> The Zakat calculator provides estimates only. Consult a qualified scholar for definitive rulings.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Donations are non-refundable once transmitted.</li>
                    </ul>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-[#032A24] text-sm mb-2">7.2 P2P Transfers</h3>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Available only to KYC-verified users through licensed processors.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Transfers must be for lawful, Halal purposes. Any Qard must be repaid in equal amount without increase.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan cooperates with law enforcement and regulators on suspicious activity.</li>
                    </ul>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-[#032A24] text-sm mb-2">7.3 Digital Wills</h3>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> A documentation and storage tool to record your Islamic estate intentions.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> A digital record may not be legally binding. Consult a licensed lawyer for enforceability.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan is not an executor, trustee, probate service, or law firm.</li>
                    </ul>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-[#032A24] text-sm mb-2">7.4 ItqaanPension</h3>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> A referral and information feature only. Itqaan is not a pension provider.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Values of investments can go down as well as up. Past performance is not indicative of future results.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan does not guarantee returns, capital, or suitability. Obtain independent advice.</li>
                    </ul>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-[#032A24] text-sm mb-2">7.5 Takaful</h3>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan refers users to licensed Shariah-compliant Takaful operators only.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Products must be structured on Tabarru', Wakalah, or Mudarabah.</li>
                      <li className="text-xs text-[#1A1A1A]/80 flex gap-2"><span className="text-[#C9A44B]">•</span> Itqaan is not an operator, underwriter, or claims handler.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div id="payments" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">8. Payments & Billing</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>8.1</strong> Digital Products purchased in-app on Android are billed exclusively through Google Play Billing.</p>
                  <p><strong>8.2</strong> Real-World Services are processed through licensed third-party payment processors integrated into the platform.</p>
                  <p><strong>8.3</strong> All Service Fees are displayed before you confirm any transaction. No hidden charges.</p>
                  <p><strong>8.4</strong> Subscriptions renew automatically unless cancelled at least 24 hours before renewal via your Google Play account settings.</p>
                  <p><strong>8.5</strong> Digital Products follow Google Play's refund policy. Real-World Services follow the provider's disclosed refund policy. Donations are non-refundable.</p>
                </div>
              </div>

              <div id="content" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">9. User Content & Moderation</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>9.1</strong> Rules of conduct for listings, reviews, photos, and messages are published inside the platform.</p>
                  <p><strong>9.2</strong> You grant Itqaan a worldwide, non-exclusive, royalty-free licence to host, display, reproduce, adapt, and distribute your content solely to operate and improve the platform. You retain ownership.</p>
                  <p><strong>9.3</strong> Itqaan operates active moderation including automated screening, keyword filtering, and human review of flagged content.</p>
                  <p><strong>9.4</strong> The platform provides a report function on every listing, review, message, and user profile, and a block function restricting communication.</p>
                  <p><strong>9.5</strong> Accounts repeatedly posting prohibited content are suspended or terminated permanently.</p>
                </div>
              </div>

              <div id="deletion" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">10. Account Deletion & Data Rights</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>10.1</strong> You may delete your account at any time via Settings → Account → Delete Account.</p>
                  <p><strong>10.2</strong> Upon deletion, personal data is deleted in accordance with applicable data protection law, subject to legally required retention including AML and KYC records.</p>
                  <p><strong>10.3</strong> Digital Will records are permanently erased. Export beforehand if you need a copy.</p>
                </div>
              </div>

              <div id="privacy" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">11. Privacy & Data Safety</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>11.1</strong> Your use is governed by the Privacy Policy.</p>
                  <p><strong>11.2</strong> Data is encrypted in transit and at rest. Payment card details are never stored by Itqaan.</p>
                  <p><strong>11.3</strong> Data is shared only with payment processors, providers, verification providers, regulators, and professional advisers under confidentiality.</p>
                  <p><strong>11.4</strong> Itqaan does not sell personal data or collect data from children.</p>
                </div>
              </div>

              <div id="compliance" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">12. Legal Compliance</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>12.1</strong> You must comply with all laws applicable to you, including financial, tax, and foreign-exchange rules.</p>
                  <p><strong>12.2</strong> Itqaan implements KYC and customer due diligence on regulated features, transaction monitoring, and sanctions screening.</p>
                  <p><strong>12.3</strong> You represent that you are not located in a sanctioned jurisdiction or designated as a sanctioned person.</p>
                  <p><strong>12.4</strong> The platform is offered only in countries where Itqaan is lawfully permitted to operate.</p>
                </div>
              </div>

              <div id="intellectual" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">13. Intellectual Property</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>13.1</strong> The platform, its software, trademarks, logos, designs, and content are owned by Itqaan or its licensors and protected by intellectual property laws.</p>
                  <p><strong>13.2</strong> You receive a limited, revocable, non-transferable, non-exclusive licence for personal, lawful use.</p>
                  <p><strong>13.3</strong> You must not copy, scrape, reverse engineer, decompile, resell, or create derivative works from the platform.</p>
                </div>
              </div>

              <div id="disclaimers" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">14. Disclaimers</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>14.1</strong> The platform is provided "as is" and "as available", without warranties of any kind to the maximum extent permitted by law.</p>
                  <p><strong>14.2</strong> Itqaan does not warrant uninterrupted availability, error-free operation, or the ongoing Shariah compliance, quality, safety, legality, or fitness of any provider's offerings.</p>
                  <p><strong>14.3</strong> Nothing in the platform constitutes religious, legal, tax, financial, investment, or medical advice. Consult qualified professionals.</p>
                </div>
              </div>

              <div id="liability" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">15. Limitation of Liability</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>15.1</strong> To the maximum extent permitted by law, Itqaan and its officers, employees, agents, SSB members, and contractors are not liable for indirect, incidental, special, consequential, or punitive damages.</p>
                  <p><strong>15.2</strong> Itqaan is not liable for acts or omissions of providers, processors, aggregators, operators, scholars, or other users.</p>
                  <p><strong>15.3</strong> Aggregate liability is capped at the greater of Service Fees paid in the preceding 12 months or USD 100.</p>
                  <p><strong>15.4</strong> Nothing excludes or limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot lawfully be excluded.</p>
                </div>
              </div>

              <div id="google" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">16. Google Play Notices</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>16.1</strong> These Terms are between you and Itqaan. Google LLC is not a party and bears no responsibility for the platform's content, maintenance, or support.</p>
                  <p><strong>16.2</strong> Google is a third-party beneficiary of these Terms and is entitled to enforce them against you.</p>
                  <p><strong>16.3</strong> If the platform fails to conform to any applicable warranty, you may notify Google, which may in its sole discretion refund the purchase price under its policies.</p>
                  <p><strong>16.4</strong> You must comply with all Google Play terms, including the Google Play Terms of Service.</p>
                </div>
              </div>

              <div id="governing" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">17. Governing Law & Disputes</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p><strong>17.1</strong> These Terms are governed by the laws of the Republic of Kenya.</p>
                  <p><strong>17.2</strong> Disputes are subject to the exclusive jurisdiction of the courts of Mombasa, Kenya, save that consumers may also bring claims in their local courts where local law grants that right.</p>
                  <p><strong>17.3</strong> Before litigation, the parties will attempt good-faith resolution via itqanllc@yahoo.com for 30 days.</p>
                </div>
              </div>

              <div id="contact" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">18. Contact Information</h2>
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100 space-y-1">
                  <p className="text-sm font-semibold text-[#032A24]">ITTQANIYUN LIMITED</p>
                  <p className="text-xs text-[#1A1A1A]/70">Company No.: CLG-ABF6ZP</p>
                  <p className="text-xs text-[#1A1A1A]/70">Registered Address: Itqaan House, Mombasa, Mombasa County, Kenya</p>
                  <p className="text-xs text-[#1A1A1A]/70">Postal Address: P.O Box 248, Ukunda, 80400</p>
                  <p className="text-xs text-[#1A1A1A]/70">Email: itqanllc@yahoo.com</p>
                  <p className="text-xs text-[#1A1A1A]/70">Phone: +254790211888</p>
                </div>
              </div>

              <div id="acknowledgement" className="scroll-mt-20 mb-8">
                <h2 className="text-xl font-bold text-[#032A24] mb-3">19. Acknowledgement</h2>
                <div className="space-y-3 text-[#1A1A1A] text-sm leading-relaxed">
                  <p>By using Itqaan, you confirm that you:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Are of eligible age</li>
                    <li>Have read, understood, and accepted these Terms</li>
                    <li>Will use the platform only for lawful, Halal purposes</li>
                    <li>Understand Itqaan is a facilitator that never holds client funds</li>
                    <li>Accept the mandatory disclaimers on Digital Wills, Pensions, Takaful, and P2P</li>
                  </ul>
                </div>
              </div>

              {/* Footer - Hidden in Modal */}
              {!isModal && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;