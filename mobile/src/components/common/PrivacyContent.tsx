import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const PrivacyContent = () => {
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
            This Privacy Policy has been reviewed and approved for Shariah compliance.
          </Text>
        </View>
      </View>

      {/* Introduction */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          Introduction
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          ITTQANIYUN LIMITED respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Itqaan platform, mobile application, website, and related services.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          This Privacy Policy applies to all users, including clients, vendors, leaders, and administrators. By using the platform, you consent to the data practices described in this policy.
        </Text>
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
          1. Information We Collect
        </Text>

        <Text
          style={{
            color: '#032A24',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          1.1 Personal Information You Provide
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Account Information: Full name, phone number, email address, national ID, and PIN
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Location Information: County, sub-county, ward, and physical address
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Profile Information: Profile image, bio, business name, KRA PIN, and business registration number
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • KYC Information: Identification documents and passport photos for regulatory compliance
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Payment Information: M-Pesa phone number and transaction history. Payment card details are never stored.
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • User Content: Reviews, ratings, messages, listings, and product descriptions
          </Text>
        </View>

        <Text
          style={{
            color: '#032A24',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          1.2 Information Automatically Collected
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Device Information: Device type, operating system, and unique device identifiers
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Usage Data: App interactions, features used, pages viewed, and navigation patterns
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Location Data: Approximate location based on IP address or GPS
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Log Data: IP address, browser type, access times, and referring URLs
          </Text>
        </View>

        <Text
          style={{
            color: '#032A24',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          1.3 Information from Third Parties
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Payment Processors: Transaction status and payment confirmations
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Verification Providers: Identity verification results for KYC compliance
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
            • Service Providers: Information from vendors, leaders, and service providers
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
          2. How We Use Your Information
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Provide Services
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Create and manage accounts{'\n'}• Process transactions and payments{'\n'}• Facilitate bookings and orders{'\n'}• Enable P2P transfers and contributions
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
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Communicate
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Send transaction confirmations{'\n'}• Provide customer support{'\n'}• Send service updates and alerts
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
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Enhance & Improve
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Analyze usage patterns{'\n'}• Develop new features{'\n'}• Optimize performance
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Legal & Compliance
          </Text>
          <Text style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 18 }}>
            • Comply with AML and KYC regulations{'\n'}• Prevent fraud and abuse{'\n'}• Enforce Terms and Conditions
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
          3. Legal Basis for Processing
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Contractual Necessity
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Processing is necessary to perform the contract we have with you, including account creation and service delivery.
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
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Legal Compliance
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Processing is necessary to comply with legal obligations, including AML, KYC, and regulatory reporting.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Legitimate Interests
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Processing is necessary for our legitimate interests, including fraud prevention and service improvement.
          </Text>
        </View>
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
          4. How We Share Your Information
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontWeight: '600' }}>With Service Providers:</Text> Payment processors, KYC verification providers, cloud service providers, and communication services.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontWeight: '600' }}>With Other Users:</Text> Your name and contact details are shared with vendors for order fulfilment, with leaders for consultation bookings, and with mosque administrators for event registration.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontWeight: '600' }}>For Legal Purposes:</Text> To comply with court orders, respond to regulator requests, and enforce our Terms.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          <Text style={{ fontWeight: '600' }}>Shariah Supervisory Committee:</Text> Aggregated and anonymized data may be shared for audit and compliance purposes.
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
          5. Data Security
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Encryption
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Data is encrypted in transit and at rest
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
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Access Controls
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Access restricted to authorized personnel only
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
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            PCI-DSS Compliance
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Payment data handled by PCI-DSS-compliant processors
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#032A24',
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Shariah Security
          </Text>
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
            }}
          >
            Additional measures against Riba, Maysir, and Gharar
          </Text>
        </View>
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
          6. Data Retention
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected.
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • <Text style={{ fontWeight: '600' }}>Active Accounts:</Text> Data is retained while your account is active
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • <Text style={{ fontWeight: '600' }}>Regulatory Requirements:</Text> AML and KYC records are retained for 7 years
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • <Text style={{ fontWeight: '600' }}>Transaction Records:</Text> Financial transaction records are retained for 7 years
        </Text>
      </View>

      {/* Section 7 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          7. Your Rights
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Access — Request a copy of your personal data
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Rectification — Request correction of inaccurate data
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Deletion — Request deletion of your personal data
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Restriction — Request restriction of processing
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Data Portability — Request transfer of your data
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(250, 250, 247, 1)',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#1A1A1A', fontSize: 12 }}>
            • Right to Object — Object to processing based on legitimate interests
          </Text>
        </View>

        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          To exercise any of these rights, contact us at{' '}
          <Text style={{ color: '#032A24', fontWeight: '600' }}>
            itqanllc@yahoo.com
          </Text>
        </Text>
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
          8. Account Deletion
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          You may delete your account at any time:
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          • <Text style={{ fontWeight: '600' }}>In-App:</Text> Settings → Account → Delete Account
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • <Text style={{ fontWeight: '600' }}>Email:</Text> Send a deletion request to itqanllc@yahoo.com
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(3, 42, 36, 0.05)',
            padding: 12,
            borderRadius: 10,
            marginTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.08)',
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
            Effect of Deletion
          </Text>
          <Text
            style={{
              color: 'rgba(3, 42, 36, 0.7)',
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            • Your account becomes inaccessible{'\n'}• Personal data is deleted, subject to legally required retention{'\n'}• Digital Will records are permanently erased
          </Text>
        </View>
      </View>

      {/* Section 9 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          9. Children's Privacy
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          The Itqaan platform is not directed at children under 18 years of age. We do not knowingly collect personal data from children under 18. If we discover that we have collected data from a child under 18, we will delete it immediately.
        </Text>
      </View>

      {/* Section 10 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          10. International Data Transfers
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          Your personal data may be transferred to and processed in countries outside your jurisdiction. We ensure that appropriate safeguards are in place, including standard contractual clauses and data processing agreements with service providers.
        </Text>
      </View>

      {/* Section 11 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          11. Cookies and Tracking
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          We use cookies and similar tracking technologies to maintain your session and preferences, analyze usage patterns, and improve the platform. You can manage your cookie preferences through your browser or device settings.
        </Text>
      </View>

      {/* Section 12 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          12. Third-Party Links
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          The platform may contain links to third-party websites or services. This Privacy Policy does not apply to third-party websites. We are not responsible for the privacy practices of third parties.
        </Text>
      </View>

      {/* Section 13 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          13. Changes to This Policy
        </Text>
        <Text
          style={{
            color: '#1A1A1A',
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          We may update this Privacy Policy from time to time. We will notify you of material changes through in-app notifications, email, or an updated effective date. Continued use of the platform after changes constitutes acceptance of the updated policy.
        </Text>
      </View>

      {/* Section 14 */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: '#032A24',
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          14. Contact Us
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
          <Text
            style={{
              color: 'rgba(26, 26, 26, 0.7)',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Address: Itqaan House, Mombasa, Mombasa County, Kenya
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PrivacyContent;