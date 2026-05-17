import { Package, Trash2, Calendar, Star, Zap, Eye, Info } from 'lucide-react';

interface ItemProps {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  status: 'Available' | 'Rented' | 'Maintenance';
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onViewDetails?: () => void;
  isInCart?: boolean;
  onUpdateStatus?: (status: 'Available' | 'Rented' | 'Maintenance') => void;
}

export default function ItemCard({
  id,
  name,
  price,
  category,
  imageUrl,
  status,
  isAdmin,
  onDelete,
  onViewDetails,
  isInCart,
  onUpdateStatus
}: ItemProps) {

  const statusColors = {
    Available: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    Rented: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    Maintenance: 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
  };

  const statusOptions: Array<'Available' | 'Rented' | 'Maintenance'> = ['Available', 'Rented', 'Maintenance'];

  return (
    <div className="group bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {onUpdateStatus && (
            <select
              value={status}
              onChange={(e) => onUpdateStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-bold border border-gray-300 shadow-lg"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => onDelete?.(id)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-500 hover:text-white shadow-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* Image container */}
      <div className="h-64 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        
        {/* Status badge */}
        <div className={`absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${statusColors[status]}`}>
          {status.toUpperCase()}
        </div>

        {/* In Cart badge */}
        {isInCart && !isAdmin && (
          <div className="absolute top-4 right-16 z-10 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Star size={10} />
            In Cart
          </div>
        )}

        {/* Premium badge for high-value items */}
        {price > 100 && !isInCart && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Star size={10} />
            Premium
          </div>
        )}

        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
              <Package size={72} className="text-gray-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 blur-xl opacity-50" />
            </div>
          </div>
        )}

        {/* Category tag */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-gray-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Zap size={12} className="text-blue-600" />
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{name}</h3>
          {price < 50 && !isInCart && (
            <span className="text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-2.5 py-1 rounded-full">
              Best Value
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
          <Calendar size={14} />
          <span>{status === 'Available' ? 'Available Now' : status}</span>
          {isInCart && (
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              In your cart
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          <div>
            <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              ${price}
            </span>
            <span className="text-gray-500 text-sm font-medium ml-1">/ day</span>
            <p className="text-xs text-gray-400 mt-1">No hidden fees</p>
          </div>

          <button
            onClick={onViewDetails}
            disabled={status !== 'Available'}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
              status !== 'Available'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isInCart
                ? 'bg-linear-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {status !== 'Available' ? (
              <>
                <Info size={18} />
                Not Available
              </>
            ) : isInCart ? (
              <>
                <Eye size={18} />
                View in Cart
              </>
            ) : (
              <>
                <Eye size={18} />
                View Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}