import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, User, Heart, ShoppingBag, Menu, X, MessageCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddProductDialog from "@/components/store/AddProductDialog";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useLocation, useNavigate } from "react-router-dom";
import { apiListMyProductInterests, apiMarkMyProductInterestsRead } from "@/lib/api";
import { toErrorMessage } from "@/lib/errors";

const CATEGORIES_FOR_SEARCH = [
  { id: "categories", name: "Categories", description: "Browse all categories" },
  { id: "mens", name: "Men's", description: "Shop the collection" },
  { id: "womens", name: "Women's", description: "Shop the collection" },
  { id: "accessories", name: "Accessories", description: "Shop the collection" },
  { id: "sale", name: "Sale", description: "Up to 50% off" },
];

const PRODUCTS_FOR_SEARCH = [
  { id: "products", name: "Featured Products", category: "Products" },
  { id: "p1", name: "Classic White Sneakers", category: "Footwear" },
  { id: "p2", name: "Minimal Leather Backpack", category: "Accessories" },
  { id: "p3", name: "Denim Jacket", category: "Men's" },
  { id: "p4", name: "Everyday Tote Bag", category: "Women's" },
];

const navLinks = [
  { name: "Shop", id: "products", hasDropdown: true },
  { name: "Categories", id: "categories", hasDropdown: true },
  { name: "About Us", id: "about" },
  { name: "Contact", id: "contact" },
];

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatInterestMode(mode) {
  return mode === "with_contact" ? "Notify + contact info" : "Notify only";
}

