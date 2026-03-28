import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { ShoppingCart, User, Search, Plus, Minus, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  sizes: string;
  in_stock: boolean;
}

interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const categories = ['All', 'Dresses', 'Outerwear', 'Tops'];

  useEffect(() => {
    fetchProducts();
  }, []);

  // Robust scroll lock for modals and cart (fixes background scroll on mobile)
  const scrollYRef = useRef(0);

  useEffect(() => {
    const isOpen = isCartOpen || !!selectedProduct;
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.top = `-${window.scrollY}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.top = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.top = '';
      document.body.style.overflow = '';
    };
  }, [isCartOpen, selectedProduct]);

  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, size: string) => {
    const existingItem = cart.findIndex(
      item => item.id === product.id && item.selectedSize === size
    );

    if (existingItem !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItem].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, selectedSize: size }]);
    }

    setToastMessage(`${product.name} added to cart`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize('');
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedSize('');
  };

  const handleAddFromModal = () => {
    if (selectedProduct && selectedSize) {
      addToCart(selectedProduct, selectedSize);
      closeProductModal();
    }
  };

  const sizesList = selectedProduct ? selectedProduct.sizes.split(',') : [];

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#800000] rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-serif">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-[#121212]">EVERLY</h1>
                <p className="text-[10px] text-gray-400 -mt-1">EST 2018</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#" className="hover:text-[#800000] transition-colors">New Drops</a>
              <a href="#" onClick={() => setSelectedCategory('Dresses')} className="hover:text-[#800000] transition-colors cursor-pointer">Dresses</a>
              <a href="#" onClick={() => setSelectedCategory('Outerwear')} className="hover:text-[#800000] transition-colors cursor-pointer">Outerwear</a>
              <a href="#" className="hover:text-[#800000] transition-colors">Our Story</a>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#800000]"
              />
              <Search className="absolute left-5 top-3.5 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-[#121212] hover:text-[#800000] transition-colors">
              <User className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-[#121212] hover:text-[#800000] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#800000] text-white text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-full">
                  {getCartCount()}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t px-6 py-4 flex gap-6 text-sm justify-center bg-white">
          <a href="#" className="hover:text-[#800000]">New Drops</a>
          <a href="#" className="hover:text-[#800000]">Dresses</a>
          <a href="#" className="hover:text-[#800000]">Outerwear</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <img 
          src="/uploads/upload_1.png" 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-6 px-6 py-1.5 bg-white/90 text-[#800000] text-xs tracking-[3px] font-medium">NEW SEASON</div>
            
            <h2 className="text-white text-7xl md:text-8xl font-serif tracking-tighter leading-none mb-6">
              EVERLY
            </h2>
            
            <p className="text-white/90 text-2xl font-light tracking-wide mb-12">
              THE NEW STANDARD.<br />A STYLE FOR EVERY STORY.
            </p>
            
            <button 
              onClick={() => {
                const productsSection = document.getElementById('products');
                productsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative inline-flex items-center gap-3 bg-white text-[#121212] px-10 py-4 text-sm font-medium tracking-widest hover:bg-[#800000] hover:text-white transition-all duration-300"
            >
              EXPLORE COLLECTION
              <div className="w-2 h-px bg-current group-hover:w-6 transition-all"></div>
            </button>
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/70 text-xs tracking-widest">
          SCROLL TO DISCOVER
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mt-3"
          >
            ↓
          </motion.div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white py-8 border-b">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center text-xs">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#800000]/10 flex items-center justify-center mb-4">
              <ShoppingCart className="w-5 h-5 text-[#800000]" />
            </div>
            <div className="font-medium text-[#121212]">INSTANT CHECKOUT</div>
            <div className="text-gray-500 mt-1">No DMs, just 2-click shopping</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#800000]/10 flex items-center justify-center mb-4">
              <Heart className="w-5 h-5 text-[#800000]" />
            </div>
            <div className="font-medium text-[#121212]">ORDER TRACKING</div>
            <div className="text-gray-500 mt-1">Real-time updates to your phone</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#800000]/10 flex items-center justify-center mb-4">
              <span className="text-[#800000] text-xl">↔</span>
            </div>
            <div className="font-medium text-[#121212]">3-DAY EXCHANGE</div>
            <div className="text-gray-500 mt-1">Hassle-free size swaps</div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="uppercase text-[#800000] text-sm tracking-[2px] mb-2">DISCOVER</div>
            <h3 className="text-5xl font-serif text-[#121212]">The Collection</h3>
          </div>

          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 text-sm transition-all ${selectedCategory === cat 
                  ? 'bg-[#121212] text-white' 
                  : 'bg-white border border-gray-200 hover:border-[#800000] text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white h-96 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                onClick={() => openProductModal(product)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/5] bg-gray-100 mb-6">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  
                  <div className="absolute top-5 right-5 bg-white/90 px-4 py-1 text-xs font-medium rounded-full">
                    ₹{product.price}
                  </div>
                  
                  {!product.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
                      OUT OF STOCK
                    </div>
                  )}
                </div>
                
                <div className="px-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium text-lg text-[#121212]">{product.name}</h4>
                    <div className="text-xs text-gray-400 tracking-wider">{product.category.toUpperCase()}</div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#121212] text-white/70 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-y-12">
          <div>
            <div className="flex items-center gap-2 text-white mb-6">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#800000] text-xl font-serif">E</span>
              </div>
              <span className="font-serif text-3xl tracking-tighter">EVERLY</span>
            </div>
            <div className="text-xs leading-relaxed max-w-[180px]">
              Timeless pieces for the modern woman. Crafted with intention in India.
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest text-white/50 mb-6">SHOP</div>
            <div className="space-y-3 text-sm">
              <div>New Arrivals</div>
              <div>Dresses</div>
              <div>Outerwear</div>
              <div>Accessories</div>
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest text-white/50 mb-6">EXPLORE</div>
            <div className="space-y-3 text-sm">
              <div>Our Story</div>
              <div>Journal</div>
              <div>Care Guide</div>
              <div>Sustainability</div>
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest text-white/50 mb-6">CONTACT</div>
            <div className="space-y-3 text-sm">
              <div>hello@shopeverly.com</div>
              <div>Instagram</div>
              <div>Privacy</div>
              <div>Shipping Policy</div>
            </div>
            
            <div className="mt-12 text-[10px] text-white/40">
              © {new Date().getFullYear()} Shop Everly. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 flex justify-between items-center border-b">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <h3 className="text-2xl font-medium">Your Bag</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                    <ShoppingCart className="w-9 h-9 text-gray-300" />
                  </div>
                  <div className="text-2xl font-light text-gray-400">Your bag is empty</div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-8 text-sm border px-8 py-3.5 hover:bg-black hover:text-white transition-colors"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto p-8 space-y-8">
                    {cart.map((item, index) => (
                      <div key={index} className="flex gap-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Size: {item.selectedSize}</div>
                            </div>
                            <button onClick={() => removeFromCart(index)} className="text-gray-300 hover:text-red-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex border rounded-full">
                              <button 
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-full"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <div className="w-8 h-8 flex items-center justify-center text-sm font-mono border-x">{item.quantity}</div>
                              <button 
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-full"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-8 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <div>SUBTOTAL</div>
                      <div className="font-medium">₹{getTotalPrice()}</div>
                    </div>
                    <div className="text-[10px] text-gray-400">Shipping calculated at checkout</div>
                    
                    <button 
                      onClick={() => {
                        alert('Thank you for shopping with Everly! (Demo checkout)');
                        setCart([]);
                        setIsCartOpen(false);
                      }}
                      className="mt-8 w-full bg-[#121212] text-white py-5 text-sm tracking-widest hover:bg-[#800000] transition-colors"
                    >
                      SECURE CHECKOUT
                    </button>
                    
                    <div className="text-center text-[10px] text-gray-400 mt-6">OR 4 PAYMENTS OF ₹{(getTotalPrice()/4).toFixed(0)} WITH</div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6" onClick={closeProductModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-square bg-gray-100 relative">
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-12 flex flex-col max-h-[90vh] overflow-y-auto">
                  <button onClick={closeProductModal} className="absolute top-8 right-8 text-gray-400 hover:text-black z-10">
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="mb-auto">
                    <div className="uppercase tracking-[1px] text-xs text-[#800000]">{selectedProduct.category}</div>
                    <h2 className="text-4xl font-serif mt-2 leading-none">{selectedProduct.name}</h2>
                    <div className="text-3xl font-light mt-4">₹{selectedProduct.price}</div>
                    
                    <div className="mt-10">
                      <div className="text-xs tracking-widest mb-4">SELECT SIZE</div>
                      <div className="flex gap-3 flex-wrap">
                        {sizesList.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`w-11 h-11 border flex items-center justify-center text-sm transition-all ${selectedSize === size ? 'border-[#800000] bg-[#800000] text-white' : 'hover:border-gray-400'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-10 text-sm leading-relaxed text-gray-600 pr-4">
                      {selectedProduct.description}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddFromModal}
                    disabled={!selectedSize}
                    className={`mt-8 py-5 text-sm tracking-widest transition-all ${selectedSize ? 'bg-[#121212] text-white hover:bg-[#800000]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    ADD TO BAG
                  </button>
                  
                  <div className="text-[10px] text-center text-gray-400 mt-8">Free shipping on orders over ₹5000</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#121212] text-white text-sm px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[70]"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

