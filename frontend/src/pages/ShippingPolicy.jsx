import LegalPage from '../components/legal/LegalPage.jsx'

const sections = [
    {
        id: 'coverage',
        title: '1. Delivery Coverage and Zones',
        paragraphs: [
            'G-mart currently delivers across Addis Ababa and select major regional metropolitan hubs throughout Ethiopia.',
            'Zone 1 (Addis Ababa Metro): Express and standard doorstep delivery to all sub-cities including Bole, Kirkos, Yeka, Arada, Nifas Silk-Lafto, Kolfe Keranio, Lideta, Akaky Kaliti, and Gulele.',
            'Zone 2 (Regional Hubs): Deliveries to Hawassa, Adama, Bahir Dar, Dire Dawa, and Mekelle handled via accredited regional logistics carriers.',
        ],
    },
    {
        id: 'processing',
        title: '2. Order Processing & Fulfillment Timelines',
        paragraphs: [
            'Orders are verified and queued for processing immediately following payment confirmation (Telebirr or bank receipt reconciliation).',
            'Order processing occurs Monday through Saturday between 8:30 AM and 6:00 PM EAT. Orders placed on Sundays or public holidays are processed the next business day.',
            'Standard Addis Ababa delivery typically arrives within 24 to 48 hours of payment verification. Regional deliveries typically arrive within 3 to 5 business days.',
        ],
    },
    {
        id: 'handover',
        title: '3. Handover and Proof of Delivery',
        paragraphs: [
            'Our courier will contact the phone number provided at checkout prior to arriving at your designated address.',
            'Upon delivery, the recipient must inspect the outer packaging and sign or confirm the digital delivery receipt. If you designate an alternate recipient to receive the goods on your behalf, handover to that individual constitutes completed delivery.',
        ],
    },
    {
        id: 'failed-delivery',
        title: '4. Unsuccessful Delivery Attempts',
        paragraphs: [
            'Our delivery personnel will make up to two (2) attempts to deliver your parcel.',
            'If delivery cannot be completed due to incorrect address information, lack of phone response, or recipient unavailability, the parcel will be held at our central distribution hub for three (3) days for customer collection before being cancelled and refunded (less courier dispatch fees).',
        ],
    },
    {
        id: 'risk-of-loss',
        title: '5. Risk of Loss & Inspection',
        paragraphs: [
            'Title and risk of loss transfer to the customer once the courier hands over the parcel. Customers are strongly encouraged to inspect package integrity immediately upon receipt.',
            'In the rare event of a missing item or transit damage, please report the issue within 48 hours to gmartofficial@gmail.com with photos of the package label and contents.',
        ],
    },
]

function ShippingPolicy() {
    return (
        <LegalPage
            eyebrow="Logistics &amp; Delivery"
            title="Shipping &amp; Delivery Policy"
            description="Details on G-mart delivery coverage, order processing windows, handover protocols, and shipping fees."
            effectiveDate="October 14, 2026"
            version="1.0"
            sections={sections}
        />
    )
}

export default ShippingPolicy
