import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Barcode,
  Scale,
  Plus,
  Minus,
  Trash2,
  Percent,
  RotateCcw,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Check,
  Printer,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  X,
  CornerDownLeft,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, PaymentMethod, SaleInvoice } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { WeightScaleModal } from './WeightScaleModal';
import { ThermalReceipt } from './ThermalReceipt';
import { posAudio } from '../../utils/audio';
import { normalizeArabicText } from '../../utils/arabic';

export const POSScreen: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartDiscount,
    setCartDiscount,
    selectedCustomerId,
    setSelectedCustomerId,
    customers,
    salePriceTier,
    setSalePriceTier,
    processSale,
    lastInvoice,
    settings,
    activeWarehouseId,
  } = useStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [weightedProduct, setWeightedProduct] = useState<Product | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<SaleInvoice | null>(lastInvoice);
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global hotkey to focus search bar ('/' or 'F2')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || e.key === 'F2') &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Return mode toggle for adding items
  const [isReturnMode, setIsReturnMode] = useState(false);

  // Discount modal for cart or item
  const [discountModalItemIdx, setDiscountModalItemIdx] = useState<number | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');

  // Checkout modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Normalized Live Search across products, barcodes, codes, packagings, categories
  const filteredProducts = useMemo(() => {
    const query = normalizeArabicText(searchQuery);
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      // Check name, base barcode, code, category
      const nameNorm = normalizeArabicText(p.name);
      const codeNorm = normalizeArabicText(p.code);
      const barcodeNorm = p.barcode.toLowerCase();
      const catNorm = normalizeArabicText(p.category);

      if (
        nameNorm.includes(query) ||
        barcodeNorm.includes(query) ||
        codeNorm.includes(query) ||
        catNorm.includes(query)
      ) {
        return true;
      }

      // Check all packaging barcodes and packaging names
      return p.packagings?.some((pkg) => {
        const pkgBarcode = pkg.barcode.toLowerCase();
        const pkgName = normalizeArabicText(pkg.name);
        return pkgBarcode.includes(query) || pkgName.includes(query);
      });
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Search Input KeyDown (Quick-Add on Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const rawQuery = searchQuery.trim();
      if (!rawQuery) return;

      // 1. Direct barcode match test
      const directMatch = products.find((p) => p.barcode === rawQuery);
      if (directMatch) {
        if (directMatch.isWeighted) {
          setWeightedProduct(directMatch);
        } else {
          addToCart(directMatch, undefined, 1, isReturnMode);
        }
        setSearchQuery('');
        return;
      }

      // 2. Direct packaging barcode match
      for (const p of products) {
        const pkg = p.packagings?.find((pk) => pk.barcode === rawQuery);
        if (pkg) {
          addToCart(p, pkg.id, 1, isReturnMode);
          setSearchQuery('');
          return;
        }
      }

      // 3. If live search yields exactly 1 product, add it directly!
      if (filteredProducts.length === 1) {
        const singleProduct = filteredProducts[0];
        if (singleProduct.isWeighted) {
          setWeightedProduct(singleProduct);
        } else {
          addToCart(singleProduct, undefined, 1, isReturnMode);
        }
        setSearchQuery('');
        return;
      }

      // 4. If multiple matching products exist, pick the first exact match or first result
      if (filteredProducts.length > 1) {
        const firstProduct = filteredProducts[0];
        if (firstProduct.isWeighted) {
          setWeightedProduct(firstProduct);
        } else {
          addToCart(firstProduct, undefined, 1, isReturnMode);
        }
        setSearchQuery('');
      }
    }
  };

  // Totals calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, it) => {
      const sign = it.isReturn ? -1 : 1;
      return acc + it.subtotal * sign;
    }, 0);
  }, [cart]);

  const taxAmount = settings.isTaxEnabled && subtotal > 0 ? Number((subtotal * settings.taxRate).toFixed(2)) : 0;
  const netTotal = Math.max(0, Number((subtotal + taxAmount - cartDiscount).toFixed(2)));

  // Selected customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Handle clicking a product card
  const handleProductClick = (product: Product) => {
    if (product.isWeighted) {
      setWeightedProduct(product);
      return;
    }
    addToCart(product, undefined, 1, isReturnMode);
  };

  // Handle barcode scanned from camera or manual
  const handleBarcodeScanned = (barcode: string) => {
    // 1. Check direct product barcode
    const directProd = products.find((p) => p.barcode === barcode);
    if (directProd) {
      if (directProd.isWeighted) {
        setWeightedProduct(directProd);
      } else {
        addToCart(directProd, undefined, 1, isReturnMode);
      }
      return;
    }

    // 2. Check packagings barcode
    for (const p of products) {
      const pkg = p.packagings.find((pk) => pk.barcode === barcode);
      if (pkg) {
        addToCart(p, pkg.id, 1, isReturnMode);
        return;
      }
    }

    posAudio.playErrorBuzz();
    alert(`عذراً، لم يتم العثور على منتج بالباركود: ${barcode}`);
  };

  // Open checkout dialog
  const handleOpenCheckout = (method: PaymentMethod = 'cash') => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod(method);
    setPaidAmountInput(method === 'credit' ? '0' : netTotal.toString());
    setIsCheckoutModalOpen(true);
  };

  // Confirm checkout
  const handleConfirmSale = () => {
    const paid = parseFloat(paidAmountInput) || 0;
    const inv = processSale(selectedPaymentMethod, paid, saleNotes);
    if (inv) {
      setActiveReceipt(inv);
      setIsCheckoutModalOpen(false);
      setIsReceiptOpen(true);
      setSaleNotes('');
      setMobileView('products');
    }
  };

  // Apply discount
  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput) || 0;
    if (discountModalItemIdx !== null) {
      // Row level discount
      const item = cart[discountModalItemIdx];
      if (item) {
        const itemGross = item.quantity * item.unitPrice;
        const discountAmt = discountType === 'percent' ? (itemGross * val) / 100 : val;
        updateCartItemDiscount(discountModalItemIdx, discountAmt);
      }
    } else {
      // Invoice level discount
      const discountAmt = discountType === 'percent' ? (subtotal * val) / 100 : val;
      setCartDiscount(discountAmt);
    }
    setDiscountModalItemIdx(null);
    setDiscountInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-3 select-none flex flex-col lg:flex-row gap-4 h-[calc(100vh-3.75rem-4rem)]">
      {/* LEFT / TOP: Product Catalog Grid & Search (60-70% width on desktop) */}
      <div className={`${mobileView === 'products' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 overflow-hidden shadow-xl h-full pb-20 lg:pb-4 relative`}>
        {/* Top Control Bar: Search + Barcode Scanner Trigger + Return Mode Switch + Wholesale switch */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Search Input with Live Search capabilities */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="بحث فوري بالاسم أو الباركود... [اختصار / أو F2]"
              className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-2xl pr-9 pl-20 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner font-sans"
            />
            {/* Actions inside search box: clear X or quick badge */}
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 font-mono">
                    <span>{filteredProducts.length}</span>
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition"
                    title="مسح البحث"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1.5 py-0.5 rounded hidden sm:inline">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Barcode Camera Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-2xl text-xs font-semibold shadow-sm transition active:scale-95"
            title="مسح باركود بالكاميرا"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">مسح باركود</span>
          </button>

          {/* Wholesale / Retail Toggle */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-2xl border border-slate-700 text-xs">
            <button
              onClick={() => setSalePriceTier('retail')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition ${
                salePriceTier === 'retail' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              تجزئة
            </button>
            <button
              onClick={() => setSalePriceTier('wholesale')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition ${
                salePriceTier === 'wholesale' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              جملة
            </button>
          </div>

          {/* Return Mode Toggle */}
          <button
            onClick={() => setIsReturnMode(!isReturnMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-semibold border transition active:scale-95 ${
              isReturnMode
                ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="تبديل إلى وضع الإرجاع والاستبدال"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isReturnMode ? 'وضع الإرجاع نشط' : 'إرجاع/استبدال'}</span>
          </button>
        </div>

        {/* Category Horizontal Filter Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-xl whitespace-nowrap transition font-medium ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat === 'all' ? 'جميع الأقسام' : cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-28 lg:pb-2">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
              <ShoppingBag className="w-12 h-12 mb-2 stroke-[1.2]" />
              <p className="text-xs">لا توجد منتجات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const stock = p.warehouseStocks[activeWarehouseId] ?? p.stockQuantity;
                const price = salePriceTier === 'wholesale' ? p.wholesalePrice : p.sellingPrice;
                const isLowStock = stock <= p.minStockAlert;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none active:scale-98 ${
                      isReturnMode
                        ? 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-emerald-500/50'
                    }`}
                  >
                    {/* Top Row: category & indicators */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                        {p.category}
                      </span>
                      {p.isWeighted ? (
                        <span className="flex items-center gap-0.5 text-[9px] bg-sky-950/80 text-sky-300 border border-sky-800/80 px-1.5 py-0.5 rounded-md font-mono">
                          <Scale className="w-2.5 h-2.5" />
                          وزني
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                            isLowStock
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}
                        >
                          {stock} {p.baseUnit === 'piece' ? 'حبة' : 'كجم'}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-snug mb-2">
                      {p.name}
                    </h4>

                    {/* Packagings Quick Selector if product has cartons / boxes */}
                    {p.packagings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
                        {p.packagings.map((pkg) => {
                          const pkgPrice = salePriceTier === 'wholesale' ? pkg.wholesalePrice : pkg.sellingPrice;
                          return (
                            <button
                              key={pkg.id}
                              onClick={() => addToCart(p, pkg.id, 1, isReturnMode)}
                              className="text-[10px] bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-lg transition"
                              title={`${pkg.name} (${pkgPrice} ${settings.baseCurrency})`}
                            >
                              {pkg.name} ({pkgPrice})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Bottom Row: Price & Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-750">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-base font-extrabold text-emerald-400">{price}</span>
                        <span className="text-[10px] text-slate-400">{settings.baseCurrency}</span>
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        +
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Action Bar (زر بيع / إتمام الفاتورة في وضع الجوال) */}
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 pointer-events-auto">
          <button
            onClick={() => setMobileView('cart')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white p-3 rounded-2xl shadow-2xl shadow-black/90 border border-emerald-400/40 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold block">
                  {cart.length > 0 ? `${cart.length} أصناف بالسلة` : 'سلة البيع فارغة'}
                </span>
                <span className="text-[11px] text-emerald-100 font-mono font-bold">
                  المطلوب: {netTotal.toFixed(2)} {settings.baseCurrency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white text-emerald-950 px-4 py-2 rounded-xl font-extrabold text-xs shadow-sm">
              <span>بيع / عرض السلة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* RIGHT: Cart, Customer Selector, Total & Checkout Actions (30-40% width on desktop) */}
      <div className={`${mobileView === 'cart' ? 'flex' : 'hidden'} lg:flex w-full lg:w-96 flex-col bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl overflow-hidden h-full pb-18 lg:pb-4`}>
        {/* Mobile Header: Back Button to Products */}
        <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <button
            onClick={() => setMobileView('products')}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 active:scale-95 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للأصناف (+ إضافة منتجات)</span>
          </button>
          <span className="text-xs font-bold text-slate-200">
            سلة البيع ({cart.length})
          </span>
        </div>

        {/* Customer Selector Strip (Cash vs Credit) */}
        <div className="pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>العميل / الحساب:</span>
            </span>
            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-[10px] text-rose-400 hover:underline"
              >
                تغيير لزبون نقدي
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 appearance-none font-medium cursor-pointer"
            >
              <option value="">زبون نقدي عام (بدون حساب)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (دين: {c.balances[settings.baseCurrency] || 0} {settings.baseCurrency})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedCustomer && (
            <div className="mt-2 text-[11px] bg-slate-800/60 p-2 rounded-xl flex items-center justify-between text-slate-300">
              <span>رصيد الدين السابق:</span>
              <span className="font-mono font-bold text-amber-400">
                {selectedCustomer.balances[settings.baseCurrency] || 0} {settings.baseCurrency}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10 text-center">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-40 stroke-[1.5]" />
              <p className="text-xs mb-3">السلة فارغة. اختر أصنافاً للبدء بالبيع</p>
              <button
                onClick={() => setMobileView('products')}
                className="lg:hidden px-3.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>تصفح المنتجات وأضف للسلة</span>
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl border transition-all ${
                  item.isReturn
                    ? 'bg-rose-950/30 border-rose-900/60'
                    : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                {/* Item Top: Name & Remove */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.isReturn && (
                        <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">
                          مرتجع
                        </span>
                      )}
                      <h5 className="font-bold text-white text-xs truncate max-w-[180px]">
                        {item.productName}
                      </h5>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.unitName} · {item.unitPrice} {settings.baseCurrency}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item Bottom: Quantity controls & Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartItemQty(idx, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-xs px-2 text-white min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(idx, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {/* Item Discount button */}
                    <button
                      onClick={() => {
                        setDiscountModalItemIdx(idx);
                        setDiscountInput(item.discount > 0 ? item.discount.toString() : '');
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5 border ${
                        item.discount > 0
                          ? 'bg-rose-950 border-rose-800 text-rose-300'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white'
                      }`}
                      title="خصم على الصنف"
                    >
                      <Percent className="w-2.5 h-2.5" />
                      <span>{item.discount > 0 ? `-${item.discount}` : 'خصم'}</span>
                    </button>
                  </div>

                  <span
                    className={`font-mono font-extrabold text-sm ${
                      item.isReturn ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    {item.isReturn ? `-${item.subtotal}` : item.subtotal} {settings.baseCurrency}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Summary */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>المجموع قبل الضريبة:</span>
            <span className="font-mono text-slate-200">{subtotal.toFixed(2)} {settings.baseCurrency}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <button
              onClick={() => {
                setDiscountModalItemIdx(null);
                setDiscountInput(cartDiscount > 0 ? cartDiscount.toString() : '');
              }}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Percent className="w-3 h-3" />
              <span>خصم إضافي على الفاتورة:</span>
            </button>
            <span className="font-mono text-rose-400">
              {cartDiscount > 0 ? `-${cartDiscount.toFixed(2)}` : '0.00'} {settings.baseCurrency}
            </span>
          </div>

          {settings.isTaxEnabled && (
            <div className="flex justify-between text-slate-400">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span className="font-mono text-slate-200">{taxAmount.toFixed(2)} {settings.baseCurrency}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white">
            <span className="text-base">المبلغ المطلوب:</span>
            <span className="font-mono text-xl text-emerald-400">{netTotal.toFixed(2)} {settings.baseCurrency}</span>
          </div>
        </div>

        {/* Quick Checkout Buttons (نقدي، شبكة، آجل) */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Cash Pay */}
            <button
              disabled={cart.length === 0}
              onClick={() => handleOpenCheckout('cash')}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <Banknote className="w-4 h-4" />
              <span>نقداً (كاش)</span>
            </button>

            {/* Bank Card / Mada */}
            <button
              disabled={cart.length === 0}
              onClick={() => handleOpenCheckout('bank')}
              className="py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>شبكة / مدى</span>
            </button>

            {/* Credit Sale (بالآجل) */}
            <button
              disabled={cart.length === 0}
              onClick={() => {
                if (!selectedCustomerId) {
                  alert('يرجى اختيار عميل من القائمة لإجراء بيع بالآجل (على الحساب)');
                  return;
                }
                handleOpenCheckout('credit');
              }}
              className="py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>بيع بالآجل</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              disabled={cart.length === 0}
              onClick={clearCart}
              className="flex-1 py-1.5 text-xs text-slate-400 hover:text-rose-400 border border-slate-700/80 rounded-xl transition"
            >
              إلغاء السلة
            </button>

            {lastInvoice && (
              <button
                onClick={() => {
                  setActiveReceipt(lastInvoice);
                  setIsReceiptOpen(true);
                }}
                className="py-1.5 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1 transition"
                title="طباعة آخر فاتورة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>آخر فاتورة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal (Payment Confirmation) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">تأكيد عملية الدفع والفوترة</h3>
            <p className="text-xs text-slate-400 mb-4">
              إجمالي الفاتورة: <span className="text-emerald-400 font-bold font-mono">{netTotal} {settings.baseCurrency}</span>
            </p>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => {
                  setSelectedPaymentMethod('cash');
                  setPaidAmountInput(netTotal.toString());
                }}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  selectedPaymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                نقداً (كاش)
              </button>
              <button
                onClick={() => {
                  setSelectedPaymentMethod('bank');
                  setPaidAmountInput(netTotal.toString());
                }}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  selectedPaymentMethod === 'bank'
                    ? 'bg-sky-600 text-white border-sky-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                شبكة / بنك
              </button>
              <button
                onClick={() => {
                  if (!selectedCustomerId) {
                    alert('اختر عميلاً أولاً لإتاحة البيع بالآجل');
                    return;
                  }
                  setSelectedPaymentMethod('credit');
                  setPaidAmountInput('0');
                }}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  selectedPaymentMethod === 'credit'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                بالآجل (دين)
              </button>
            </div>

            {/* Paid Amount Input & Quick Preset Buttons */}
            {selectedPaymentMethod !== 'credit' && (
              <div className="space-y-2 mb-4">
                <label className="text-xs text-slate-400 block">المبلغ المستلم من العميل:</label>
                <input
                  type="number"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                />

                {/* Cash denominations quick buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[netTotal, 50, 100, 200, 500].map((amt, i) => (
                    <button
                      key={i}
                      onClick={() => setPaidAmountInput(amt.toString())}
                      className="py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                {/* Change calculation */}
                {parseFloat(paidAmountInput) > netTotal && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                    <span>الباقي للعميل (الصرف):</span>
                    <span className="font-mono text-base font-bold">
                      {(parseFloat(paidAmountInput) - netTotal).toFixed(2)} {settings.baseCurrency}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1">ملاحظات على الفاتورة (اختياري):</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="مثلاً: بطلب من السائق، دفعة مقدمة..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSale}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>إتمام البيع وطباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Dialog (Product or Total) */}
      {(discountModalItemIdx !== null || discountModalItemIdx === null && discountInput !== '') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-sm mb-1">
              {discountModalItemIdx !== null ? 'خصم على صنف محدد' : 'خصم إجمالي على الفاتورة'}
            </h3>
            <p className="text-xs text-slate-400 mb-3">حدد نوع الخصم والمبلغ المطلوب خصمه:</p>

            <div className="flex bg-slate-800 p-1 rounded-xl mb-3">
              <button
                onClick={() => setDiscountType('amount')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg ${
                  discountType === 'amount' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                مبلغ نقدي ({settings.baseCurrency})
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg ${
                  discountType === 'percent' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                نسبة مئوية (%)
              </button>
            </div>

            <input
              type="number"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleApplyDiscount}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                تطبيق الخصم
              </button>
              <button
                onClick={() => {
                  setDiscountModalItemIdx(null);
                  setDiscountInput('');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanned={handleBarcodeScanned}
      />

      {/* Weight Scale Modal */}
      <WeightScaleModal
        product={weightedProduct}
        isOpen={!!weightedProduct}
        onClose={() => setWeightedProduct(null)}
        currencySymbol={settings.baseCurrency}
        onConfirm={(netWeight, pricePerUnit) => {
          if (weightedProduct) {
            addToCart(weightedProduct, undefined, netWeight, isReturnMode, pricePerUnit);
          }
        }}
      />

      {/* Thermal Receipt Print Preview */}
      <ThermalReceipt
        invoice={activeReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        settings={settings}
      />
    </div>
  );
};
