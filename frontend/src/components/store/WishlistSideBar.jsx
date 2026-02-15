import { useEffect } from "react";
import { X, Heart, Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { toErrorMessage } from "@/lib/errors";

export default function WishlistSideBar() {
  const { items, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, totalItems, isLoading, error } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = async (item) => {
    addToCart({
      id: String(item?.id ?? ""),
      name: item?.name ?? "",
      price: Number(item?.price ?? 0),
      image: item?.image ?? "",
      category: item?.category ?? "",
    });

    await removeFromWishlist(item?.id);
    setIsWishlistOpen(false);
  };

  useEffect(() => {
    if (!isWishlistOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWishlistOpen]);

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
            <button onClick={() => setIsWishlistOpen(false)}>
              <X />
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
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />

                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">${Number(item.price ?? 0)}</p>
                      {item.category ? (
                        <p className="mt-1 text-xs text-gray-400 font-montserrat uppercase">{item.category}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => moveToCart(item)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-montserrat font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        <ShoppingCart size={16} />
                        Move to cart
                      </button>
                    </div>

                    <div className="flex flex-col justify-start items-end">
                      <button onClick={() => removeFromWishlist(item.id)} aria-label="Remove">
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
