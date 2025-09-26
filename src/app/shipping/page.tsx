import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الشحن والتوصيل',
  description: 'سياسة الشحن والتوصيل لموقع طاقة',
};

export default function ShippingPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-right mb-8 text-gray-900">سياسة الشحن والتوصيل</h1>
        
        <div className="space-y-6 text-right text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">مقدمة</h2>
            <p>
              نحرص في طاقة على توفير خدمة توصيل سريعة وموثوقة لجميع أنحاء المملكة العربية السعودية. تهدف هذه السياسة إلى توضيح إجراءات الشحن والتسليم المتبعة في متجرنا.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">مناطق التوصيل</h2>
            <p>نقوم بالتوصيل إلى جميع أنحاء المملكة العربية السعودية:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>الرياض</li>
              <li>جدة</li>
              <li>الدمام</li>
              <li>وجميع المناطق الأخرى</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">مدة التوصيل</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>المدن الرئيسية: 1-3 أيام عمل</li>
              <li>المدن الأخرى: 2-5 أيام عمل</li>
              <li>المناطق النائية: 5-7 أيام عمل</li>
              <li>قد تختلف مدة التوصيل في المواسم والأعياد</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">رسوم الشحن</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>الطلبات التي تزيد قيمتها عن 200 JOD: توصيل مجاني</li>
              <li>الطلبات الأقل من 200 JOD: 20 JOD رسوم شحن</li>
              <li>التوصيل السريع: 50 JOD إضافية</li>
              <li>المناطق النائية: قد تنطبق رسوم إضافية</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">تتبع الطلب</h2>
            <p>بعد تأكيد طلبك، سنرسل لك رسالة تحتوي على:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>رقم تتبع الطلب</li>
              <li>رابط لمتابعة حالة الشحن</li>
              <li>معلومات الاتصال بفريق الدعم</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">سياسة استلام الطلب</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>يرجى فحص الطلب عند الاستلام</li>
              <li>في حال وجود أي تلف أو نقص، يرجى رفض استلام الطلب</li>
              <li>يجب توقيع إيصال الاستلام</li>
              <li>سيتم إرسال صورة من الإيصال إلى بريدك الإلكتروني</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">الأسئلة الشائعة</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">كيف يمكنني تغيير عنوان التوصيل؟</h3>
                <p className="text-gray-600 pr-4">يمكنك تغيير العنوان قبل شحن الطلب من خلال التواصل مع خدمة العملاء.</p>
              </div>
              <div>
                <h3 className="font-medium">ماذا لو لم أكن متواجداً عند التوصيل؟</h3>
                <p className="text-gray-600 pr-4">سيقوم مندوب التوصيل بمحاولة الاتصال بك. في حالة عدم التواجد، سيتم إعادة جدولة موعد التوصيل.</p>
              </div>
              <div>
                <h3 className="font-medium">هل تقدمون شحن دولي؟</h3>
                <p className="text-gray-600 pr-4">حالياً نقدم الشحن داخل المملكة العربية السعودية فقط.</p>
              </div>
            </div>
          </section>

          <div className="pt-4 text-sm text-gray-500">
            <p>آخر تحديث: 28 مايو 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
