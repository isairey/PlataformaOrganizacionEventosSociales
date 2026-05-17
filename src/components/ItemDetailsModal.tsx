import { X, Package, Calendar, DollarSign, Check, Plus, Minus, Zap } from 'lucide-react';
import { useState } from 'react';

interface ItemDetailsModalProps {
  item: {
    id: string;
    name: string;
    price_per_day: number;
    category: string;
    image_url?: string;
    status: 'Available' | 'Rented' | 'Maintenance';
  };
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any, quantity: number) => void;
  cartQuantity: number;
}

export default function ItemDetailsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  cartQuantity
}: ItemDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    onClose();
    setQuantity(1);
  };

  const statusColors = {
    Available: 'bg-gradient-to-r from-green-500 to-emerald-500',
    Rented: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    Maintenance: 'bg-gradient-to-r from-red-500 to-pink-500'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="relative h-64 md:h-auto rounded-2xl overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={96} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${statusColors[item.status]}`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Zap size={12} className="text-blue-600" />
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Details Section */}
              <div>
                <h4 className="text-3xl font-bold text-gray-900 mb-4">{item.name}</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} />
                    <span className="font-medium">Status: </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Available' 
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Rented'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={18} />
                    <span className="font-medium">Daily Rate: </span>
                    <span className="text-2xl font-bold text-gray-900">${item.price_per_day}</span>
                    <span className="text-gray-500">/ day</span>
                  </div>

                  {cartQuantity > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check size={18} />
                        <span className="font-medium">{cartQuantity} in your cart</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Current total: ${(item.price_per_day * cartQuantity).toFixed(2)}/day
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                      >
                        <Minus size={20} />
                      </button>
                      <span className="px-6 py-3 text-lg font-bold min-w-15 text-center border-x border-gray-300">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="p-3 hover:bg-gray-100"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    <div className="text-lg font-bold text-gray-900">
                      ${(item.price_per_day * quantity).toFixed(2)}
                      <span className="text-sm text-gray-500 ml-1">/ day</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50"
                  >
                    Back to Catalog
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={item.status !== 'Available'}
                    className={`flex-1 px-6 py-3.5 rounded-xl font-bold transition-all ${
                      item.status !== 'Available'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : cartQuantity > 0
                        ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-200'
                        : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-200'
                    }`}
                  >
                    {cartQuantity > 0 ? 'Update Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}