const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); return; }

  // جلب store_id من profiles
  const { data: prof } = await supabase
    .from('profiles')
    .select('store_id, name, role')
    .eq('id', data.user.id)
    .single();

  // حمّل البيانات
  const initial = await sync.pullInitial(prof.store_id);
  // → ضعها في StoreContext عبر setProducts/ setCustomers/ setInvoices

  // استمع للتغييرات الحيّة
  sync.subscribe(prof.store_id, {
    onProduct: (row) => setProducts(prev => upsertById(prev, fromRow(row))),
    onCustomer: (row) => setCustomers(prev => upsertById(prev, customerFromRow(row))),
    onInvoice: (row) => setInvoices(prev => upsertById(prev, invoiceFromRow(row))),
  });

  // عند عودة الاتصال → flush الطابور
  window.addEventListener('online', () => sync.flush());
};
