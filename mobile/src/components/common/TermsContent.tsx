import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const TermsContent = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* ISSC Badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(3, 42, 36, 0.06)',
          padding: 14,
          borderRadius: 12,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#C9A44B',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#C9A44B',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 10, fontWeight: '700' }}>
            ISSC
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            Itqaan Shariah Supervisory Committee
          </Text>
          <Text
            style={{
              color: 'rgba(3, 42, 36, 0.6)',
              fontSize: 11,
              marginTop: 2,
            }}
          >
            All services reviewed and approved for Shariah compliance.
          </Text>
        </View>
      </View>

      {/* Section 1 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          1. Acceptance of Terms
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          1.1 These Terms and Conditions constitute a legally binding agreement between you and ITTQANIYUN LIMITED governing your access to and use of the Itqaan platform, mobile application, website, and all related services.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          1.2 By downloading, installing, accessing, or using the platform, you confirm that you have read, understood, and agree to be bound by these Terms, the Privacy Policy, any in-app disclosures, and any service-specific terms presented to you.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          1.3 If you do not agree to these Terms, you must not download, access, or use the platform.
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(3, 42, 36, 0.05)',
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.08)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 11,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Order of Precedence
          </Text>
          <Text
            style={{
              color: 'rgba(3, 42, 36, 0.7)',
              fontSize: 11,
              lineHeight: 18,
            }}
          >
            • Mandatory local consumer and financial protection law{' '}
            {'\n'}• Google Play and Apple App Store terms{'\n'}• Service-specific
            terms accepted in-app{'\n'}• These Terms of Service{'\n'}• Privacy
            Policy
          </Text>
        </View>
      </View>

      {/* Section 2 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          2. Definitions
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
            Platform
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            The Itqaan software, features, and services.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
            Services
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            All features including Sadaqa, Zakat, HalalStay, Halal E-Commerce,
            Utility Payments, ItqaanPension, Find a Scholar, Halal Restaurants,
            Dial a Free Hearse & Shroud, P2P, Hajj & Umrah, Takaful, and Digital
            Wills.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
            Provider
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Any third party offering products or services through the platform.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
            Shariah
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Islamic law derived from the Qur'an, authentic Sunnah, and
            established Islamic jurisprudence.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
            Service Fee
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            The disclosed fee charged for facilitation, listing, access, or
            premium features.
          </Text>
        </View>
      </View>

      {/* Section 3 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          3. Eligibility & Age Restrictions
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>3.1</Text> You must be at least 18
          years old or the age of legal majority in your jurisdiction to create
          an account. The platform is not directed at children.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>3.2</Text> Access to regulated
          features including P2P, Takaful, ItqaanPension, Zakat disbursements,
          Hajj and Umrah facilitation, and Digital Wills is restricted to
          verified users aged 18 and above who have completed identity
          verification.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>3.3</Text> You must provide
          accurate, current, and complete information and update it promptly.
          You are responsible for safeguarding your credentials and for all
          activity on your account.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>3.4</Text> You may not create
          multiple accounts, impersonate any person, or use another person's
          identity or payment instruments.
        </Text>
      </View>

      {/* Section 4 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          4. Itqaan's Role & Regulatory Status
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>4.1</Text> Itqaan is a technology
          and facilitation platform. It is not a bank, payment institution,
          e-money issuer, money transmitter, investment adviser, broker-dealer,
          insurer, Takaful operator, pension fund manager, trustee, travel
          agency, funeral director, law firm, charity, issuer of fatwas, or
          executor of wills.
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(3, 42, 36, 0.05)',
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.08)',
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Client Funds Policy
          </Text>
          <Text
            style={{
              color: 'rgba(3, 42, 36, 0.7)',
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Itqaan does not hold, pool, custody, manage, invest, or take
            possession of client funds at any time. All payments for services
            are transmitted directly to providers or beneficiaries through
            licensed, regulated third-party payment processors.
          </Text>
        </View>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>4.3</Text> Revenue consists solely
          of disclosed Service Fees. No income is derived from Riba, Maysir,
          Gharar-based contracts, or any Haram activity.
        </Text>
      </View>

      {/* Section 5 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          5. Shariah Governance
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>5.1</Text> Itqaan appoints an
          independent Shariah Supervisory Board of qualified scholars
          responsible for:
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Reviewing and approving all services, product structures, fee
          models, and provider categories
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Auditing ongoing Shariah compliance of Itqaan and listed providers
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          • Directing purification or remediation where non-compliance is
          discovered
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>5.2</Text> Every product,
          service, provider, listing, and transaction on the platform must be
          Halal. Itqaan applies a direct and indirect prohibition standard.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>5.3</Text> Itqaan may require
          providers to obtain certification from recognized Halal or Shariah
          audit bodies and submit to periodic audits.
        </Text>
      </View>

      {/* Section 6 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          6. Prohibited Activities
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>6.1</Text> The following are
          strictly prohibited on or through the platform:
        </Text>
        <View style={{ marginBottom: 8 }}>
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
            'Hate speech and incitement',
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(3, 42, 36, 0.04)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: '#DC2626',
                  fontSize: 12,
                  marginRight: 8,
                  fontWeight: '700',
                }}
              >
                ✕
              </Text>
              <Text
                style={{
                  color: '#1A1A1A',
                  fontSize: 12,
                }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>6.2</Text> P2P transfers may not
          be used for payment for Haram goods or services, interest-bearing
          loans, or commercial reselling outside Halal E-Commerce.
        </Text>
      </View>

      {/* Section 7 - Service Specific Terms - Simplified for mobile */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          7. Service-Specific Terms
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            7.1 Sadaqa & Zakat
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Donations transmitted directly to verified charitable
            organizations{'\n'}• Itqaan does not intermediate charitable funds
            {'\n'}• Zakat calculator provides estimates only{'\n'}• Donations
            are non-refundable
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            7.2 P2P Transfers
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Available only to KYC-verified users{'\n'}• Transfers must be for
            lawful, Halal purposes{'\n'}• Itqaan cooperates with law enforcement
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            7.3 Digital Wills
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Documentation and storage tool for Islamic estate intentions{'\n'}• May not be legally binding. Consult a licensed lawyer.{'\n'}• Itqaan is not an executor or law firm
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            7.4 Takaful
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Refers users to licensed Shariah-compliant operators{'\n'}• Products structured on Tabarru', Wakalah, or Mudarabah{'\n'}• Itqaan is not an operator or claims handler
          </Text>
        </View>
      </View>

      {/* Section 8 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          8. Payments & Billing
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>8.1</Text> Digital Products
          purchased in-app on Android are billed exclusively through Google Play
          Billing.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '600' }}>8.2</Text> All Service Fees are
          displayed before you confirm any transaction. No hidden charges.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>8.3</Text> Subscriptions renew
          automatically unless cancelled at least 24 hours before renewal via
          your Google Play account settings.
        </Text>
      </View>

      {/* Section 9-15 - Condensed for mobile */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          9. User Content & Moderation
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Rules of conduct published inside the platform
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • You grant Itqaan a licence to host and display your content
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Itqaan operates active moderation with automated and human review
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          10. Account Deletion & Data Rights
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Delete your account via Settings → Account → Delete Account
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Digital Will records are permanently erased on deletion
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          11. Privacy & Data Safety
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Data is encrypted in transit and at rest
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Payment card details are never stored by Itqaan
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Itqaan does not sell personal data or collect data from children
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          12. Legal Compliance
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Comply with all laws applicable to you
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Itqaan implements KYC and transaction monitoring
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Platform offered only in countries where Itqaan is permitted to
          operate
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          13. Intellectual Property
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Platform owned by Itqaan and protected by intellectual property laws
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • You receive a limited licence for personal, lawful use
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          14. Disclaimers
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Platform provided "as is" and "as available"
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Itqaan does not warrant uninterrupted availability
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Nothing constitutes religious, legal, or financial advice
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          15. Limitation of Liability
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Itqaan is not liable for indirect or consequential damages
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Itqaan is not liable for acts of providers or other users
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Aggregate liability capped at USD 100
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          16. Google Play Notices
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Google LLC is not a party to these Terms
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • You must comply with all Google Play terms
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          17. Governing Law & Disputes
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Terms governed by the laws of the Republic of Kenya
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • Disputes subject to exclusive jurisdiction of Mombasa, Kenya
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • Good-faith resolution via itqanllc@yahoo.com for 30 days
        </Text>
      </View>

      {/* Section 18 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          18. Contact Information
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            ITTQANIYUN LIMITED
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Company No.: CLG-ABF6ZP
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Address: Itqaan House, Mombasa, Kenya
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Email: itqanllc@yahoo.com
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Phone: +254790211888
          </Text>
        </View>
      </View>

      {/* Section 19 */}
      <View>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          19. Acknowledgement
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          By using Itqaan, you confirm that you:
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          • Are of eligible age{'\n'}• Have read, understood, and accepted these
          Terms{'\n'}• Will use the platform only for lawful, Halal purposes
          {'\n'}• Understand Itqaan is a facilitator that never holds client
          funds{'\n'}• Accept the mandatory disclaimers on Digital Wills,
          Pensions, Takaful, and P2P
        </Text>
      </View>
    </ScrollView>
  );
};

export default TermsContent;