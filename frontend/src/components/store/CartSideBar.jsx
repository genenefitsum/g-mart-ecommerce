import { useEffect } from "react";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export default function CartSideBar({ onCheckout }) {
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
    return () => {
        document.body.style.overflow = previousOverflow;
    };
}, [isCartOpen]);

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
                <button onClick={() => setIsCartOpen(false)}>
                    <X />
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
                    <div key={item.id} className="flex gap-4">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                    />

                    <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                            ${item.price}
                        </p>

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                        }
                        className="border rounded w-7 h-7 flex items-center justify-center"
                        >
                        <Minus size={14} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                            onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                            }
                            className="border rounded w-7 h-7 flex items-center justify-center"
                        >
                        <Plus size={14} />
                        </button>
                    </div>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                    <button onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                    </button>
                    <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
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
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
                <button
                    type="button"
                    className="w-full bg-black text-white py-3 rounded"
                    onClick={() => {
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