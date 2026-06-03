import { Link } from 'react-router-dom'
import { FaInstagram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";

const Footer = () => {
    return (
        <>
            <section id="contact" className="bg-black text-white">
                <div className="container mx-auto px-4 py-10 lg:py-16">
                    <div className="mx-auto w-full max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Left: Contact */}
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-bold font-montserrat">Get in touch</h2>
                                <p className="mt-4 text-white/70 text-sm font-montserrat max-w-md">
                                    Have a question or feedback? Send us a message we’d love to hear from you.
                                </p>

                                <form
                                    className="mt-6 space-y-3 max-w-sm mx-0 sm:mx-auto lg:mx-0"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <div>
                                        <label className="sr-only" htmlFor="footer-name">Name</label>
                                        <input
                                            id="footer-name"
                                            name="name"
                                            type="text"
                                            placeholder="Name"
                                            autoComplete="name"
                                            className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3.5 text-[13px] font-montserrat text-white placeholder:text-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="sr-only" htmlFor="footer-email">Email</label>
                                        <input
                                            id="footer-email"
                                            name="email"
                                            type="email"
                                            placeholder="Email"
                                            autoComplete="email"
                                            className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3.5 text-[13px] font-montserrat text-white placeholder:text-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="sr-only" htmlFor="footer-message">Message</label>
                                        <textarea
                                            id="footer-message"
                                            name="message"
                                            placeholder="Message"
                                            rows={1}
                                            className="w-full h-10 resize-none rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-[13px] font-montserrat text-white placeholder:text-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-montserrat font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                                    >
                                        Send message
                                    </button>
                                </form>

                            </div>

                            {/* Right: Follow / Info */}
                            <div className="lg:pl-6 lg:pt-12">
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                                    <h3 className="text-lg font-semibold font-montserrat">Follow us on Instagram</h3>
                                    <p className="mt-3 text-sm text-white/70 font-montserrat">
                                        Stay updated with new drops and featured picks.
                                    </p>

                                    <div className="mt-5 flex items-center gap-3">
                                        <a
                                            href="#"
                                            aria-label="Instagram"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/90 transition hover:bg-white/10"
                                        >
                                            <FaInstagram className="h-[18px] w-[18px]" />
                                        </a>
                                        <a
                                            href="#"
                                            aria-label="X"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/90 transition hover:bg-white/10"
                                        >
                                            <FaXTwitter className="h-[18px] w-[18px]" />
                                        </a>
                                        <a
                                            href="#"
                                            aria-label="WhatsApp"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/90 transition hover:bg-white/10"
                                        >
                                            <FaWhatsapp className="h-[18px] w-[18px]" />
                                        </a>
                                    </div>

                                    <div className="mt-8 border-t border-white/10 pt-6">
                                        <p className="text-sm text-white/70 font-montserrat">
                                            <span className="text-white font-semibold">G-mart</span>
                                            <br />
                                            <a
                                                className="underline-offset-4 hover:underline"
                                                href="mailto:gmartofficial@gmail.com"
                                            >
                                                gmartofficial@gmail.com
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-7 grid grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-sm font-semibold font-montserrat">Shop</p>
                                        <ul className="mt-3 space-y-2 text-sm text-white/70 font-montserrat">
                                            <li><Link className="hover:text-white" to="/#products">Products</Link></li>
                                            <li><Link className="hover:text-white" to="/#categories">Categories</Link></li>
                                            <li><Link className="hover:text-white" to="/#products">New arrivals</Link></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold font-montserrat">Support</p>
                                        <ul className="mt-3 space-y-2 text-sm text-white/70 font-montserrat">
                                            <li><Link className="hover:text-white" to="/terms#shipping">Shipping</Link></li>
                                            <li><Link className="hover:text-white" to="/terms#returns">Returns</Link></li>
                                            <li><Link className="hover:text-white" to="/privacy">Privacy</Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-white/60 font-montserrat">
                                © {new Date().getFullYear()} G-mart. All rights reserved.
                            </p>
                            <div className="flex items-center gap-5 text-sm text-white/60 font-montserrat">
                                <Link className="hover:text-white" to="/terms">Terms</Link>
                                <Link className="hover:text-white" to="/privacy">Privacy</Link>
                                <Link className="hover:text-white" to="/privacy#cookies">Cookies</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )

}

export default Footer