import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'agreement',
        title: '1. Agreement to Terms and Eligibility',
        paragraphs: [
            'These Terms and Conditions constitute a legally binding agreement between you (whether personally or on behalf of an entity) and G-mart E-Commerce PLC ("G-mart", "we", "us", or "our"), governing your access to and use of the G-mart website, mobile services, and storefront.',
            'By accessing the site, registering an account, or placing an order, you confirm that you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these terms, you are expressly prohibited from using the platform and must discontinue use immediately.',
            'The platform is intended for users who are at least 18 years of age (or the legal age of majority in your jurisdiction). Individuals under 18 may only use G-mart under the supervision of a parent or legal guardian who agrees to be bound by these Terms.',
        ],
    },
    {
        id: 'accounts',
        title: '2. User Accounts and Electronic Communications',
        paragraphs: [
            'To access certain features of G-mart, including placing orders, rating sellers, and listing products, you must register an account. You agree to provide accurate, current, and complete information and to keep your credentials confidential.',
            'You are solely responsible for all activities that occur under your account. You agree to immediately notify G-mart of any unauthorized use or security breach.',
            'By creating an account, you consent to receive electronic communications from us regarding your transactions, security updates, and administrative notices. These electronic notices satisfy any legal requirement that such communications be in writing.',
        ],
    },
    {
        id: 'orders',
        title: '3. Orders, Pricing, and Contract Formation',
        paragraphs: [
            'All product descriptions, specifications, and prices are subject to change without prior notice. While we strive for accuracy, typographical errors, inaccuracies, or omissions may occur. We reserve the right to correct any errors and to cancel or refuse orders based on incorrect pricing or availability information.',
            'Placing an order constitutes an offer to purchase. A legally binding contract of sale is formed only when G-mart or the respective seller verifies payment and confirms order acceptance for processing.',
            'We reserve the right to limit or prohibit orders that, in our judgment, appear to be placed by dealers, resellers, distributors, or in violation of our fair use policies.',
        ],
    },
    {
        id: 'payments',
        title: '4. Payment Methods, Proof Verification, and Currency',
        paragraphs: [
            'All transactions on G-mart are processed in Ethiopian Birr (ETB) unless explicitly stated otherwise. We accept payments via Telebirr mobile wallet and accredited Ethiopian commercial bank transfers.',
            'When placing an order with manual transfer, you agree to submit genuine, verifiable payment confirmation (transaction reference number and screenshot proof). Submission of counterfeit, manipulated, or fraudulent transaction receipts constitutes a material breach and may result in immediate account termination and reporting to financial authorities.',
            'Orders are released for fulfillment only after successful verification and reconciliation of funds into G-mart\'s designated recipient account.',
        ],
    },
    {
        id: 'shipping',
        title: '5. Delivery, Shipping, and Passing of Risk',
        paragraphs: [
            'Delivery timelines provided during checkout or within order confirmation notices are good-faith estimates and may be subject to carrier delays, weather conditions, or local logistical disruptions.',
            'Title and risk of loss for products pass to you upon delivery to the designated shipping address provided during checkout. For full details on delivery areas, inspection at handover, and missing package reports, please consult our dedicated Shipping Policy.',
        ],
    },
    {
        id: 'returns',
        title: '6. Returns, Exchanges, and Refunds',
        paragraphs: [
            'Customers have the right to request a return or exchange within the applicable return window (generally 7 days from verified delivery) for eligible, unblemished items in original packaging, in accordance with our Refund & Return Policy.',
            'Refunds for validated returns are issued via the original payment method (Telebirr or bank reversal) within 3 to 5 business days following inspection of the returned merchandise. Certain categories, such as perishable items, personal hygiene goods, and digital downloads, are non-returnable.',
        ],
    },
    {
        id: 'marketplace',
        title: '7. Multi-Vendor Marketplace Dynamics',
        paragraphs: [
            'G-mart operates both as a direct merchant and as a multi-vendor marketplace connecting verified independent sellers with buyers. When purchasing from an independent seller, the transaction is subject to the seller\'s warranty and fulfillment obligations in accordance with our Seller Terms.',
            'G-mart provides mediation support for buyer-seller disputes. However, independent sellers remain solely responsible for the authenticity, safety, and regulatory compliance of items they list.',
        ],
    },
    {
        id: 'conduct',
        title: '8. Acceptable Use and Prohibited Activities',
        paragraphs: [
            'You may not access or use the platform for any purpose other than that for which we make it available. Prohibited activities include: attempting to bypass security mechanisms, automated scraping or data harvesting without written permission, uploading malicious code, submitting false ratings or defamatory reviews, and infringing on third-party rights.',
            'Violation of acceptable use guidelines may result in immediate suspension or permanent termination of your account without liability to G-mart.',
        ],
    },
    {
        id: 'ip',
        title: '9. Intellectual Property Rights',
        paragraphs: [
            'Unless otherwise indicated, the platform, source code, databases, website designs, audio, video, text, photographs, and graphics on the site (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or licensed by G-mart E-Commerce PLC and are protected by copyright and trademark laws.',
            'You are granted a limited license to access and make personal, non-commercial use of the site. Any reproduction, distribution, or commercial exploitation without our prior written consent is strictly prohibited.',
        ],
    },
    {
        id: 'liability',
        title: '10. Disclaimers and Limitation of Liability',
        paragraphs: [
            'The platform and all products and services delivered to you are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.',
            'In no event shall G-mart, its directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages arising from your use of the platform, even if advised of the possibility of such damages.',
        ],
    },
    {
        id: 'governing-law',
        title: '11. Governing Law and Dispute Resolution',
        paragraphs: [
            'These Terms and Conditions and your use of the platform are governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia, including the Electronic Transactions Proclamation No. 1205/2020 and the Ethiopian Commercial Code.',
            'Any dispute, controversy, or claim arising out of or relating to these terms shall first be submitted to good-faith mutual consultation. If unresolved within thirty (30) days, the dispute shall be submitted to the exclusive jurisdiction of the competent courts of Addis Ababa, Ethiopia.',
        ],
    },
    {
        id: 'modifications',
        title: '12. Modifications and Severability',
        paragraphs: [
            'We reserve the right to amend these Terms and Conditions at our discretion. We will indicate the "Effective Date" of any revisions. Continued use of the platform after revised terms are posted constitutes your acceptance of the changes.',
            'If any provision of these terms is determined to be unlawful, void, or unenforceable, such provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.',
        ],
    },
]

function Terms() {
    return (
        <LegalPage
            eyebrow="Terms of Service"
            title="Terms and Conditions"
            description="These binding terms govern your access to the G-mart marketplace, storefront, user accounts, and purchase contracts."
            effectiveDate="October 14, 2026"
            version="1.0"
            sections={sections}
        />
    )
}

export default Terms