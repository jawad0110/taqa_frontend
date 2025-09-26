import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl font-bold text-gray-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">الصفحة غير موجودة</h1>
        <p className="text-gray-600 mb-8">عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. يبدو أن الرابط الذي اتبعته غير صحيح أو أن الصفحة قد تم نقلها.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/products">
              تصفح المنتجات
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
