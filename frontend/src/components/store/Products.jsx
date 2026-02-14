import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ShoppingCart, SlidersHorizontal, Star, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { apiListProducts } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const normalizeProduct = (product) => {
    const id = String(product?._id ?? product?.id ?? "");
    return {
        id,
        name: product?.name ?? "",
        category: product?.category ?? "",
        price: Number(product?.price ?? 0),
        originalPrice: typeof product?.originalPrice === "number" ? product.originalPrice : undefined,
        rating: typeof product?.rating === "number" ? product.rating : 0,
        reviewCount: typeof product?.reviewCount === "number" ? product.reviewCount : 0,
        featured: Boolean(product?.featured),
        badge: product?.badge ?? undefined,
        image: product?.imageUrl ?? product?.image ?? "",
        sellerPayment: {
            telebirrPhone: product?.sellerPayment?.telebirrPhone ?? "",
            bankName: product?.sellerPayment?.bankName ?? "",
            bankAccountNumber: product?.sellerPayment?.bankAccountNumber ?? "",
            bankAccountName: product?.sellerPayment?.bankAccountName ?? "",
        },
    };
};

const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect width="800" height="800" fill="#f3f4f6"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="28">
                Image unavailable
            </text>
    </svg>`
)}`;

const formatPrice = (value) => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `$${value}`;
    }
};

