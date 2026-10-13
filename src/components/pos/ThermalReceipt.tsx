import React, { useRef } from 'react';
import { Printer, Download, Share2, X, CheckCircle, RotateCcw } from 'lucide-react';
import { SaleInvoice, StoreSettings } from '../../types';

interface ThermalReceiptProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  invoice,
  isOpen,
  onClose,
  settings,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `فاتورة من ${settings.storeName}\nرقم: ${invoice.invoiceNumber}\nالتاريخ: ${new Date(invoice.date).toLocaleDateString('ar-SA')}\nالإجمالي: ${invoice.total} ${invoice.currency}\nطريقة الدفع: ${invoice.paymentMethod === 'cash' ? 'نقداً' : invoice.paymentMethod === 'credit' ? 'آجل' : 'شبكة/بنك'}\nشكراً لتعاملكم معنا!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isReturn = invoice.type === 'return';
  const isExchange = invoice.type === 'exchange';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {isReturn ? 'سند إرجاع بضاعة' : isExchange ? 'فاتورة استبدال بضاعة' : 'فاتورة مبيعات حرارية'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{invoice.invoiceNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar: Print, PDF, WhatsApp */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة فورية</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>حفظ PDF</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="py-2 px-3 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>
        </div>

        {/* Scrollable Receipt Preview (Clean white thermal paper layout) */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white text-slate-900 p-4 rounded-xl text-xs leading-relaxed font-sans shadow-inner mx-auto max-w-[340px]"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="text-base font-extrabold text-black">{settings.storeName}</h2>
              <div className="text-[11px] text-slate-600">{settings.activity}</div>
              <div className="text-[10px] text-slate-500">{settings.address}</div>
              <div className="text-[10px] text-slate-500">هاتف: {settings.phone}</div>
              {settings.taxNumber && (
                <div className="text-[10px] font-mono text-slate-800 font-semibold mt-0.5">
                  الرقم الضريبي: {settings.taxNumber}
                </div>
              )}
            </div>

            {/* Invoice Info */}
            <div className="py-2 text-[11px] border-b border-dashed border-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">رقم الفاتورة:</span>
                <span className="font-mono font-bold text-black">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">التاريخ والوقت:</span>
                <span className="font-mono">
                  {new Date(invoice.date).toLocaleDateString('ar-SA')} - {new Date(invoice.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">العميل:</span>
                <span className="font-semibold text-black">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">الكاشير:</span>
                <span>{invoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">نوع المستند:</span>
                <span className="font-bold">
                  {isReturn ? 'مرتجع مبيعات' : isExchange ? 'استبدال ومرتجع' : 'فاتورة ضريبية مبسطة'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-700 pb-1 border-b border-slate-300">
                <span className="col-span-6 text-right">الصنف</span>
                <span className="col-span-2 text-center">الكمية</span>
                <span className="col-span-2 text-center">السعر</span>
                <span className="col-span-2 text-left">الإجمالي</span>
              </div>

              <div className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1 text-[11px] items-center">
                    <div className="col-span-6 text-right">
                      <div className="font-semibold text-black flex items-center gap-1">
                        {item.isReturn && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                            مرتجع
                          </span>
                        )}
                        <span>{item.productName}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {item.unitName} {item.discount > 0 && `(خصم: ${item.discount})`}
                      </span>
                    </div>
                    <span className="col-span-2 text-center font-mono">
                      {item.quantity}
                    </span>
                    <span className="col-span-2 text-center font-mono">
                      {item.unitPrice}
                    </span>
                    <span className={`col-span-2 text-left font-mono font-bold ${item.isReturn ? 'text-rose-600' : 'text-black'}`}>
                      {item.isReturn ? `-${item.subtotal}` : item.subtotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">المجموع قبل الضريبة:</span>
                <span className="font-mono">{invoice.subtotal.toFixed(2)} {invoice.currency}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>خصم الفاتورة:</span>
                  <span className="font-mono">-{invoice.discount.toFixed(2)} {invoice.currency}</span>
                </div>
              )}
              {settings.isTaxEnabled && (
                <div className="flex justify-between">
                  <span className="text-slate-600">ضريبة القيمة المضافة (15%):</span>
                  <span className="font-mono">{invoice.taxAmount.toFixed(2)} {invoice.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-black pt-1 border-t border-slate-300">
                <span>المبلغ الصافي:</span>
                <span className="font-mono text-base">{invoice.total.toFixed(2)} {invoice.currency}</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">طريقة الدفع:</span>
                <span className="font-semibold text-black">
                  {invoice.paymentMethod === 'cash'
                    ? 'نقداً (كاش)'
                    : invoice.paymentMethod === 'credit'
                    ? 'بالآجل (على الحساب)'
                    : invoice.paymentMethod === 'bank'
                    ? 'بطاقة بنكية / مدى'
                    : 'محفظة إلكترونية'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">المدفوع:</span>
                <span className="font-mono">{invoice.paidAmount.toFixed(2)} {invoice.currency}</span>
              </div>
              {invoice.remainingAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>المتبقي (آجل / دين):</span>
                  <span className="font-mono">{invoice.remainingAmount.toFixed(2)} {invoice.currency}</span>
                </div>
              )}
            </div>

            {/* QR Code / Barcode representation (ZATCA style QR preview) */}
            <div className="text-center py-2.5 flex flex-col items-center justify-center">
              <div className="w-24 h-24 border border-slate-800 p-1 bg-white rounded-lg flex items-center justify-center mb-1">
                {/* Simulated high-density QR pattern for fiscal e-invoicing */}
                <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-0.5 bg-slate-900 p-1">
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className={`${(i * 7 + 3) % 2 === 0 ? 'bg-white' : 'bg-black'} rounded-xs`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">فاتورة إلكترونية معتمدة</span>
            </div>

            {/* Policy & Footer message */}
            <div className="text-center text-[10px] text-slate-600 pt-1 border-t border-dashed border-slate-400 space-y-0.5">
              <p className="font-medium text-black">{settings.receiptFooterMessage}</p>
              <p className="text-[9px] text-slate-400">دفتر متجري POS - نظام نقاط البيع المتكامل</p>
            </div>
          </div>
        </div>

        {/* Bottom Close */}
        <div className="pt-3">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
