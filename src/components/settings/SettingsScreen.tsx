import React, { useState, useRef } from 'react';
import {
  Settings,
  Shield,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Trash2,
  Lock,
  Phone,
  MessageCircle,
  Send,
  Building2,
  Check,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { posAudio } from '../../utils/audio';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    staff,
    currentStaff,
    currencies,
    cloudSync,
    exportBackup,
    importBackup,
    resetAllData,
  } = useStore();

  const [formStoreName, setFormStoreName] = useState(settings.storeName);
  const [formActivity, setFormActivity] = useState(settings.activity);
  const [formPhone, setFormPhone] = useState(settings.phone);
  const [formAddress, setFormAddress] = useState(settings.address);
  const [formTaxNumber, setFormTaxNumber] = useState(settings.taxNumber);
  const [formTaxRate, setFormTaxRate] = useState((settings.taxRate * 100).toString());
  const [formTaxEnabled, setFormTaxEnabled] = useState(settings.isTaxEnabled);
  const [formBaseCurrency, setFormBaseCurrency] = useState(settings.baseCurrency);
  const [formFooterMsg, setFormFooterMsg] = useState(settings.receiptFooterMessage);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName: formStoreName.trim(),
      activity: formActivity.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      taxNumber: formTaxNumber.trim(),
      taxRate: (parseFloat(formTaxRate) || 15) / 100,
      isTaxEnabled: formTaxEnabled,
      baseCurrency: formBaseCurrency,
      receiptFooterMessage: formFooterMsg.trim(),
    });
    setSavedSuccessMsg(true);
    posAudio.playSuccessChime();
    setTimeout(() => setSavedSuccessMsg(false), 2500);
  };

  // Cloud Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await cloudSync();
    setIsSyncing(false);
    setSyncSuccessMsg(true);
    setTimeout(() => setSyncSuccessMsg(false), 2500);
  };

  // Export Backup
  const handleExportBackup = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motagri_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    posAudio.playSuccessChime();
  };

  // Import Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        alert('تمت استعادة النسخة الاحتياطية بنجاح!');
      } else {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  // Reset Data confirmation
  const handleResetData = () => {
    if (
      confirm(
        'تحذير خطير: هل أنت متأكد تماماً من رغبتك في حذف كافة البيانات وإعادة التطبيق إلى وضع ضبط المصنع؟ لا يمكن التراجع عن هذا الإجراء!'
      )
    ) {
      resetAllData();
      alert('تمت إعادة ضبط البيانات بنجاح.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 select-none pb-28 text-right">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">إعدادات النظام والأمان</h2>
        <p className="text-xs text-slate-400">
          بيانات المتجر والضريبة، صلاحيات الموظفين، النسخ الاحتياطي والمزامنة السحابية
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Store & Tax Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-base">بيانات المنشأة والضريبة</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم المتجر / المنشأة:</label>
                <input
                  type="text"
                  required
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">النشاط التجاري:</label>
                <input
                  type="text"
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value)}
                  placeholder="بقالة، سوبرماركت، مخبز، ورشة..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">رقم الهاتف / التواصل:</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">العملة الأساسية للنظام:</label>
                <select
                  value={formBaseCurrency}
                  onChange={(e) => setFormBaseCurrency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code} - {c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الرقم الضريبي للمنشأة:</label>
                <input
                  type="text"
                  value={formTaxNumber}
                  onChange={(e) => setFormTaxNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">نسبة ضريبة القيمة المضافة (%):</label>
                <input
                  type="number"
                  value={formTaxRate}
                  onChange={(e) => setFormTaxRate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">العنوان والموقع الجغرافي:</label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">رسالة شكر وعبارة أسفل الفاتورة الحرارية:</label>
              <input
                type="text"
                value={formFooterMsg}
                onChange={(e) => setFormFooterMsg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formTaxEnabled}
                  onChange={(e) => setFormTaxEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700"
                />
                <span>تفعيل حساب ضريبة القيمة المضافة تلقائياً في الفواتير</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>

              {savedSuccessMsg && (
                <span className="text-xs text-emerald-400 font-semibold animate-fade-in">
                  تم حفظ الإعدادات بنجاح!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Section 2: Staff Accounts & PIN Codes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <UserCheck className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-base">حسابات الموظفين وصلاحيات الدخول (PIN)</h3>
          </div>

          <div className="space-y-2">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{s.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        s.role === 'owner'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : s.role === 'manager'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {s.role === 'owner' ? 'المالك' : s.role === 'manager' ? 'مدير فرع' : 'كاشير'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    هاتف: {s.phone || 'غير مسجل'} · رمز الـ PIN: <span className="font-mono font-bold text-slate-200">****</span>
                  </div>
                </div>

                <div className="text-left font-mono text-[11px] text-slate-400">
                  {s.id === currentStaff.id ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800">
                      الحساب النشط حالياً
                    </span>
                  ) : (
                    <span>متاح للتبديل</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Cloud Sync & Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-base">النسخ الاحتياطي والمزامنة السحابية</h3>
          </div>

          <div className="space-y-4">
            {/* Cloud Sync Status */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-xs block">المزامنة مع السحابة وحساب Google:</span>
                <span className="text-[11px] text-slate-400">
                  آخر مزامنة ناجحة:{' '}
                  {settings.lastSyncTime
                    ? new Date(settings.lastSyncTime).toLocaleTimeString('ar-SA') + ' - ' + new Date(settings.lastSyncTime).toLocaleDateString('ar-SA')
                    : 'لم تتم المزامنة بعد'}
                </span>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة سحابية الآن'}</span>
              </button>
            </div>

            {syncSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>تمت المزامنة بنجاح وحفظ كافة التغييرات!</span>
              </div>
            )}

            {/* Local Backup Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportBackup}
                className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>تصدير نسخة احتياطية (ملف JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>استعادة نسخة احتياطية من ملف</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Support & Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
            <MessageCircle className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-base">الدعم الفني والمساعدة</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            فريق الدعم الفني متاح للإجابة على استفساراتكم ومساعدتكم في تخصيص التطبيق وطابعات البلوتوث والحراري:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>محادثة تليجرام (Telegram)</span>
            </a>
            <a
              href="https://m.me"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ماسنجر (Messenger)</span>
            </a>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-4 h-4" />
              <span>واتساب الدعم السريع</span>
            </a>
          </div>
        </div>

        {/* Section 5: Danger Zone (Factory Reset) */}
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-3xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-rose-300 text-base">منطقة الحذف وتصفير البيانات</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            حذف كافة السجلات، فواتير المبيعات والمشتريات، وإعادة تعيين أرصدة المخازن والحسابات لوضع ضبط المصنع.
          </p>
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف البيانات وإعادة ضبط المصنع</span>
          </button>
        </div>
      </div>
    </div>
  );
};
