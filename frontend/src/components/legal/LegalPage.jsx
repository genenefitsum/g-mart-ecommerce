import { ArrowLeft, Building2, Calendar, FileText, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const legalLinks = [
    { label: 'Terms and Conditions', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Refund & Returns', to: '/returns' },
    { label: 'Shipping Policy', to: '/shipping' },
    { label: 'Seller Terms', to: '/seller-terms' },
]

const defaultCompany = {
    companyName: 'G-mart E-Commerce PLC',
    registeredAddress: 'Bole Sub-City, Addis Ababa, Ethiopia',
    registrationNumber: 'ET-MTR-2024-00918',
    taxId: 'TIN-008291823',
    legalEmail: 'gmartofficial@gmail.com',
}

function LegalPage({
    eyebrow,
    title,
    description,
    effectiveDate = 'October 14, 2026',
    version = '1.0',
    sections = [],
    companyInfo = defaultCompany,
    backFallbackTo = '/',
}) {
    const navigate = useNavigate()
    const location = useLocation()

    const onBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            return
        }

        navigate(backFallbackTo)
    }

    const company = { ...defaultCompany, ...companyInfo }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header section */}
            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.06),_transparent_35%)]" />
                <div className="container relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <Button type="button" variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-1.5" />
                            Back
                        </Button>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-montserrat">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 border border-blue-200">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Official Legal Policy
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                Effective: {effectiveDate}
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                Version {version}
                            </span>
                        </div>
                    </div>

                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 font-montserrat">
                            {eyebrow}
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 font-montserrat sm:text-4xl lg:text-5xl">
                            {title}
                        </h1>
                        <p className="mt-4 text-base leading-7 text-slate-600 font-montserrat sm:text-lg">
                            {description}
                        </p>
                    </div>

                    {/* Navigation tabs between policies */}
                    <nav className="mt-8 flex flex-wrap gap-2 border-t border-slate-200/80 pt-6">
                        {legalLinks.map((link) => {
                            const isActive = location.pathname === link.to
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold font-montserrat transition ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </section>

            {/* Content & Sidebar Grid */}
            <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Main Sections */}
                    <div className="grid gap-6 lg:col-span-8">
                        {sections.map((section) => (
                            <article
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8"
                            >
                                <h2 className="text-xl font-semibold tracking-tight text-slate-950 font-montserrat sm:text-2xl">
                                    {section.title}
                                </h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="mt-4 text-sm leading-7 text-slate-600 font-montserrat sm:text-base"
                                    >
                                        {paragraph}
                                    </p>
                                ))}

                                {section.items?.length ? (
                                    <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 font-montserrat sm:text-base">
                                        {section.items.map((item) => (
                                            <li key={item} className="flex gap-3">
                                                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-blue-600" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </article>
                        ))}
                    </div>

                    {/* Sidebar with Table of Contents & Business Imprint */}
                    <aside className="space-y-6 lg:col-span-4">
                        {/* Table of contents */}
                        <div className="sticky top-24 space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-montserrat">
                                    Table of Contents
                                </h3>
                                <ul className="mt-4 space-y-2.5 text-xs text-slate-600 font-montserrat">
                                    {sections.map((s) => (
                                        <li key={s.id}>
                                            <a
                                                href={`#${s.id}`}
                                                className="block truncate py-1 text-slate-600 transition hover:text-blue-600"
                                            >
                                                {s.title}
                                            </a>
                                        </li>
                                    ))}
                                    <li>
                                        <a
                                            href="#legal-imprint"
                                            className="block truncate py-1 text-slate-600 transition hover:text-blue-600"
                                        >
                                            Legal Entity &amp; Notice
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal Entity & Notice */}
                            <div id="legal-imprint" className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-950 font-montserrat">
                                    <Building2 className="h-4 w-4 text-blue-700" />
                                    Legal Entity &amp; Imprint
                                </div>
                                <div className="mt-4 space-y-3 text-xs leading-5 text-slate-700 font-montserrat">
                                    <div>
                                        <div className="font-semibold text-slate-900">Entity:</div>
                                        <div>{company.companyName}</div>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-blue-700 flex-shrink-0" />
                                        <div>{company.registeredAddress}</div>
                                    </div>
                                    {company.registrationNumber ? (
                                        <div>
                                            <span className="font-semibold text-slate-900">Registration:</span> {company.registrationNumber}
                                        </div>
                                    ) : null}
                                    {company.taxId ? (
                                        <div>
                                            <span className="font-semibold text-slate-900">Tax ID / TIN:</span> {company.taxId}
                                        </div>
                                    ) : null}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <Mail className="h-3.5 w-3.5 text-blue-700" />
                                        <a
                                            className="font-medium text-blue-700 hover:underline"
                                            href={`mailto:${company.legalEmail}`}
                                        >
                                            {company.legalEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    )
}

export default LegalPage