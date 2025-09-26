import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية لموقع طاقة',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-right mb-8 text-gray-900">سياسة الخصوصية</h1>
        
        <div className="space-y-6 text-right text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">مقدمة</h2>
            <p>
              نرحب بكم في سياسة الخصوصية الخاصة بموقع طاقة. نحن نحرص على حماية خصوصيتك وبياناتك الشخصية. تشرح هذه السياسة كيفية جمعنا واستخدامنا لمعلوماتك الشخصية.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">المعلومات التي نجمعها</h2>
            <p>نقوم بجمع المعلومات التالية:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>معلومات الهوية (الاسم، عنوان البريد الإلكتروني، رقم الهاتف)</li>
              <li>معلومات الدفع (عند إتمام عملية شراء)</li>
              <li>سجل الطلبات والمعاملات</li>
              <li>بيانات التصفح والتفاعل مع الموقع</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">كيف نستخدم معلوماتك</h2>
            <p>نستخدم معلوماتك للأغراض التالية:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>معالجة الطلبات والمدفوعات</li>
              <li>تحسين تجربة المستخدم</li>
              <li>إرسال التحديثات والعروض الترويجية</li>
              <li>تحليل استخدام الموقع</li>
              <li>الامتثال للقوانين واللوائح</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">حماية البيانات</h2>
            <p>
              نلتزم بحماية بياناتك الشخصية ونستخدم تدابير أمنية مناسبة لحمايتها من الوصول غير المصرح به أو الإفصاح أو التغيير أو التدمير.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">حقوقك</h2>
            <p>لديك الحق في:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>طلب تصحيح البيانات غير الدقيقة</li>
              <li>طلب حذف بياناتك</li>
              <li>الاعتراض على معالجة بياناتك</li>
              <li>طلب تقييد المعالجة</li>
              <li>طلب نقل البيانات</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">التغييرات على سياسة الخصوصية</h2>
            <p>
              نحتفظ بالحق في تحديث سياسة الخصوصية هذه في أي وقت. سنقوم بنشر أي تغييرات على هذه الصفحة وسنقوم بتحديث تاريخ التعديل أدناه.
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
