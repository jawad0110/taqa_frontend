import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام لموقع طاقة',
};

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-right mb-8 text-gray-900">الشروط والأحكام</h1>
        
        <div className="space-y-6 text-right text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">مقدمة</h2>
            <p>
              مرحباً بكم في موقع طاقة. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام الموقع أو إجراء أي عمليات شراء.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">القبول بالشروط</h2>
            <p>
              باستخدامك لموقعنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">الحسابات والأمان</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور</li>
              <li>أنت توافق على إبلاغنا فوراً بأي استخدام غير مصرح به لحسابك</li>
              <li>نحتفظ بالحق في تعطيل أي حساب في حالة انتهاك هذه الشروط</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">المنتجات والأسعار</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>جميع الأسعار قابلة للتغيير دون إشعار مسبق</li>
              <li>نحتفظ بالحق في رفض أو إلغاء أي طلب</li>
              <li>الألوان والصور المعروضة قد تختلف قليلاً عن المنتج الفعلي</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">الدفع والضرائب</h2>
            <p>نقبل وسائل الدفع المتاحة على الموقع. قد تخضع بعض المعاملات للضرائب وفقاً للقوانين المحلية.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">ملكية فكرية</h2>
            <p>جميع المحتويات والتصاميم والرسومات والصور والشعارات هي ملك لنا أو للمرخص لهم. لا يجوز نسخها أو استخدامها دون إذن كتابي مسبق.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">تعديل الشروط</h2>
            <p>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة.
            </p>
          </section>

          <div className="pt-4 text-sm text-gray-500">
            <p>آخر تحديث: 28 مايو 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
