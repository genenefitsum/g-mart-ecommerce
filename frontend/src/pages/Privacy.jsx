import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'overview',
        title: '1. What this policy covers',
        paragraphs: [
            'This Privacy Policy explains how G-mart collects, uses, shares, and protects information when you browse the site, create an account, or place an order.',
            'By using G-mart, you agree to the collection and use of information as described here.',
        ],
    },
    {
        id: 'information',
        title: '2. Information we collect',
        paragraphs: [
            'We may collect information you provide directly, such as your name, email address, shipping details, account credentials, and order-related messages.',
            'We may also collect limited technical information automatically, such as device details, browser type, pages visited, and basic usage activity that helps us operate and improve the site.',
        ],
    },
    {
        id: 'use',
        title: '3. How we use information',
        paragraphs: [
            'We use information to process orders, deliver products, manage accounts, provide customer support, detect fraud, and improve the shopping experience.',
            'We may also use information to send service messages, respond to inquiries, and keep the platform secure and reliable.',
        ],
    },
    {
        id: 'sharing',
        title: '4. When we share information',
        paragraphs: [
            'We may share information with service providers that help us operate the store, process payments, ship orders, host the site, or provide analytics and support tools.',
            'We may also disclose information when required by law, to protect our rights, or in connection with a business transaction such as a merger or asset transfer.',
        ],
    },
    {
        id: 'cookies',
        title: '5. Cookies and similar technologies',
        paragraphs: [
            'We may use cookies or similar technologies to remember preferences, maintain sessions, improve functionality, and understand how visitors use the site.',
            'You can usually manage cookies through your browser settings, but disabling them may limit certain site features.',
        ],
    },
    {
        id: 'retention',
        title: '6. Data retention and security',
        paragraphs: [
            'We keep personal information only as long as reasonably needed for business, legal, or operational purposes.',
            'We use reasonable administrative, technical, and organizational safeguards to protect information, but no system is completely secure.',
        ],
    },
    {
        id: 'choices',
        title: '7. Your choices and rights',
        paragraphs: [
            'You may be able to update account details, request access to certain information, or ask us to correct or delete specific data, subject to legal and operational requirements.',
            'If you do not want to receive non-essential messages, you can follow the unsubscribe steps in those messages or contact us directly.',
        ],
    },
    {
        id: 'third-party',
        title: '8. Third-party services',
        paragraphs: [
            'The site may link to third-party services or use integrations from providers that have their own privacy practices. Their handling of data is governed by their own policies.',
            'We encourage you to review those policies before using third-party features or submitting information to them.',
        ],
    },
]

function Privacy() {
    return (
        <LegalPage
            eyebrow="Privacy"
            title="Privacy Policy"
            description="This policy describes what information G-mart collects, how we use it, and the choices you have around your data."
            updatedLabel="Draft for review and legal approval."
            sections={sections}
        />
    )
}

export default Privacy