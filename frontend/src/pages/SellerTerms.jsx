import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'overview',
        title: '1. Marketplace Scope and Seller Eligibility',
        paragraphs: [
            'These Seller Terms and Conditions govern the relationship between G-mart E-Commerce PLC ("Platform", "we") and registered vendors or individuals ("Seller", "you") listing products for sale on G-mart.',
            'To sell on G-mart, you must be a legally registered business or an authorized individual of legal age (18+) operating in compliance with Ethiopian trade and commercial regulations.',
        ],
    },
    {
        id: 'product-listings',
        title: '2. Product Listings & Authenticity Guarantee',
        paragraphs: [
            'All products listed on G-mart must be authentic, genuine, and legally permissible for retail sale. Sellers warrant that items listed do not infringe upon any third-party intellectual property rights, trademarks, or copyrights.',
            'Strictly Prohibited Items: Counterfeit goods, replicas, stolen property, firearms, hazardous materials, prescription medications, unregistered cosmetics, and items barred under Ethiopian law.',
            'Listing of counterfeit or prohibited merchandise results in immediate store suspension, forfeiture of pending payouts, and referral to regulatory authorities.',
        ],
    },
    {
        id: 'order-fulfillment',
        title: '3. Order Fulfillment & Packaging Standards',
        paragraphs: [
            'Upon notification of a customer order, the Seller must prepare and package the item within twenty-four (24) hours according to G-mart safe transit packaging standards.',
            'Sellers must make goods available for carrier pickup or drop-off at designated fulfillment hubs promptly to maintain high seller performance metrics and customer ratings.',
        ],
    },
    {
        id: 'pricing-payouts',
        title: '4. Pricing, Commissions, and Payout Schedule',
        paragraphs: [
            'Sellers set retail prices inclusive of all applicable taxes. G-mart deducts an agreed marketplace facilitation commission on completed sales.',
            'Seller payouts are disbursed weekly via Telebirr or commercial bank transfer for all orders that have cleared the customer return window without open dispute.',
        ],
    },
    {
        id: 'disputes-returns',
        title: '5. Customer Returns, Warranties, and Defect Liability',
        paragraphs: [
            'Sellers must honor the G-mart 7-day Return & Refund Policy for defective, damaged, or misdescribed products.',
            'If a buyer returns an item due to a documented seller defect or counterfeit concern, the full purchase price is refunded to the buyer and debited from the Seller\'s account balance.',
        ],
    },
    {
        id: 'ip-takedown',
        title: '6. Notice & Takedown Procedure (DMCA / IP Claims)',
        paragraphs: [
            'G-mart respects intellectual property rights. If a trademark or copyright holder believes a product listing infringes their rights, they may submit a formal Notice of Infringement to gmartofficial@gmail.com.',
            'G-mart will promptly investigate and temporarily delist claimed products pending Seller proof of authorization or license.',
        ],
    },
]

function SellerTerms() {
    return (
        <LegalPage
            eyebrow="Marketplace Governance"
            title="Seller &amp; Vendor Terms"
            description="Rules, standards, payout terms, and compliance expectations for merchants listing and selling merchandise on the G-mart marketplace."
            effectiveDate="October 14, 2026"
            version="1.0"
            sections={sections}
        />
    )
}

export default SellerTerms