const Products = ({ searchQuery = "", refreshKey = 0 }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, hasInWishlist } = useWishlist();
    const navigate = useNavigate();
    
    const handleWishlist = async (product) => {
        await toggleWishlist(product);
    };

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setIsLoading(true);
            setLoadError("");

            try {
                const data = await apiListProducts();
                if (!data?.ok) throw new Error(data?.error || "Failed to load products");
                const list = Array.isArray(data.products) ? data.products.map(normalizeProduct).filter((p) => p.id) : [];
                if (cancelled) return;
                setProducts(list);
            } catch (err) {
                if (cancelled) return;
                const message = err?.response?.data?.error || err?.message || "Failed to load products";
                setLoadError(message);
                setProducts([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    const categories = useMemo(() => {
        const set = new Set(products.map((p) => p.category).filter(Boolean));
        return ["All Products", ...Array.from(set)];
    }, [products]);

    const [activeCategory, setActiveCategory] = useState("All Products");
    const [sortMode, setSortMode] = useState("featured");

    useEffect(() => {
        if (activeCategory === "All Products") return;
        if (categories.includes(activeCategory)) return;
        setActiveCategory("All Products");
    }, [activeCategory, categories]);

    const query = searchQuery.trim().toLowerCase();

    const filteredSortedProducts = useMemo(() => {
        const base = products
            .filter((product) => {
                if (activeCategory !== "All Products" && product.category !== activeCategory) {
                    return false;
                }
                if (!query) return true;
                const haystack = `${product.name} ${product.category}`.toLowerCase();
                return haystack.includes(query);
            })
            .slice();

        const byPriceAsc = (a, b) => a.price - b.price;
        const byPriceDesc = (a, b) => b.price - a.price;
        const byRatingDesc = (a, b) => (b.rating ?? 0) - (a.rating ?? 0);
        const byFeatured = (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured));

        if (sortMode === "high") base.sort(byPriceDesc);
        else if (sortMode === "low") base.sort(byPriceAsc);
        else if (sortMode === "rating") base.sort(byRatingDesc);
        else base.sort((a, b) => byFeatured(a, b) || byRatingDesc(a, b));

        return base;
    }, [activeCategory, query, sortMode, products]);

    const viewKey = `${activeCategory}__${sortMode}__${query}`;

    const sortLabel =
        sortMode === "featured"
            ? "Featured"
            : sortMode === "high"
                ? "High price"
                : sortMode === "low"
                    ? "Low price"
                    : "Best rated";

    return (
        <section id="products" className="scroll-mt-32 py-16 lg:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10 lg:mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 font-montserrat">
                        Featured Products
                    </h2>
                    <p className="font-montserrat text-gray-400">
                        Handpicked products that combine quality with
                        <br />
                        exceptional value.
                    </p>
                    {(searchQuery.trim() || activeCategory !== "All Products") && (
                        <p className="mt-4 text-sm text-gray-500 font-montserrat">
                            Showing {filteredSortedProducts.length} result{filteredSortedProducts.length === 1 ? "" : "s"}
                            {searchQuery.trim() ? ` for “${searchQuery}”` : ""}
                            {activeCategory !== "All Products" ? ` in ${activeCategory}` : ""}
                        </p>
                    )}
                </div>

                <div className="mx-auto w-full max-w-6xl flex flex-col gap-4 lg:gap-5">
                    {/* Top controls */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {categories.map((cat) => {
                                const active = cat === activeCategory;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(cat);
                                        }}
                                        className={
                                            "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold font-montserrat transition " +
                                            (active
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                                        }
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 justify-between md:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl font-montserrat"
                                onClick={() => {
                                    // Reserved for future multi-filter panel.
                                }}
                            >
                                <SlidersHorizontal />
                                Filters
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" className="rounded-xl font-montserrat">
                                        {sortLabel}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[220px]">
                                    <DropdownMenuLabel>Sort</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={sortMode}
                                        onValueChange={(value) => {
                                            setSortMode(value);
                                        }}
                                    >
                                        <DropdownMenuRadioItem value="featured">Featured (default)</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="high">High price</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="low">Low price</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="rating">Best rated</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Grid */}
                    <ProductsGrid
                        key={viewKey}
                        products={filteredSortedProducts}
                        searchQuery={searchQuery}
                        isLoading={isLoading}
                        error={loadError}
                        onAddToCart={(product) => addToCart(product)}
                        onToggleWishlist={handleWishlist}
                        hasInWishlist={hasInWishlist}
                        onOpenProduct={(id) => navigate(`/product/${id}`)}
                    />
                </div>
            </div>
        </section>
    );
};

const ProductsGrid = ({ products, searchQuery, isLoading, error, onAddToCart, onToggleWishlist, hasInWishlist, onOpenProduct }) => {
    const [showAll, setShowAll] = useState(false);
    const visibleProducts = showAll ? products : products.slice(0, 8);

    if (isLoading) {
        return (
            <div className="text-center text-gray-500 font-montserrat py-10">
                Loading products…
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-gray-500 font-montserrat py-10">
                {error}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center text-gray-500 font-montserrat py-10">
                No products found{searchQuery.trim() ? ` for “${searchQuery}”.` : "."}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {visibleProducts.map((product) => (
                    <article
                        key={product.id}
                        className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition"
                    >
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                            <button
                                type="button"
                                className="block w-full"
                                onClick={() => {
                                    if (typeof onOpenProduct === 'function') onOpenProduct(product.id)
                                }}
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.src = fallbackImage;
                                    }}
                                />
                            </button>

                            {product.badge && (
                                <span
                                    className={
                                        "absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-semibold " +
                                        (product.badge.type === "discount"
                                            ? "bg-red-500 text-white"
                                            : "bg-black text-white")
                                    }
                                >
                                    {product.badge.text}
                                </span>
                            )}

                            {/* Wishlist heart (mobile always visible, desktop on hover) */}
                            <button
                                type="button"
                                aria-label="Toggle wishlist"
                                onClick={() =>
                                    onToggleWishlist({
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        image: product.image,
                                        category: product.category,
                                    })
                                }
                                className={
                                    "absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/90 ring-1 ring-black/5 w-9 h-9 transition-colors " +
                                    "text-gray-800 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 " +
                                    "opacity-100 translate-y-0 " +
                                    "md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0"
                                }
                            >
                                <Heart
                                    size={18}
                                    className={
                                        hasInWishlist?.(product.id)
                                            ? "fill-current"
                                            : ""
                                    }
                                />
                            </button>

                            {/* Add to cart overlay (mobile always visible, desktop on hover) */}
                            <div
                                className={
                                    "absolute inset-x-3 bottom-3 transition " +
                                    "opacity-100 translate-y-0 " +
                                    "md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 " +
                                    "md:pointer-events-none md:group-hover:pointer-events-auto"
                                }
                            >
                                <Button
                                    type="button"
                                    className="w-full rounded-xl font-montserrat bg-blue-600 hover:bg-blue-700"
                                    onClick={() =>
                                        onAddToCart({
                                            id: product.id,
                                            name: product.name,
                                            price: product.price,
                                            image: product.image,
                                            category: product.category,
                                            sellerPayment: product.sellerPayment,
                                        })
                                    }
                                >
                                    <ShoppingCart />
                                    Add to cart
                                </Button>
                            </div>
                        </div>

                        <div className="p-3 lg:p-3.5">
                            <p className="text-[10px] tracking-wide text-gray-500 font-montserrat uppercase">
                                {product.category}
                            </p>
                            <button
                                type="button"
                                className="mt-1 block w-full text-left"
                                onClick={() => {
                                    if (typeof onOpenProduct === 'function') onOpenProduct(product.id)
                                }}
                            >
                                <h3 className="text-sm font-semibold text-gray-900 font-montserrat leading-snug line-clamp-2">
                                    {product.name}
                                </h3>
                            </button>

                            <div className="mt-2 flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="fill-amber-500" />
                                    <span className="text-gray-900 font-semibold">
                                        {Number(product.rating ?? 0).toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-gray-400">({product.reviewCount ?? 0})</span>
                            </div>

                            <div className="mt-2.5 flex items-end gap-2">
                                <span className="text-gray-900 font-semibold">
                                    {formatPrice(product.price)}
                                </span>
                                {typeof product.originalPrice === "number" && product.originalPrice > product.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                        {formatPrice(product.originalPrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {!showAll && products.length > 8 && (
                <div className="flex justify-center mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl font-montserrat"
                        onClick={() => setShowAll(true)}
                    >
                        View all products ({products.length})
                        <ChevronDown />
                    </Button>
                </div>
            )}

            {showAll && products.length > 8 && (
                <div className="flex justify-center mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl font-montserrat"
                        onClick={() => setShowAll(false)}
                    >
                        View featured
                        <ChevronUp />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Products;