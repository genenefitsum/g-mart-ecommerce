import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { apiListProducts } from "@/lib/api";

const CATEGORY_ID_TO_NAME = {
  mens: "Men's",
  womens: "Women's",
  accessories: "Accessories",
  sale: "Sale",
};

const normalizeProduct = (product) => {
  const id = String(product?._id ?? product?.id ?? "");
  return {
    id,
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: Number(product?.price ?? 0),
    originalPrice:
      typeof product?.originalPrice === "number" ? product.originalPrice : undefined,
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
    </svg>`,
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

export default function CategoryProductsPage({ searchQuery = "" }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const categoryName = CATEGORY_ID_TO_NAME[categoryId] ?? "";

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiListProducts({ category: categoryName || undefined });
        if (!data?.ok) throw new Error(data?.error || "Failed to load products");
        const list = Array.isArray(data.products)
          ? data.products.map(normalizeProduct).filter((p) => p.id)
          : [];
        if (cancelled) return;
        setProducts(list);
      } catch (err) {
        if (cancelled) return;
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load products";
        setLoadError(message);
        setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryName]);

  const query = searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!query) return products;
    return products.filter((product) => {
      const haystack = `${product.name} ${product.category}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, query]);

  return (
    <section className="scroll-mt-32 py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8 lg:mb-10">
          <div className="mb-5 flex items-center justify-start">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-montserrat"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/");
              }}
            >
              <ArrowLeft />
              Back
            </Button>
          </div>

          <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 font-montserrat">
            {categoryName || "Products"}
          </h1>
          <p className="font-montserrat text-gray-400">
            {categoryName
              ? `Products in ${categoryName}`
              : "Browse products"}
          </p>
          {query ? (
            <p className="mt-4 text-sm text-gray-500 font-montserrat">
              Showing {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"} for “{searchQuery}”
            </p>
          ) : null}
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl">
          {isLoading ? (
            <div className="text-center text-gray-500 font-montserrat py-10">Loading products…</div>
          ) : loadError ? (
            <div className="text-center text-gray-500 font-montserrat py-10">{loadError}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 font-montserrat py-10">No products found.</div>
          ) : (
            <ProductsGrid products={filteredProducts} onAddToCart={addToCart} />
          )}
        </div>
      </div>
    </section>
  );
}

function ProductsGrid({ products, onAddToCart }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const visibleProducts = showAll ? products : products.slice(0, 8);

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
                onClick={() => navigate(`/product/${product.id}`)}
                aria-label="View product details"
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

              {product.badge ? (
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
              ) : null}

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
              <h3 className="mt-1 text-sm font-semibold text-gray-900 font-montserrat leading-snug line-clamp-2">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </button>
              </h3>

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
                {typeof product.originalPrice === "number" &&
                product.originalPrice > product.price ? (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!showAll && products.length > 8 ? (
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
      ) : null}

      {showAll && products.length > 8 ? (
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
      ) : null}
    </div>
  );
}
