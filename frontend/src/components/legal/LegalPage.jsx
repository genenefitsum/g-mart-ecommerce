import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const defaultContactEmail = 'gmartofficial@gmail.com'

function LegalPage({
    eyebrow,
    title,
    description,
    updatedLabel,
    sections,
    contactEmail = defaultContactEmail,
    backFallbackTo = '/',
}) {
    const navigate = useNavigate()

    const onBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            return
        }

        navigate(backFallbackTo)
    }

    return (
        <main className="bg-slate-50 text-slate-900">
            <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_32%)]" />
                <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
                    <div className="max-w-3xl">
                        <div className="mb-6">
                            <Button type="button" variant="outline" onClick={onBack}>
                                <ArrowLeft />
                                Back
                            </Button>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 font-montserrat">
                            {eyebrow}
                        </p>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 font-montserrat sm:text-4xl lg:text-5xl">
                            {title}
                        </h1>
                        <p className="mt-5 text-base leading-7 text-slate-600 font-montserrat sm:text-lg">
                            {description}
                        </p>
                        {updatedLabel ? (
                            <p className="mt-4 text-sm text-slate-500 font-montserrat">
                                {updatedLabel}
                            </p>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
                <div className="grid gap-5 lg:gap-6">
                    {sections.map((section) => (
                        <article
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8"
                        >
                            <div className="max-w-3xl">
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
                            </div>
                        </article>
                    ))}

                    <article
                        id="contact"
                        className="scroll-mt-28 rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8"
                    >
                        <div className="max-w-3xl">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-950 font-montserrat sm:text-2xl">
                                Contact
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-slate-600 font-montserrat sm:text-base">
                                If you have questions about these policies, contact us at{' '}
                                <a className="font-medium text-blue-700 hover:underline" href={`mailto:${contactEmail}`}>
                                    {contactEmail}
                                </a>
                                .
                            </p>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    )
}

export default LegalPage