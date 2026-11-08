import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn, formatBirr } from "@/lib/utils";

const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="20">
      No image
    </text>
  </svg>`
)}`;

export default function CartSideBar({ onCheckout }) {
  const navigate = useNavigate();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalItems,
  } = useCart();

  useEffect(() => {
    if (!isCartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleOpenProduct = (id) => {
    if (!id) return;
    setIsCartOpen(false);
    navigate(`/product/${id}`);
  };

  const startShopping = () => {
    setIsCartOpen(false);
    const section =
      document.getElementById("products") ||
      document.getElementById("categories");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

    return (
        <>
      {/* Backdrop */}
        <div
            className={cn(
                    // On mobile the cart is full-screen, so the backdrop isn't needed.
                    "hidden sm:block fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] transition-opacity",
            isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsCartOpen(false)}
        />

      {/* Sidebar */}
        <aside
            className={cn(
            // Mobile: full-screen (page-like). Desktop/tablet: right-side drawer.
            "fixed top-0 right-0 h-[100dvh] w-screen max-w-none bg-white z-[81] shadow-xl transition-transform duration-300 sm:w-full sm:max-w-md",
            isCartOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                <ShoppingBag />
                    <h2 className="text-lg font-semibold">Your Cart</h2>
                    <span className="bg-blue-600 text-white text-sm px-2 rounded-full">
                        {totalItems}
                    </span>
            </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
            </div>

          {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
                {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center font-montserrat">
                    <ShoppingBag size={48} className="opacity-40 mb-4" />
                    <p>Your cart is empty <br />
                    <span className="text-gray-500 font-light">
                        Looks like you haven't added any items yet.
                    </span>
                    
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
                        <p className="text-sm text-gray-500 mt-0.5">
                            {formatBirr(item.price)}
                        </p>

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                        }
                        className="border rounded-md w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
                        aria-label="Decrease quantity"
                        >
                        <Minus size={14} />
                        </button>

                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>

                        <button
                            type="button"
                            onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                            }
                            className="border rounded-md w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
                            aria-label="Increase quantity"
                        >
                        <Plus size={14} />
                        </button>
                    </div>
                    </div>

                    <div className="flex flex-col justify-between items-end h-20">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                      aria-label="Remove item from cart"
                    >
                        <Trash2 size={16} />
                    </button>
                    <span className="font-semibold text-sm">
                        {formatBirr(item.price * item.quantity)}
                    </span>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>

          {/* Footer */}
            {items.length > 0 && (
            <div className="border-t p-5 space-y-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span>{formatBirr(totalPrice)}</span>
                </div>
                <button
                    type="button"
                    className="w-full bg-black text-white py-3 rounded"
                    onClick={() => {
                        setIsCartOpen(false)
                        if (typeof onCheckout === 'function') onCheckout()
                    }}
                >
                    Checkout
                </button>
            </div>
            )}
    </div>
    </aside>
    </>
    );
}