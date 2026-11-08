import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { cn, formatBirr } from "@/lib/utils";
import { toErrorMessage } from "@/lib/errors";

const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="20">
      No image
    </text>
  </svg>`
)}`;

export default function WishlistSideBar() {
  const navigate = useNavigate();
  const { items, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, totalItems, isLoading, error } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = async (item) => {
    if (!item?.canAddToCart) {
      return;
    }

    addToCart({
      id: String(item?.id ?? ""),
      name: item?.name ?? "",
      price: Number(item?.price ?? 0),
      image: item?.image ?? "",
      category: item?.category ?? "",
      canAddToCart: Boolean(item?.canAddToCart),
    });

    await removeFromWishlist(item?.id);
    setIsWishlistOpen(false);
  };

  useEffect(() => {
    if (!isWishlistOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsWishlistOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isWishlistOpen, setIsWishlistOpen]);

  const handleOpenProduct = (id) => {
    if (!id) return;
    setIsWishlistOpen(false);
    navigate(`/product/${id}`);
  };

  const startShopping = () => {
    setIsWishlistOpen(false);
    const section = document.getElementById("products") || document.getElementById("categories");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "hidden sm:block fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] transition-opacity",
          isWishlistOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsWishlistOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-[100dvh] w-screen max-w-none bg-white z-[81] shadow-xl transition-transform duration-300 sm:w-full sm:max-w-md",
          isWishlistOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <Heart />
              <h2 className="text-lg font-semibold">Wishlist</h2>
              <span className="bg-blue-600 text-white text-sm px-2 rounded-full">{totalItems}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
              aria-label="Close wishlist"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="text-center text-gray-500 font-montserrat py-10">Loading wishlist…</div>
            ) : null}

            {!isLoading && error ? (
              <div className="text-center text-gray-500 font-montserrat py-6">{toErrorMessage(error, "")}</div>
            ) : null}

            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center font-montserrat">
                <Heart size={48} className="opacity-40 mb-4" />
                <p>
                  Your wishlist is empty <br />
                  <span className="text-gray-500 font-light">Save items to explore later.</span>
                </p>

                <button
                  type="button"
                  onClick={startShopping}
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-montserrat font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <button
                      type="button"
                      onClick={() => handleOpenProduct(item.id)}
                      className="shrink-0 rounded-lg overflow-hidden border border-gray-100 hover:opacity-90 transition"
                      aria-label={`View ${item.name}`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(item.id)}
                        className="text-left font-medium text-gray-900 hover:text-blue-600 transition line-clamp-1 text-sm sm:text-base"
                      >
                        {item.name}
                      </button>
                      <p className="text-sm text-gray-500 mt-0.5">{formatBirr(item.price ?? 0)}</p>
                      {item.category ? (
                        <p className="mt-1 text-xs text-gray-400 font-montserrat uppercase">{item.category}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => moveToCart(item)}
                        disabled={!item?.canAddToCart}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-montserrat font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ShoppingCart size={14} />
                        {item?.canAddToCart ? 'Move to cart' : 'Wishlist only'}
                      </button>
                    </div>

                    <div className="flex flex-col justify-start items-end">
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                        aria-label="Remove item from wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