const Header = ({ searchQuery = "", onSearch, onAuthOpen, onProductCreated }) => {
  const { setIsCartOpen, totalItems } = useCart();
  const { setIsWishlistOpen, totalItems: totalWishlistItems } = useWishlist();
  const { user } = useAuth();
  const userId = String(user?._id ?? user?.id ?? "").trim();
  const isAdmin = String(user?.role ?? "").toLowerCase() === "admin";
  const isSeller = String(user?.role ?? "").toLowerCase() === "seller";
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [sellerInterests, setSellerInterests] = useState([]);
  const [sellerInterestsLoading, setSellerInterestsLoading] = useState(false);
  const [sellerInterestsError, setSellerInterestsError] = useState("");
  const searchInputRef = useRef(null);

  const openAuth = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    if (typeof onAuthOpen === "function") onAuthOpen();
  };

  const openCart = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsCartOpen(true);
  };

  const openWishlist = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsWishlistOpen(true);
  };

  const openAccount = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    if (user) {
      navigate("/account");
      return;
    }
    openAuth();
  };

  const openAdmin = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    navigate("/admin");
  };

  const openMessages = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsMessagesOpen(true);
  };

  const loadSellerInterests = useCallback(
    async ({ withLoader = false } = {}) => {
      if (!userId || !isSeller) {
        setSellerInterests([]);
        setSellerInterestsError("");
        setSellerInterestsLoading(false);
        return;
      }

      if (withLoader) {
        setSellerInterestsLoading(true);
      }
      setSellerInterestsError("");

      try {
        const data = await apiListMyProductInterests();
        if (!data?.ok) throw new Error(data?.error || "Failed to load buyer interests");
        setSellerInterests(Array.isArray(data.interests) ? data.interests : []);
      } catch (err) {
        setSellerInterestsError(toErrorMessage(err, "Failed to load buyer interests"));
      } finally {
        if (withLoader) {
          setSellerInterestsLoading(false);
        }
      }
    },
    [isSeller, userId],
  );

  // Smooth scroll function
  const handleScroll = (id) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      setIsMobileMenuOpen(false);
      return;
    }

    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const openDesktopSearch = () => {
    setSearchValue(searchQuery);
    setIsDesktopSearchOpen(true);
  };

  const closeDesktopSearch = () => {
    setIsDesktopSearchOpen(false);
  };

  const openMobileSearch = () => {
    setSearchValue(searchQuery);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (typeof onSearch === "function") onSearch(searchValue);

    // On desktop, keep results in the header (no auto-scroll).
    // On mobile search overlay, keep the old behavior of jumping to products.
    if (!isMobileSearchOpen) return;
    const productsSection = document.getElementById("products");
    if (productsSection) productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!isDesktopSearchOpen && !isMobileSearchOpen) return;
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isDesktopSearchOpen, isMobileSearchOpen]);

  useEffect(() => {
    if (!isDesktopSearchOpen && !isMobileSearchOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDesktopSearch();
        closeMobileSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktopSearchOpen, isMobileSearchOpen]);

  useEffect(() => {
    if (!isMobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    loadSellerInterests({ withLoader: true });
  }, [loadSellerInterests]);

  useEffect(() => {
    if (!isMessagesOpen) return;
    loadSellerInterests();
  }, [isMessagesOpen, loadSellerInterests]);

  const searchText = searchValue.trim().toLowerCase();

  const productResults = useMemo(() => {
    if (!searchText) return [];
    return PRODUCTS_FOR_SEARCH.filter((p) => {
      const haystack = `${p.name} ${p.category}`.toLowerCase();
      return haystack.includes(searchText);
    }).slice(0, 6);
  }, [searchText]);

  const categoryResults = useMemo(() => {
    if (!searchText) return [];
    return CATEGORIES_FOR_SEARCH.filter((c) => {
      const haystack = `${c.name} ${c.description}`.toLowerCase();
      return haystack.includes(searchText);
    }).slice(0, 6);
  }, [searchText]);

  const unseenInterestIds = useMemo(() => {
    return sellerInterests
      .filter((item) => {
        const status = String(item?.status ?? "").toLowerCase();
        return status === "new";
      })
      .map((item) => String(item?._id ?? "").trim())
      .filter(Boolean);
  }, [sellerInterests]);

  const unseenInterestCount = unseenInterestIds.length;
  const shouldShowMessagesIcon = Boolean(user && isSeller && unseenInterestCount > 0);

  useEffect(() => {
    if (!isMessagesOpen || !isSeller || unseenInterestIds.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await apiMarkMyProductInterestsRead(unseenInterestIds);
        if (!data?.ok || cancelled) return;

        const seenIds = new Set(unseenInterestIds);
        setSellerInterests((current) =>
          current.map((item) => {
            const id = String(item?._id ?? "").trim();
            if (!id || !seenIds.has(id)) return item;
            return { ...item, status: "read" };
          }),
        );
      } catch {
        // no-op: message modal remains usable even if read-state sync fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMessagesOpen, isSeller, unseenInterestIds]);

  const setQuery = (next) => {
    setSearchValue(next);
    if (typeof onSearch === "function") onSearch(next);
  };

  const goToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Promo Bar */}
      <div className="bg-black text-white text-center py-2 px-4 text-xs sm:text-sm font-montserrat font-medium tracking-wide">
        All you need in one place, welcome to <span className="font-bold">G-mart</span>.
      </div>

      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="container mx-auto px-4 h-16 grid grid-cols-3 items-center">
            <div className="flex items-center justify-start">
              <Dialog
                open={isMobileMenuOpen}
                onOpenChange={(open) => {
                  setIsMobileMenuOpen(open);
                  if (open) setIsMobileSearchOpen(false);
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-xl transition"
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </DialogTrigger>

                <DialogContent
                  showClose
                  overlayClassName="z-[70] bg-black/20 backdrop-blur-md data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
                  className={
                    "z-[71] top-6 w-[min(92vw,720px)] max-w-none translate-y-0 " +
                    "rounded-3xl border border-black/5 bg-white/90 p-0 shadow-[0_30px_80px_rgba(0,0,0,0.12)] " +
                    "backdrop-blur-xl supports-[backdrop-filter]:bg-white/85 " +
                    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
                    "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
                  }
                >
                  <div className="px-5 pt-12 pb-5">
                    {/* Primary Mobile Navigation */}
                    <div className="mb-5 space-y-1">
                      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
                      {navLinks.map((link) => (
                        <button
                          key={link.name}
                          onClick={() => handleScroll(link.id)}
                          className="w-full flex items-center justify-between px-3.5 py-3 text-base font-medium text-gray-800 hover:text-black hover:bg-black/[0.04] active:bg-black/[0.08] rounded-xl transition"
                        >
                          <span>{link.name}</span>
                          <span className="text-gray-400 text-sm">→</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Quick Actions</p>
                      <div className={`grid ${isAdmin ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                        {user ? (
                          <button
                            className={
                              "min-h-[44px] py-3 px-3 rounded-2xl ring-1 ring-black/5 bg-white/80 " +
                              "text-gray-900 font-semibold hover:bg-black/[0.04] active:bg-black/[0.06] " +
                              "flex items-center justify-center gap-2 transition"
                            }
                            aria-label="Account"
                            onClick={openAccount}
                          >
                            Account
                          </button>
                        ) : (
                          <button
                            className={
                              "min-h-[44px] py-3 px-3 rounded-2xl ring-1 ring-black/5 bg-white/80 " +
                              "text-gray-900 font-semibold hover:bg-black/[0.04] active:bg-black/[0.06] " +
                              "flex items-center justify-center gap-2 transition"
                            }
                            aria-label="Sign in"
                            onClick={openAuth}
                          >
                            Sign in
                          </button>
                        )}

                        {isAdmin ? (
                          <button
                            className={
                              "min-h-[44px] py-3 px-3 rounded-2xl ring-1 ring-black/5 bg-white/80 " +
                              "text-gray-900 font-semibold hover:bg-black/[0.04] active:bg-black/[0.06] " +
                              "flex items-center justify-center gap-2 transition"
                            }
                            aria-label="Admin"
                            onClick={openAdmin}
                          >
                            Admin
                          </button>
                        ) : null}

                        <button
                          className={
                            "min-h-[44px] py-3 px-3 rounded-2xl ring-1 ring-black/5 bg-white/80 " +
                            "text-gray-900 font-semibold hover:bg-black/[0.04] active:bg-black/[0.06] " +
                            "flex items-center justify-center gap-2 transition"
                          }
                          aria-label="Wishlist"
                          onClick={openWishlist}
                        >
                          <Heart size={18} className="text-gray-700" />
                          Wishlist
                        </button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-center">
              <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-800">
                G-mart
              </a>
            </div>

            <div className="flex items-center justify-end gap-0.5">
              <button
                type="button"
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-xl transition"
                aria-label="Search"
                onClick={openMobileSearch}
              >
                <Search size={21} />
              </button>

              {user ? (
                <AddProductDialog
                  onCreated={onProductCreated}
                  onRequireAuth={onAuthOpen}
                  trigger={(
                    <button
                      type="button"
                      className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-xl transition"
                      aria-label="Add Product"
                      title="Add Product"
                    >
                      <Plus size={21} />
                    </button>
                  )}
                />
              ) : null}

              {shouldShowMessagesIcon ? (
                <button
                  type="button"
                  className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-xl transition"
                  aria-label="Messages"
                  onClick={openMessages}
                >
                  <span className="relative flex items-center">
                    <MessageCircle size={21} />
                    {unseenInterestCount > 0 ? (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">
                        {unseenInterestCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              ) : null}

              <button
                type="button"
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-xl transition"
                aria-label="Cart"
                onClick={() => {
                  openCart();
                }}
              >
                <span className="relative inline-flex">
                  <ShoppingBag size={21} />
                  {totalItems > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">
                      {totalItems}
                    </span>
                  ) : null}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop/tablet header */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 flex items-center justify-between h-16 lg:h-16">
            <a href="/" className="text-2xl lg:text-2xl font-extrabold tracking-tight text-gray-800">
              G-mart
            </a>

            <nav className="hidden md:flex items-center gap-8 font-montserrat">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleScroll(link.id)}
                  className="text-sm text-gray-600 hover:text-blue-500 flex items-center gap-1"
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown size={14} />}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="relative">
                {isDesktopSearchOpen ? (
                  <form onSubmit={submitSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={18} />
                      </span>
                      <input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search products..."
                        value={searchValue}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-56 lg:w-72 h-10 pl-10 pr-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />

                      {/* Desktop results dropdown (keeps results at the top) */}
                      {searchText ? (
                        <div className="absolute right-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/90 shadow-xl backdrop-blur-md">
                          <div className="max-h-[60vh] overflow-auto p-2">
                            {productResults.length === 0 && categoryResults.length === 0 ? (
                              <div className="px-3 py-3 text-sm text-gray-500 font-montserrat">
                                No results for “{searchValue}”.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {productResults.length > 0 && (
                                  <div>
                                    <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                                      Products
                                    </div>
                                    <div className="mt-1 space-y-1">
                                      {productResults.map((p) => (
                                        <button
                                          key={p.id}
                                          type="button"
                                          className="w-full text-left rounded-xl px-3 py-2 hover:bg-black/[0.04] active:bg-black/[0.06] transition"
                                          onClick={() => {
                                            setQuery(p.name);
                                            closeDesktopSearch();
                                            goToSection("products");
                                          }}
                                        >
                                          <div className="font-semibold text-gray-900">{p.name}</div>
                                          <div className="text-sm text-gray-500">{p.category}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {categoryResults.length > 0 && (
                                  <div>
                                    <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                                      Categories
                                    </div>
                                    <div className="mt-1 space-y-1">
                                      {categoryResults.map((c) => (
                                        <button
                                          key={c.id}
                                          type="button"
                                          className="w-full text-left rounded-xl px-3 py-2 hover:bg-black/[0.04] active:bg-black/[0.06] transition"
                                          onClick={() => {
                                            setQuery(c.name);
                                            closeDesktopSearch();
                                            goToSection("categories");
                                          }}
                                        >
                                          <div className="font-semibold text-gray-900">{c.name}</div>
                                          <div className="text-sm text-gray-500">{c.description}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                      onClick={closeDesktopSearch}
                      aria-label="Close search"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </form>
                ) : (
                  <button
                    className="p-2 text-gray-800 hover:bg-gray-100 hover:text-black hover:font-light rounded transition"
                    aria-label="Search"
                    title="Search"
                    onClick={openDesktopSearch}
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>

              {user ? (
                <AddProductDialog
                  onCreated={onProductCreated}
                  onRequireAuth={onAuthOpen}
                  trigger={(
                    <button
                      type="button"
                      className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                      aria-label="Add Product"
                      title="Add Product"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                />
              ) : null}

              {user ? (
                <>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-2 py-1 rounded border font-light border-gray-200 text-gray-900 font-montserrat text-sm hover:bg-gray-100 transition"
                      onClick={openAdmin}
                      aria-label="Admin"
                      title="Admin"
                    >
                      Admin
                    </button>
                  ) : null}

                  {shouldShowMessagesIcon ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                      aria-label="Messages"
                      title="Messages"
                      onClick={openMessages}
                    >
                      <span className="relative flex items-center">
                        <MessageCircle size={20} />
                        {unseenInterestCount > 0 ? (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">
                            {unseenInterestCount}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ) : null}

                  <button
                    className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                    aria-label="Account"
                    title="Account"
                    onClick={openAccount}
                  >
                    <User size={20} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-2 py-1 rounded border font-light border-gray-200 text-gray-900 font-montserrat text-sm hover:bg-gray-100 transition"
                  onClick={openAuth}
                  aria-label="Sign in / Sign up"
                  title="Sign in / Sign up"
                >
                  Sign in
                </button>
              )}

              <button
                className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                aria-label="Wishlist"
                onClick={openWishlist}
              >
                <span className="relative inline-flex">
                  <Heart size={20} />
                  {totalWishlistItems > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">
                      {totalWishlistItems}
                    </span>
                  ) : null}
                </span>
              </button>

              <button
                className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                aria-label="Cart"
                onClick={openCart}
              >
                <span className="relative inline-flex">
                  <ShoppingBag size={20} />
                  {totalItems > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">
                      {totalItems}
                    </span>
                  ) : null}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu now uses Dialog (top sheet) */}

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[60]">
            <button
              type="button"
              aria-label="Close search"
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeMobileSearch}
            />

            <div className="relative mx-auto mt-20 w-[min(92vw,720px)] rounded-2xl bg-white shadow-xl border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900 font-montserrat">Search</div>
                <button
                  type="button"
                  className="p-2 text-gray-800 hover:bg-gray-100 rounded transition"
                  aria-label="Close"
                  onClick={closeMobileSearch}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitSearch} className="p-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search products or categories..."
                    value={searchValue}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="mt-4 max-h-[55vh] overflow-auto">
                  {!searchText ? (
                    <div className="text-sm text-gray-500 font-montserrat">Start typing to see results.</div>
                  ) : productResults.length === 0 && categoryResults.length === 0 ? (
                    <div className="text-sm text-gray-500 font-montserrat">No results for “{searchValue}”.</div>
                  ) : (
                    <div className="space-y-4">
                      {productResults.length > 0 && (
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Products
                          </div>
                          <div className="space-y-1">
                            {productResults.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                                onClick={() => {
                                  closeMobileSearch();
                                  goToSection("products");
                                }}
                              >
                                <div className="font-semibold text-gray-900">{p.name}</div>
                                <div className="text-sm text-gray-500">{p.category}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {categoryResults.length > 0 && (
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                            Categories
                          </div>
                          <div className="space-y-1">
                            {categoryResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                                onClick={() => {
                                  closeMobileSearch();
                                  goToSection("categories");
                                }}
                              >
                                <div className="font-semibold text-gray-900">{c.name}</div>
                                <div className="text-sm text-gray-500">{c.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <Dialog open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
          <DialogContent
            showClose
            className="z-[71] top-6 w-[min(92vw,720px)] max-w-none translate-y-0 rounded-3xl border border-black/5 bg-white p-0 shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
            overlayClassName="z-[70] bg-black/20 backdrop-blur-md"
          >
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <div className="text-base font-semibold text-gray-900">Interested Buyers</div>

              {sellerInterestsLoading ? (
                <div className="mt-3 text-sm text-gray-600">Loading buyer interest notifications…</div>
              ) : sellerInterestsError ? (
                <div className="mt-3 text-sm text-red-600">{sellerInterestsError}</div>
              ) : sellerInterests.length === 0 ? (
                <div className="mt-3 text-sm text-gray-600">No buyer interest notifications yet.</div>
              ) : (
                <div className="mt-4 grid max-h-[65vh] gap-3 overflow-auto pr-1">
                  {sellerInterests.map((interest) => (
                    <div key={interest?._id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900">{interest?.product?.name || "Product"}</div>
                        <div className="text-xs text-gray-500">{formatDate(interest?.createdAt)}</div>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-gray-700">
                        <div>
                          <span className="text-gray-500">Mode:</span> {formatInterestMode(interest?.mode)}
                        </div>
                        <div>
                          <span className="text-gray-500">Buyer:</span> {interest?.buyer?.name || "Unknown"}
                        </div>
                        <div>
                          <span className="text-gray-500">Buyer email:</span> {interest?.buyer?.email || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span> {interest?.buyerContact?.phone || "Not provided"}
                        </div>
                        <div>
                          <span className="text-gray-500">Contact email:</span> {interest?.buyerContact?.email || "Not provided"}
                        </div>
                        {interest?.buyerContact?.note ? (
                          <div>
                            <span className="text-gray-500">Note:</span> {interest.buyerContact.note}
                          </div>
                        ) : null}
                      </div>

                      {interest?.product?.id ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-2 rounded border border-gray-200 text-gray-900 text-sm hover:bg-gray-100 transition"
                            onClick={() => {
                              setIsMessagesOpen(false);
                              navigate(`/product/${interest.product.id}`);
                            }}
                          >
                            Open product
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </header>
  );
};

export default Header;