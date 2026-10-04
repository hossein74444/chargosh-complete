const APP_CONFIG = {
  storageKey: 'chargosh.state.v1',
  defaultState: {
    settings: {
      companyName: 'کابینت چارگوش',
      currency: 'تومان',
      language: 'fa'
    },
    users: [
      { id: 1, name: 'حسین خلیلی', role: 'مالک' },
      { id: 2, name: 'سارا احمدی', role: 'مدیر پروژه' },
      { id: 3, name: 'رضا نیکپور', role: 'طراح' }
    ],
    workflowStages: ['پیشنهاد', 'در حال اجرا', 'در انتظار بررسی', 'تحویل', 'بایگانی'],
    workflowTasks: ['بررسی نیازها', 'طراحی', 'جذب مشتری', 'پیاده‌سازی', 'تأیید نهایی'],
    projects: [
      { id: 1, name: 'پروژه فروشگاه آنلاین', client: 'آراد دیزاین', type: 'مدرن', stage: 'در حال اجرا', owner: 'حسین', progress: 68, budget: 180000000, invoice: 120000000, dueDate: '2025-08-15', archived: false },
      { id: 2, name: 'پروژه هویت برند', client: 'مدیو', type: 'برندینگ', stage: 'پیشنهاد', owner: 'سارا', progress: 28, budget: 72000000, invoice: 22000000, dueDate: '2025-09-02', archived: false },
      { id: 3, name: 'سامانه داخلی', client: 'گروه پیکان', type: 'وب‌اپ', stage: 'تحویل', owner: 'رضا', progress: 90, budget: 260000000, invoice: 240000000, dueDate: '2025-07-30', archived: false },
      { id: 4, name: 'بخش CRM', client: 'صبا', type: 'CRM', stage: 'بایگانی', owner: 'حسین', progress: 100, budget: 95000000, invoice: 95000000, dueDate: '2025-06-10', archived: true }
    ],
    crm: [
      { id: 1, name: 'آقای علیزاده', company: 'نوبت‌ساز', phone: '09123456789', stage: 'پیگیری', value: 50000000, lastContact: '2025-07-17' },
      { id: 2, name: 'خانم موسوی', company: 'آفرین شیمی', phone: '09120000000', stage: 'جدید', value: 180000000, lastContact: '2025-07-10' },
      { id: 3, name: 'آقای رحمانی', company: 'دیجیتال کد', phone: '09129999999', stage: 'نهایی‌شده', value: 270000000, lastContact: '2025-07-18' }
    ],
    accounting: [
      { id: 1, title: 'فاکتور فروش پروژه فروشگاه آنلاین', type: 'فاکتور فروش', amount: 120000000, date: '2025-07-10', status: 'دریافت شده' },
      { id: 2, title: 'پرداخت به طراح', type: 'پرداخت', amount: 30000000, date: '2025-07-11', status: 'انجام شده' },
      { id: 3, title: 'فاکتور خرید نرم‌افزار', type: 'فاکتور خرید', amount: 22000000, date: '2025-07-12', status: 'در انتظار' }
    ],
    notes: {
      '2025-07-15': 'جلسه بررسی پیشرفت پروژه فروشگاه آنلاین.'
    }
  }
};
