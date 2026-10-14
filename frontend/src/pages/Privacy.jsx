import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'overview',
        title: '1. Data Controller and Scope',
        paragraphs: [
            'This Privacy Policy outlines how G-mart E-Commerce PLC ("G-mart", "we", "us", or "our") collects, processes, stores, and safeguards your personal data when you visit our marketplace, create an account, purchase products, or interact with our customer support.',
            'We act as the Data Controller responsible for your personal information. If you have questions about our data practices or wish to exercise your privacy rights, please contact our Data Protection Office at gmartofficial@gmail.com.',
        ],
    },
    {
        id: 'collection',
        title: '2. Information We Collect',
        paragraphs: [
            'We collect personal information necessary to deliver our eCommerce and marketplace services:',
            'Account Information: Full name, email address, hashed passwords, and contact preferences.',
            'Order and Delivery Details: Recipient name, phone number, physical delivery address, city, and special drop-off instructions.',
            'Payment and Transaction Records: Payment method selected (Telebirr or bank transfer), transaction reference numbers, uploaded payment proof images, and order timestamps. Note: G-mart does not store sensitive banking passwords or Telebirr PINs.',
            'Technical & Telemetry Data: IP address, browser type, device identifiers, session cookies, and storefront navigation history to safeguard against fraud and optimize performance.',
        ],
    },
    {
        id: 'legal-basis',
        title: '3. Legal Bases for Processing',
        paragraphs: [
            'We only process your personal data when we have a valid legal basis:',
            'Contractual Necessity: To process your orders, fulfill deliveries, manage user accounts, and provide transactional customer support.',
            'Consent: When you opt into non-essential cookies, promotional communications, or explicitly provide consent upon registration.',
            'Legal Obligation: To maintain financial and tax records, prevent money laundering, and comply with commercial regulatory inquiries.',
            'Legitimate Interests: To detect and prevent fraudulent transactions, secure our IT infrastructure, and resolve marketplace disputes between buyers and sellers.',
        ],
    },
    {
        id: 'sharing',
        title: '4. Third-Party Disclosures and Service Providers',
        paragraphs: [
            'We never sell your personal information to data brokers. We only share relevant data with trusted service providers under strict data processing agreements:',
            'Logistics & Couriers: We share delivery names, phone numbers, and addresses with delivery personnel solely to complete product handover.',
            'Infrastructure & Hosting: Cloud hosting infrastructure (MongoDB Atlas) and secure media storage (Cloudinary for payment proofs and product images).',
            'Legal & Regulatory Authorities: When required by applicable law, court order, or governmental inquiry.',
        ],
    },
    {
        id: 'cookies',
        title: '5. Cookies and Local Storage Technologies',
        paragraphs: [
            'G-mart uses cookies and local storage tokens to provide core shopping functionality:',
            'Essential Cookies: Necessary for user authentication, maintaining secure sessions (JWT refresh tokens), and preserving your shopping cart.',
            'Preference Cookies: To remember your storefront preferences, filter settings, and cookie choices.',
            'You can review and manage your cookie preferences at any time using our Cookie Preferences tool or via the Cookies link in the website footer.',
        ],
    },
    {
        id: 'retention',
        title: '6. Data Retention and Security Safeguards',
        paragraphs: [
            'We retain personal information only for as long as required to fulfill the purposes outlined in this policy or to satisfy statutory accounting and tax retention periods (typically up to 5–7 years for completed sales invoices).',
            'We implement industry-standard physical, electronic, and procedural safeguards, including password hashing with bcrypt, SSL/TLS encryption for all in-transit traffic, and restricted role-based administrative access controls.',
        ],
    },
    {
        id: 'rights',
        title: '7. Your Privacy Rights and Data Portability',
        paragraphs: [
            'Under applicable data protection laws, you possess the following rights regarding your personal information:',
            'Right of Access & Portability: You can view your account history and download an export of your personal data directly from your Account Dashboard.',
            'Right to Rectification: You can update your profile name and contact information at any time.',
            'Right to Erasure ("Right to be Forgotten"): You can permanently delete your account, orders, wishlists, and credentials via the Account Settings page.',
            'Right to Withdraw Consent: Where processing relies on consent, you may withdraw it at any time without affecting past lawful processing.',
        ],
    },
    {
        id: 'minors',
        title: '8. Protection of Minors',
        paragraphs: [
            'Our platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from children without verified parental consent. If we learn that a minor under 18 has submitted personal data without authorization, we will promptly delete the data from our records.',
        ],
    },
    {
        id: 'updates',
        title: '9. Updates to This Policy',
        paragraphs: [
            'We may periodically update this Privacy Policy to reflect changes in our operational procedures or legal requirements. Material updates will be highlighted on the storefront or communicated via email before taking effect.',
        ],
    },
]

function Privacy() {
    return (
        <LegalPage
            eyebrow="Data Protection"
            title="Privacy Policy"
            description="Learn how G-mart collects, processes, and protects your personal information and how you can exercise your privacy and data portability rights."
            effectiveDate="October 14, 2026"
            version="1.0"
            sections={sections}
        />
    )
}

export default Privacy