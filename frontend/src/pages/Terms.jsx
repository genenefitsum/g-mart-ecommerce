import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'overview',
        title: '1. Agreement to terms',
        paragraphs: [
            'By accessing or using G-mart, you agree to these Terms and Conditions. If you do not agree, please do not use the site or services.',
            'These terms apply to browsing the storefront, creating an account, placing orders, and interacting with any content or features we provide.',
        ],
    },
    {
        id: 'accounts',
        title: '2. Accounts and eligibility',
        paragraphs: [
            'You are responsible for providing accurate account information and keeping your login details secure. You should notify us right away if you suspect unauthorized access to your account.',
            'We may suspend or close accounts that violate these terms, misuse the platform, or create risk for G-mart or other users.',
        ],
    },
    {
        id: 'orders',
        title: '3. Orders, pricing, and availability',
        paragraphs: [
            'We may update product details, pricing, and availability at any time. We work to keep information accurate, but errors can happen and we may correct them before or after an order is placed.',
            'Submitting an order does not guarantee acceptance. We may cancel or limit orders for inventory, pricing, fraud-prevention, or other operational reasons.',
        ],
    },
    {
        id: 'payments',
        title: '4. Payments',
        paragraphs: [
            'You agree to pay all charges associated with your order, including product price, taxes, shipping, and any other fees shown at checkout.',
            'If a payment method fails, is reversed, or is flagged for fraud, we may delay or cancel fulfillment until the issue is resolved.',
        ],
    },
    {
        id: 'shipping',
        title: '5. Shipping and delivery',
        paragraphs: [
            'Shipping timelines are estimates, not guarantees. Delivery may be affected by carrier delays, address issues, weather, or other events outside our control.',
            'Once an item is handed to the carrier or otherwise marked delivered according to the selected shipping method, the risk of delay or loss may shift according to the applicable shipping terms.',
        ],
    },
    {
        id: 'returns',
        title: '6. Returns and refunds',
        paragraphs: [
            'Returns and refunds are handled according to the return policy presented at checkout or on the site. Some products may be final sale or subject to special conditions.',
            'We may refuse a return or refund if an item is used, damaged by misuse, missing original packaging, or outside the stated return window.',
        ],
    },
    {
        id: 'conduct',
        title: '7. Acceptable use',
        paragraphs: [
            'You may not use G-mart to violate laws, interfere with the service, upload harmful code, scrape data without permission, or attempt unauthorized access to systems or accounts.',
            'Any reviews, comments, or other submissions you provide must be lawful, accurate to the best of your knowledge, and free of abusive or deceptive content.',
        ],
    },
    {
        id: 'ip',
        title: '8. Intellectual property',
        paragraphs: [
            'All site design, branding, text, graphics, logos, and other materials provided by G-mart are protected by intellectual property laws and remain our property or the property of our licensors.',
            'You may not reproduce, redistribute, or exploit our content except as needed to use the site for normal personal shopping purposes.',
        ],
    },
    {
        id: 'liability',
        title: '9. Disclaimer and limitation of liability',
        paragraphs: [
            'The site and services are provided on an as-available basis. To the extent allowed by law, we disclaim warranties that are not expressly stated here.',
            'We are not liable for indirect, incidental, special, or consequential damages arising from your use of the site, except where such limits are not permitted by law.',
        ],
    },
]

function Terms() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms and Conditions"
            description="These terms explain how G-mart works, what you can expect from us, and what we expect from you when you use the platform."
            updatedLabel="Draft for review and legal approval."
            sections={sections}
        />
    )
}

export default Terms