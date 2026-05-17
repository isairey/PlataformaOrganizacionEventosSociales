import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import ItemCard from './components/ItemCard';
import ItemDetailsModal from './components/ItemDetailsModal';
import DraggableCart from './components/DraggableCart';
import AdminLoginModal from './components/AdminLoginModal';
// Update the import statement at the top
import {
  PlusCircle,
  LayoutDashboard,
  Search,
  Package,
  X,
  ShoppingCart,
  Bell,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  LogOut,  // Add this
  Shield    // Add this
} from 'lucide-react';

interface RentalItem {
  id: string;
  name: string;
  price_per_day: number;
  category: string;
  image_url?: string;
  status: 'Available' | 'Rented' | 'Maintenance';
}

interface Booking {
  id: string;
  created_at: string;
  items: any[];
  total_price: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  notes?: string;
  rental_start?: string;
  rental_end?: string;
}

interface CartItem {
  item: RentalItem;
  quantity: number;
}

function App() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [view, setView] = useState<'inventory' | 'orders' | 'analytics'>('inventory');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalRevenue: 0,
    activeBookings: 0
  });
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: ''
  });
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    rentalStart: '',
    rentalEnd: ''
  });
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const ADMIN_PASSWORD = "eventflow2024";


  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  useEffect(() => {
    fetchItems();
    // Check if admin was previously authenticated
    const savedAuth = localStorage.getItem('eventflow_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    calculateStats();
  }, [items, bookings]);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    setItems(data || []);
    setLoading(false);
  }

  function calculateStats() {
    const totalItems = items.length;
    const availableItems = items.filter(item => item.status === 'Available').length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
    const activeBookings = bookings.filter(b => 
      b.status === 'Confirmed' || b.status === 'Shipped'
    ).length;
    
    setStats({
      totalItems,
      availableItems,
      totalRevenue,
      activeBookings
    });
  }

  async function fetchBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    setBookings(data || []);
  }

  useEffect(() => {
    if (view === 'orders' || view === 'analytics') fetchBookings();
  }, [view]);

  // Admin authentication
  const handleAdminLogin = (password: string) => {
  if (password === ADMIN_PASSWORD) {
    setIsAuthenticated(true);
    setIsAdmin(true);
    setShowAdminLogin(false);
    localStorage.setItem('eventflow_admin_auth', 'true');
    return true;
  }
  return false;
};

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setView('inventory');
    // Clear authentication state
    localStorage.removeItem('eventflow_admin_auth');
  };

  // Add to cart function with quantity support
  const addToCart = (item: RentalItem, quantity: number = 1) => {
    if (item.status !== 'Available') {
      alert('This item is not available for rental');
      return;
    }
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(ci => ci.item.id === item.id);
      if (existingIndex >= 0) {
        // Update quantity if item already in cart
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        // Add new item to cart
        return [...prev, { item, quantity }];
      }
    });
    setShowCartDetails(true);
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(ci => ci.item.id !== id));
  };

  // Update cart quantity for a specific item
  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev => prev.map(ci => 
      ci.item.id === id ? { ...ci, quantity } : ci
    ));
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce(
    (acc, ci) => acc + (ci.item.price_per_day * ci.quantity),
    0
  );

  // Get cart quantity for a specific item
  const getCartQuantity = (itemId: string) => {
    const cartItem = cartItems.find(ci => ci.item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Get total number of items in cart
  const totalCartItems = cartItems.reduce((total, ci) => total + ci.quantity, 0);

  async function handleCheckout() {
    if (cartItems.length === 0) return;

    const { error } = await supabase.from('bookings').insert([
      {
        items: cartItems.map(ci => ({
          ...ci.item,
          quantity: ci.quantity
        })),
        total_price: cartTotal,
        customer_name: checkoutData.customerName || 'Guest Customer',
        customer_email: checkoutData.customerEmail,
        customer_phone: checkoutData.customerPhone,
        rental_start: checkoutData.rentalStart,
        rental_end: checkoutData.rentalEnd,
        status: 'Pending'
      }
    ]);

    if (error) {
      alert('Checkout failed: ' + error.message);
    } else {
      alert('🚀 Order Placed Successfully!');
      setCartItems([]);
      setShowCheckoutModal(false);
      setShowCartDetails(false);
      setCheckoutData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        rentalStart: '',
        rentalEnd: ''
      });
      
      // Update item statuses to 'Rented'
      const updates = cartItems.map(ci => 
        supabase
          .from('items')
          .update({ status: 'Rented' })
          .eq('id', ci.item.id)
      );
      
      await Promise.all(updates);
      fetchItems();
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function addItem(e: React.FormEvent) {
    e.preventDefault();

    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    let publicUrl = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    }

    const { error } = await supabase.from('items').insert([
      {
        name: newItem.name,
        price_per_day: Number(newItem.price),
        category: newItem.category,
        image_url: publicUrl,
        status: 'Available'
      }
    ]);

    if (!error) {
      setNewItem({ name: '', price: '', category: '' });
      if (fileInput) fileInput.value = '';
      fetchItems();
    }
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) fetchItems();
  }

  async function updateItemStatus(id: string, status: 'Available' | 'Rented' | 'Maintenance') {
    const { error } = await supabase
      .from('items')
      .update({ status })
      .eq('id', id);
    
    if (!error) fetchItems();
  }

  async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    
    if (!error) fetchBookings();
  }

  async function deleteBooking(id: string) {
    if (!window.confirm('Delete this booking?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) fetchBookings();
  }

  const handleViewItemDetails = (item: RentalItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans">

      {/* Professional Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
            <LayoutDashboard className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              EventFlow
            </h1>
            <p className="text-xs text-gray-500">Premium Event Equipment Rental</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!isAdmin ? (
            <>
              <div className="relative group">
                <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all">
                  <Bell size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <ShoppingCart size={20} className="text-blue-600" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg">
                      {totalCartItems}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
            </>
          ) : (
            // Admin badge when logged in
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-sm font-bold">
              <Shield size={14} />
              Admin Mode
            </div>
          )}

          <button
            onClick={() => {
              if (isAdmin) {
                handleAdminLogout();
              } else {
                setShowAdminLogin(true);
              }
            }}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg ${
              isAdmin
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-red-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200'
            }`}
          >
            {isAdmin ? <LogOut size={18} /> : <PlusCircle size={18} />}
            {isAdmin ? 'Logout Admin' : 'Admin Dashboard'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalItems}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp size={14} className="text-green-500 mr-1" />
              <span className="text-green-600">{stats.availableItems} available</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Rentals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBookings}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Daily Average</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.totalRevenue > 0 ? (stats.totalRevenue / 30).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <BarChart3 className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tabs - Only show when authenticated */}
        {isAdmin && isAuthenticated && (
          <div className="flex gap-1 mb-8 bg-white p-1.5 rounded-2xl shadow-inner border border-gray-100 max-w-3xl">
            {['inventory', 'orders', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab as any)}
                className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all capitalize ${
                  view === tab
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'inventory' ? 'Manage Inventory' : 
                 tab === 'orders' ? `Orders (${bookings.length})` : 
                 'Analytics'}
              </button>
            ))}
          </div>
        )}

        {/* INVENTORY VIEW */}
        {(!isAdmin || view === 'inventory') && (
          <>
            {/* Admin Add Item Form - Only show when authenticated */}
            {isAdmin && isAuthenticated && (
              <section className="bg-gradient-to-r from-white to-blue-50 p-8 rounded-3xl shadow-xl border border-blue-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Equipment</h2>
                  <span className="text-sm text-gray-500">Complete all fields</span>
                </div>

                <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input
                    placeholder="Equipment name"
                    className="border-2 border-gray-200 p-3.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />

                  <input
                    type="number"
                    placeholder="Daily price ($)"
                    className="border-2 border-gray-200 p-3.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={newItem.price}
                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />

                  <input
                    placeholder="Category"
                    className="border-2 border-gray-200 p-3.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    required
                  />

                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="border-2 border-gray-200 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  <button
                    type="submit"
                    className="md:col-span-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all"
                  >
                    Add Equipment
                  </button>
                </form>
              </section>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  placeholder="Search equipment, categories, or features..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === category
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-2xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price_per_day}
                    category={item.category}
                    imageUrl={item.image_url}
                    status={item.status}
                    isAdmin={isAdmin && isAuthenticated}
                    isInCart={cartItems.some(ci => ci.item.id === item.id)}
                    onViewDetails={() => handleViewItemDetails(item)}
                    onDelete={deleteItem}
                    onUpdateStatus={(status) => updateItemStatus(item.id, status)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ORDERS VIEW - Only show when authenticated */}
        {isAdmin && isAuthenticated && view === 'orders' && (
          <section className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                  <p className="text-gray-600 mt-1">Manage and track all rental orders</p>
                </div>
                <button
                  onClick={fetchBookings}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh Orders
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order ID</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray500">Dates</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm text-gray-900">{order.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {order.items.slice(0, 2).map((item: any, index: number) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium"
                            >
                              {item.name} {item.quantity ? `(x${item.quantity})` : ''}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-xs text-gray-500 px-2 py-1.5">
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-lg font-bold text-gray-900">${order.total_price}</div>
                        <div className="text-xs text-gray-500">
                          {order.items.reduce((total: number, item: any) => total + (item.quantity || 1), 0)} items
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-600">
                          {order.rental_start ? new Date(order.rental_start).toLocaleDateString() : 'N/A'}
                          {order.rental_end && ' → ' + new Date(order.rental_end).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View
                          </button>
                          <button 
                            onClick={() => deleteBooking(order.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANALYTICS VIEW - Only show when authenticated */}
        {isAdmin && isAuthenticated && view === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Revenue Overview</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500">Analytics chart would go here</p>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Category Distribution</h3>
              <div className="space-y-4">
                {Array.from(new Set(items.map(item => item.category))).map(category => {
                  const count = items.filter(item => item.category === category).length;
                  const percentage = (count / items.length) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{category}</span>
                        <span className="font-bold text-gray-900">{count} items</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Draggable Cart Component */}
      {cartItems.length > 0 && !isAdmin && !showCheckoutModal && (
        <DraggableCart
          cartItems={cartItems}
          cartTotal={cartTotal}
          totalCartItems={totalCartItems}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          setCartItems={setCartItems}
          setShowCartDetails={setShowCartDetails}
          showCartDetails={showCartDetails}
          setShowCheckoutModal={setShowCheckoutModal}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
      />

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setSelectedItem(null);
          }}
          onAddToCart={addToCart}
          cartQuantity={getCartQuantity(selectedItem.id)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Complete Your Rental</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={checkoutData.customerName}
                  onChange={e => setCheckoutData({...checkoutData, customerName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={checkoutData.customerEmail}
                    onChange={e => setCheckoutData({...checkoutData, customerEmail: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={checkoutData.customerPhone}
                    onChange={e => setCheckoutData({...checkoutData, customerPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Start *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={checkoutData.rentalStart}
                    onChange={e => setCheckoutData({...checkoutData, rentalStart: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental End *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={checkoutData.rentalEnd}
                    onChange={e => setCheckoutData({...checkoutData, rentalEnd: e.target.value})}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h4 className="font-bold text-gray-900 mb-3">Order Summary</h4>
                <div className="space-y-2 mb-3">
                  {cartItems.map(cartItem => (
                    <div key={cartItem.item.id} className="flex justify-between text-sm">
                      <span>
                        {cartItem.item.name} <span className="text-gray-500">x{cartItem.quantity}</span>
                      </span>
                      <span className="font-medium">
                        ${(cartItem.item.price_per_day * cartItem.quantity).toFixed(2)}/day
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Daily Total</span>
                    <span>${cartTotal.toFixed(2)}/day</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total items: {totalCartItems} | Items: {cartItems.length}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-200 transition-all mt-4"
              >
                Confirm Rental Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;