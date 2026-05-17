import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, GripVertical, MinusCircle } from 'lucide-react';

interface CartItem {
  item: {
    id: string;
    name: string;
    price_per_day: number;
    category: string;
    image_url?: string;
    status: 'Available' | 'Rented' | 'Maintenance';
  };
  quantity: number;
}

interface DraggableCartProps {
  cartItems: CartItem[];
  cartTotal: number;
  totalCartItems: number;
  updateCartQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  setCartItems: (items: CartItem[]) => void;
  setShowCartDetails: (show: boolean) => void;
  showCartDetails: boolean;
  setShowCheckoutModal: (show: boolean) => void;
}

export default function DraggableCart({
  cartItems,
  cartTotal,
  totalCartItems,
  updateCartQuantity,
  removeFromCart,
  setCartItems,
  setShowCartDetails,
  showCartDetails,
  setShowCheckoutModal
}: DraggableCartProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Position the cart initially based on screen size
  useEffect(() => {
    const updatePosition = () => {
      if (window.innerWidth < 768) {
        // Mobile: center at bottom
        setPosition({ x: 50, y: 85 });
      } else {
        // Desktop: position at bottom-right
        setPosition({ x: 85, y: 85 });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const x = (e.clientX - offsetRef.current.x) / window.innerWidth * 100;
    const y = (e.clientY - offsetRef.current.y) / window.innerHeight * 100;

    // Constrain to screen boundaries
    const constrainedX = Math.max(0, Math.min(x, 95));
    const constrainedY = Math.max(0, Math.min(y, 95));

    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleClearAll = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCartItems([]);
    }
  };

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{
        left: `${position.x}vw`,
        top: `${position.y}vh`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Minimized View */}
      {isMinimized ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
          <div 
            ref={dragHandleRef}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <GripVertical size={20} />
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} />
                <span className="font-bold">Cart ({totalCartItems})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded View */
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-300 w-80 md:w-96 overflow-hidden">
          {/* Drag Handle */}
          <div 
            ref={dragHandleRef}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <GripVertical size={20} />
              <ShoppingCart size={20} />
              <span className="font-bold">Your Rental Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-white/20 rounded-full"
                title="Minimize"
              >
                <MinusCircle size={20} />
              </button>
              <button
                onClick={() => setShowCartDetails(!showCartDetails)}
                className="p-1 hover:bg-white/20 rounded-full"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Cart Content */}
          <div className="p-4">
            {/* Cart Summary */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total Items</span>
                <span className="font-bold">{totalCartItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Total</span>
                <span className="text-2xl font-bold text-blue-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Cart Items - Expandable */}
            {showCartDetails && (
              <div className="max-h-64 overflow-y-auto mb-4 pr-2 space-y-3 custom-scrollbar">
                {cartItems.map(cartItem => (
                  <div
                    key={cartItem.item.id}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {cartItem.item.name}
                        </h4>
                        <p className="text-xs text-gray-500">{cartItem.item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(cartItem.item.id)}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                          disabled={cartItem.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 py-1 min-w-[40px] text-center text-sm font-medium border-x border-gray-300">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ${(cartItem.item.price_per_day * cartItem.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCartDetails(!showCartDetails)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  {showCartDetails ? 'Hide Items' : 'Show Items'}
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  Clear All
                </button>
              </div>
              
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Proceed to Checkout
              </button>
            </div>

            {/* Drag Hint */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Drag the blue header to move • Click minus to minimize
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}