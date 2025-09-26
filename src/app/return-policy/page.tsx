import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الإرجاع والاستبدال',
  description: 'سياسة الإرجاع والاستبدال لموقع طاقة',
};

export default function ReturnPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-right mb-8 text-gray-900">سياسة الإرجاع والاستبدال</h1>
        
        <div className="space-y-6 text-right text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">سياسة الإرجاع</h2>
            <p>
              نسعى في طاقة لتقديم أفضل تجربة تسوق لعملائنا. إذا لم تكن راضياً عن منتجك لأي سبب، يمكنك إرجاعه خلال 14 يومًا من تاريخ الاستلام.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">شروط الإرجاع</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>يجب أن يكون المنتج بحالته الأصلية غير مستخدم</li>
              <li>يجب أن يكون المنتج في عبوته الأصلية وسليمة</li>
              <li>يجب أن تكون جميع الملصقات والعلامات التجارية سليمة</li>
              <li>يجب تقديم فاتورة الشراء الأصلية</li>
              <li>لا ينطبق الإرجاع على المنتجات المخصصة أو الشخصية</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">إجراءات الإرجاع</h2>
            <ol className="list-decimal pr-5 space-y-2">
              <li>اتصل بفريق خدمة العملاء على info@taqa.com أو من خلال نموذج الاتصال</li>
              <li>قدم رقم الطلب وسبب الإرجاع</li>
              <li>سيتم تزويدك برقم تتبع للإرجاع</li>
              <li>قم بتعبئة المنتج بشكل آمن في العبوة الأصلية</li>
              <li>أرسل المنتج إلى العنوان المحدد</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">سياسة الاستبدال</h2>
            <p>يمكنك استبدال المنتج خلال 7 أيام من تاريخ الاستلام في الحالات التالية:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>وجود عيب في التصنيع</li>
              <li>تلف المنتج أثناء الشحن</li>
              <li>استلام منتج مختلف عما تم طلبه</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">سياسة الاسترجاع المالي</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>سيتم معالجة المبالغ المستردة خلال 5-7 أيام عمل</li>
              <li>سيتم رد المبلغ بنفس طريقة الدفع الأصلية</li>
              <li>قد تستغرق البنوك المحلية ما يصل إلى 10 أيام عمل لظهور المبلغ في حسابك</li>
              <li>لا يتم استرداد رسوم الشحن الأصلية إلا في حال كان الخطأ من جانبنا</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">المنتجات غير القابلة للإرجاع</h2>
            <ul className="list-disc pr-5 space-y-2">
              <li>المنتجات المخصصة حسب الطلب</li>
              <li>المنتجات المفتوحة أو المستخدمة</li>
              <li>المنتجات الترويجية أو المخفضة</li>
              <li>المنتجات التي لا تحتوي على الفاتورة الأصلية</li>
            </ul>
          </section>

          <div className="pt-4 text-sm text-gray-500">
            <p>آخر تحديث: 28 مايو 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
