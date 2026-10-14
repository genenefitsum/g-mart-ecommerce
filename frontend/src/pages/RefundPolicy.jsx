import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'overview',
        title: '1. Standard Return Window',
        paragraphs: [
            'At G-mart, customer satisfaction is our top priority. We offer a 7-day return window from the date of confirmed delivery for eligible merchandise.',
            'To qualify for a return or exchange, the product must be in its original, unused condition, with all tags, packaging, user manuals, and accessories intact. Proof of purchase (Order ID or order confirmation email) is required for all return requests.',
        ],
    },
    {
        id: 'eligibility',
        title: '2. Return Eligibility & Non-Returnable Items',
        paragraphs: [
            'Eligible items include clothing with original tags attached, unopened electronics in sealed packaging, undamaged home goods, and defective merchandise.',
            'For health, safety, and hygiene reasons, the following categories are strictly non-returnable unless received defective or damaged:',
            '• Personal care and cosmetic items with broken safety seals.',
            '• Intimates, underwear, and swimwear.',
            '• Perishable groceries and food products.',
            '• Gift cards, downloadable digital products, and customized/personalized goods.',
        ],
    },
    {
        id: 'damaged-defective',
        title: '3. Damaged or Defective Items upon Delivery',
        paragraphs: [
            'If you receive an item that is damaged, defective, or materially different from what was ordered, you must notify G-mart within forty-eight (48) hours of delivery.',
            'Please submit photographic evidence of the defective product and packaging to our support team at gmartofficial@gmail.com. Once verified, G-mart will arrange an expedited replacement at no extra charge or issue a full refund including return delivery fees.',
        ],
    },
    {
        id: 'process',
        title: '4. How to Initiate a Return',
        paragraphs: [
            'Step 1: Contact G-mart support via email (gmartofficial@gmail.com) or phone with your Order ID and reason for return.',
            'Step 2: Our support team will issue a Return Authorization Code and designated drop-off/pickup instructions.',
            'Step 3: Pack the product securely with all accessories and original packaging. Our courier partner will inspect and collect the parcel.',
        ],
    },
    {
        id: 'refund-method',
        title: '5. Refund Method and Timelines',
        paragraphs: [
            'Once your return is received and inspected at our fulfillment depot, we will notify you of the approval or rejection of your refund.',
            'Approved refunds will be processed via your original payment channel (Telebirr mobile money or direct bank transfer reversal) within 3 to 5 business days.',
            'Please note that bank processing times may vary depending on your financial institution.',
        ],
    },
    {
        id: 'order-cancellation',
        title: '6. Order Cancellation Policy',
        paragraphs: [
            'You may cancel an order free of charge at any time before payment verification or before the order status transitions to "processing" or "dispatched".',
            'Once an order has been handed to the delivery courier, it cannot be cancelled in transit and must be handled under the standard return procedure upon delivery.',
        ],
    },
]

function RefundPolicy() {
    return (
        <LegalPage
            eyebrow="Consumer Protection"
            title="Refund &amp; Return Policy"
            description="Our straightforward returns and refund policy explains how to request a return, exchange, or refund on G-mart."
            effectiveDate="October 14, 2026"
            version="1.0"
            sections={sections}
        />
    )
}

export default RefundPolicy
