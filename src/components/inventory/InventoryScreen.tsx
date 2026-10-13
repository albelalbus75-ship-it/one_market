import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  Building2,
  X,
  Scale,
  Barcode,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductPackaging, UnitType, StockTransfer } from '../../types';
import { posAudio } from '../../utils/audio';
import { normalizeArabicText } from '../../utils/arabic';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    warehouses,
    activeWarehouseId,
    transfers,
    createTransfer,
    updateTransferStatus,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low_stock' | 'expiring' | 'weighted'>('all');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustCountInput, setAdjustCountInput] = useState('');
  const [adjustReasonInput, setAdjustReasonInput] = useState('جرد دوري');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New / Edit Product Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('أدوات منزلية');
  const [formBaseUnit, setFormBaseUnit] = useState<UnitType>('piece');
  const [formCostPrice, setFormCostPrice] = useState('10');
  const [formSellingPrice, setFormSellingPrice] = useState('15');
  const [formWholesalePrice, setFormWholesalePrice] = useState('12');
  const [formStock, setFormStock] = useState('50');
  const [formMinAlert, setFormMinAlert] = useState('10');
  const [formIsWeighted, setFormIsWeighted] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formPackagings, setFormPackagings] = useState<ProductPackaging[]>([]);

  // Transfer Form state
  const [transferFromId, setTransferFromId] = useState(warehouses[0]?.id || 'w1');
  const [transferToId, setTransferToId] = useState(warehouses[1]?.id || 'w2');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState('10');
  const [transferNotes, setTransferNotes] = useState('');

  // Live Search Filtering with Arabic normalization
  const filteredProducts = useMemo(() => {
    const q = normalizeArabicText(searchQuery);
    return products.filter((p) => {
      const stock = p.warehouseStocks[activeWarehouseId] ?? p.stockQuantity;
      const isLow = stock <= p.minStockAlert;
      const isExpiring = p.expiryDate && new Date(p.expiryDate).getTime() - Date.now() < 30 * 86400000;

      if (activeFilter === 'low_stock' && !isLow) return false;
      if (activeFilter === 'expiring' && !isExpiring) return false;
      if (activeFilter === 'weighted' && !p.isWeighted) return false;

      if (!q) return true;

      // Check name, base barcode, code, category
      const nameNorm = normalizeArabicText(p.name);
      const codeNorm = normalizeArabicText(p.code);
      const barcodeNorm = p.barcode.toLowerCase();
      const catNorm = normalizeArabicText(p.category);

      if (
        nameNorm.includes(q) ||
        barcodeNorm.includes(q) ||
        codeNorm.includes(q) ||
        catNorm.includes(q)
      ) {
        return true;
      }

      // Check all packaging barcodes and packaging names
      return p.packagings?.some((pkg) => {
        const pkgBarcode = pkg.barcode.toLowerCase();
        const pkgName = normalizeArabicText(pkg.name);
        return pkgBarcode.includes(q) || pkgName.includes(q);
      });
    });
  }, [products, activeFilter, searchQuery, activeWarehouseId]);

  // Open product modal for new product
  const handleOpenNewProduct = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCode(`PRD-${Date.now().toString().slice(-4)}`);
    setFormBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString());
    setFormCategory('أدوات منزلية');
    setFormBaseUnit('piece');
    setFormCostPrice('10');
    setFormSellingPrice('15');
    setFormWholesalePrice('12');
    setFormStock('50');
    setFormMinAlert('10');
    setFormIsWeighted(false);
    setFormExpiryDate('');
    setFormPackagings([]);
    setIsProductModalOpen(true);
  };

  // Open product modal for edit
  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setFormName(p.name);
    setFormCode(p.code);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormBaseUnit(p.baseUnit);
    setFormCostPrice(p.costPrice.toString());
    setFormSellingPrice(p.sellingPrice.toString());
    setFormWholesalePrice(p.wholesalePrice.toString());
    setFormStock(p.stockQuantity.toString());
    setFormMinAlert(p.minStockAlert.toString());
    setFormIsWeighted(p.isWeighted);
    setFormExpiryDate(p.expiryDate || '');
    setFormPackagings(p.packagings || []);
    setIsProductModalOpen(true);
  };

  // Add Packaging row inside product form
  const handleAddPackaging = () => {
    const newPkg: ProductPackaging = {
      id: 'pkg-' + Date.now(),
      name: 'كرتون (12 حبة)',
      barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      conversionFactor: 12,
      sellingPrice: Number(formSellingPrice) * 11, // slight discount
      wholesalePrice: Number(formWholesalePrice) * 11,
      costPrice: Number(formCostPrice) * 12,
    };
    setFormPackagings([...formPackagings, newPkg]);
  };

  const handleUpdatePackaging = (index: number, updates: Partial<ProductPackaging>) => {
    const updated = [...formPackagings];
    updated[index] = { ...updated[index], ...updates };
    setFormPackagings(updated);
  };

  const handleRemovePackaging = (index: number) => {
    setFormPackagings(formPackagings.filter((_, i) => i !== index));
  };

  // Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const stockNum = parseFloat(formStock) || 0;
    const prodData: Omit<Product, 'id'> = {
      name: formName.trim(),
      code: formCode.trim(),
      barcode: formBarcode.trim(),
      category: formCategory.trim(),
      baseUnit: formBaseUnit,
      costPrice: parseFloat(formCostPrice) || 0,
      sellingPrice: parseFloat(formSellingPrice) || 0,
      wholesalePrice: parseFloat(formWholesalePrice) || 0,
      stockQuantity: stockNum,
      minStockAlert: parseFloat(formMinAlert) || 5,
      isWeighted: formIsWeighted,
      expiryDate: formExpiryDate || undefined,
      packagings: formPackagings,
      warehouseStocks: { [activeWarehouseId]: stockNum },
    };

    if (editingProductId) {
      updateProduct(editingProductId, prodData);
    } else {
      addProduct(prodData);
    }
    setIsProductModalOpen(false);
    posAudio.playSuccessChime();
  };

  // Handle inventory count adjustment
  const handleConfirmAdjust = () => {
    if (!adjustingProduct) return;
    const newCount = parseFloat(adjustCountInput) || 0;
    adjustStock(adjustingProduct.id, newCount, adjustReasonInput);
    setIsAdjustModalOpen(false);
    setAdjustingProduct(null);
    posAudio.playSuccessChime();
  };

  // Handle create warehouse transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId) return;
    const qty = parseFloat(transferQty) || 0;
    const success = createTransfer(
      transferFromId,
      transferToId,
      [{ productId: transferProductId, quantity: qty }],
      transferNotes
    );
    if (success) {
      setIsTransferModalOpen(false);
      setTransferProductId('');
      setTransferNotes('');
    } else {
      alert('الرصيد في المستودع المصدر غير كافٍ لإتمام التحويل!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 select-none pb-24">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">إدارة المخزون والتعبئات</h2>
          <p className="text-xs text-slate-400">
            متابعة أرصدة الأصناف، التعبئات المتعددة، تنبيهات الصلاحية، والتحويل بين المستودعات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-2xl text-xs font-semibold transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل بين المستودعات</span>
          </button>

          <button
            onClick={handleOpenNewProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Badges Strip */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Live Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث فوري بالاسم، الباركود، كود الصنف أو التعبئة..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-2xl pr-9 pl-16 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner font-sans"
          />
          {searchQuery && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                {filteredProducts.length}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="مسح البحث"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              activeFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع الأصناف ({products.length})
          </button>
          <button
            onClick={() => setActiveFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
              activeFilter === 'low_stock' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>نواقص المخزون</span>
          </button>
          <button
            onClick={() => setActiveFilter('expiring')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
              activeFilter === 'expiring' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قرب انتهاء الصلاحية</span>
          </button>
          <button
            onClick={() => setActiveFilter('weighted')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
              activeFilter === 'weighted' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>أصناف وزنية</span>
          </button>
        </div>
      </div>

      {/* Live search feedback banner */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-2xl mb-3 text-xs">
          <span className="text-slate-300">
            نتائج البحث الفوري عن: <strong className="text-emerald-400">"{searchQuery}"</strong> ({filteredProducts.length} صنف مطابق)
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-slate-400 hover:text-white underline"
          >
            إلغاء البحث وعرض الكل
          </button>
        </div>
      )}

      {/* Products Table / Cards list */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">الصنف والباركود</th>
                <th className="py-3 px-3">القسم والنوع</th>
                <th className="py-3 px-3">الرصيد المتاح</th>
                <th className="py-3 px-3">متوسط التكلفة</th>
                <th className="py-3 px-3">سعر البيع (تجزئة/جملة)</th>
                <th className="py-3 px-3">التعبئات المرتبطة</th>
                <th className="py-3 px-3">تاريخ الصلاحية</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((p) => {
                const stock = p.warehouseStocks[activeWarehouseId] ?? p.stockQuantity;
                const isLow = stock <= p.minStockAlert;
                const isExpiring = p.expiryDate && new Date(p.expiryDate).getTime() - Date.now() < 30 * 86400000;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    {/* Name & Barcode */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>كود: {p.code}</span>
                        <span>·</span>
                        <span className="text-emerald-400">{p.barcode}</span>
                      </div>
                    </td>

                    {/* Category & Type */}
                    <td className="py-3 px-3">
                      <div className="text-slate-300">{p.category}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.isWeighted ? 'ميزان (وزني)' : `وحدة أساس: ${p.baseUnit}`}
                      </div>
                    </td>

                    {/* Stock & Alert */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-rose-400' : 'text-slate-200'
                          }`}
                        >
                          {stock} {p.baseUnit === 'kg' ? 'كجم' : 'حبة'}
                        </span>
                        {isLow && (
                          <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-bold">
                            ناقص
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">حد التنبيه: {p.minStockAlert}</div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {p.costPrice.toFixed(2)} {settings.baseCurrency}
                    </td>

                    {/* Selling prices */}
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-emerald-400">
                        {p.sellingPrice.toFixed(2)} {settings.baseCurrency}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        جملة: {p.wholesalePrice.toFixed(2)}
                      </div>
                    </td>

                    {/* Packagings */}
                    <td className="py-3 px-3">
                      {p.packagings.length === 0 ? (
                        <span className="text-slate-600 text-[11px]">-</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {p.packagings.map((pkg) => (
                            <span
                              key={pkg.id}
                              className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded-md inline-block truncate max-w-[150px]"
                            >
                              {pkg.name} ({pkg.sellingPrice} {settings.baseCurrency})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-3 font-mono">
                      {p.expiryDate ? (
                        <span className={isExpiring ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {p.expiryDate}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Adjust stock */}
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustCountInput(stock.toString());
                            setIsAdjustModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                          title="تسوية جرد / تعديل الرصيد"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="تعديل بيانات الصنف والتعبئات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الصنف (${p.name})؟`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">تسوية جرد المخزون</h3>
            <p className="text-xs text-slate-400 mb-3">{adjustingProduct.name}</p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">الرصيد الدفتري الحالي:</span>
                <span className="font-mono font-bold text-white">
                  {adjustingProduct.warehouseStocks[activeWarehouseId] ?? adjustingProduct.stockQuantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المستودع:</span>
                <span className="text-emerald-400">{warehouses.find((w) => w.id === activeWarehouseId)?.name}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">الرصيد الفعلي بعد الجرد:</label>
                <input
                  type="number"
                  value={adjustCountInput}
                  onChange={(e) => setAdjustCountInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">سبب التسوية:</label>
                <select
                  value={adjustReasonInput}
                  onChange={(e) => setAdjustReasonInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="جرد دوري">جرد دوري</option>
                  <option value="تالف / كسر / انتهاء صلاحية">تالف / كسر / انتهاء صلاحية</option>
                  <option value="بضاعة مفقودة">بضاعة مفقودة</option>
                  <option value="فروقات إدخال مشتريات">فروقات إدخال مشتريات</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmAdjust}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                حفظ التسوية وتحديث الرصيد
              </button>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Product Modal (with multiple packagings) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingProductId ? 'تعديل بيانات الصنف والتعبئات' : 'إضافة صنف جديد'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">اسم الصنف:</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: أرز بسمتي 5 كجم"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">الباركود:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString())
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 hover:underline"
                    >
                      توليد تلقائي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">القسم / التصنيف:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="أدوات منزلية">أدوات منزلية</option>
                    <option value="إلكترونيات">إلكترونيات</option>
                    <option value="مفروشات">مفروشات</option>
                    <option value="هدايا">هدايا وألعاب</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">الوحدة الأساسية:</label>
                  <select
                    value={formBaseUnit}
                    onChange={(e) => setFormBaseUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="piece">قطعة / حبة</option>
                    <option value="kg">كيلوغرام (كجم)</option>
                    <option value="g">غرام (g)</option>
                    <option value="liter">لتر (L)</option>
                    <option value="ml">مليلتر (ml)</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">سعر التكلفة:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">سعر التجزئة:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">سعر الجملة:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formWholesalePrice}
                    onChange={(e) => setFormWholesalePrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">الرصيد الافتتاحي:</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles (Weighted scale, Expiry date) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <label className="flex items-center gap-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsWeighted}
                    onChange={(e) => setFormIsWeighted(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-white block">منتج وزني (ميزان إلكتروني)</span>
                    <span className="text-[10px] text-slate-400">للخضار، الفواكه، الأجبان واللحوم</span>
                  </div>
                </label>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">تاريخ انتهاء الصلاحية (اختياري):</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Multiple Packagings Section (Cartons, Dozens, Packs) */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-sky-400" />
                      <span>تعبئات متعددة للمنتج (كرتون، درزن، كيس):</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      لكل تعبئة باركود وسعر خاص مع خصم الرصيد تلقائياً بالوحدة الأساسية
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPackaging}
                    className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة تعبئة</span>
                  </button>
                </div>

                {formPackagings.length === 0 ? (
                  <div className="text-[11px] text-slate-500 bg-slate-950/60 p-3 rounded-xl text-center border border-slate-800">
                    لا توجد تعبئات إضافية (يباع بالوحدة الأساسية فقط)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formPackagings.map((pkg, idx) => (
                      <div
                        key={pkg.id}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center text-xs"
                      >
                        <div>
                          <label className="text-[9px] text-slate-500 block">اسم التعبئة:</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleUpdatePackaging(idx, { name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block">معامل التحويل (عدد الحبات):</label>
                          <input
                            type="number"
                            min="1"
                            value={pkg.conversionFactor}
                            onChange={(e) =>
                              handleUpdatePackaging(idx, { conversionFactor: parseInt(e.target.value) || 1 })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block">سعر بيع التعبئة:</label>
                          <input
                            type="number"
                            value={pkg.sellingPrice}
                            onChange={(e) =>
                              handleUpdatePackaging(idx, { sellingPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block">باركود التعبئة:</label>
                          <input
                            type="text"
                            value={pkg.barcode}
                            onChange={(e) => handleUpdatePackaging(idx, { barcode: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                        <div className="flex justify-end pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemovePackaging(idx)}
                            className="text-slate-400 hover:text-rose-400 p-1"
                            title="حذف التعبئة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">التحويل بين الفروع والمستودعات</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">من المستودع:</label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">إلى المستودع:</label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === transferFromId}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الصنف المراد تحويله:</label>
                <select
                  required
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- اختر الصنف --</option>
                  {products.map((p) => {
                    const available = p.warehouseStocks[transferFromId] ?? 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (المتوفر: {available})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الكمية المحولة:</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ملاحظات التحويل:</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="سبب التحويل أو رقم الإرسالية..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  إنشاء أمر التحويل
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>

            {/* List of Recent Transfers & Status Tracking */}
            {transfers.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-slate-300 mb-2">أوامر التحويل الحالية وتتبع الحالة:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transfers.map((tr) => (
                    <div
                      key={tr.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{tr.transferNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          {tr.items[0]?.productName} ({tr.items[0]?.quantity} {tr.items[0]?.unit})
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={tr.status}
                          onChange={(e) => updateTransferStatus(tr.id, e.target.value as StockTransfer['status'])}
                          className={`text-[10px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                            tr.status === 'received'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : tr.status === 'in_transit'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="pending">معلق</option>
                          <option value="in_transit">قيد النقل</option>
                          <option value="received">مستلم (خصم وإضافة)</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
