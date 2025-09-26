'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductDetailModel } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { API_BASE_URL } from '@/app/config';
import { errorHandler } from '@/lib/error-handler';
import { 
  ShoppingBag, 
  Star, 
  Truck, 
  Shield, 
  ArrowRight,
  Target,
  Zap,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Lightbulb,
  Rocket,
  Heart,
  Sparkles,
  ChevronRight,
  Quote
} from 'lucide-react';
import Link from 'next/link';

const arkanFont = 'Arkan, system-ui, sans-serif';

export default function HomePage() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<ProductDetailModel[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductDetailModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState(0);

  const motivationalQuotes = [
    "كل خطوة نحو هدفك هي خطوة نحو النجاح",
    "التميز ليس صدفة، بل نتيجة التخطيط والعمل الجاد",
    "استثمر في نفسك، فأنت أفضل استثمار يمكنك القيام به",
    "النجاح يبدأ عندما تبدأ في اتخاذ القرارات الصحيحة",
    "لا تنتظر الفرصة، اخلقها بنفسك"
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        const featuredResponse = await fetch(`${API_BASE_URL}/products?featured=true&limit=8`);
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          setFeaturedProducts(Array.isArray(featuredData) ? featuredData : featuredData.products || []);
        }

        const latestResponse = await fetch(`${API_BASE_URL}/products?sort=created_at&order=desc&limit=8`);
        if (latestResponse.ok) {
          const latestData = await latestResponse.json();
          setLatestProducts(Array.isArray(latestData) ? latestData : latestData.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        errorHandler.error('حدث خطأ أثناء تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f4f4' }}>
      {/* Motivational Hero Section */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: '#070B39' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
              <Target className="w-5 h-5" style={{ color: '#FFA800' }} />
              <span className="text-sm font-medium">ابدأ رحلتك نحو التميز</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: arkanFont }}>
              استثمر في
              <br />
              <span style={{ color: '#FFA800' }}>مستقبلك</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
              اكتشف المنتجات التي تساعدك على تحقيق أهدافك وتطوير مهاراتك
            </p>

            {/* Motivational Quote */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
              <Quote className="w-8 h-8 mx-auto mb-4" style={{ color: '#FFA800' }} />
              <p className="text-lg md:text-xl font-medium italic">
                {motivationalQuotes[currentQuote]}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/products')}
                className="group px-8 py-4 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 rtl:space-x-reverse"
                style={{ backgroundColor: '#FFA800' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e69900';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFA800';
                }}
              >
                <span>ابدأ رحلتك الآن</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => router.push('/products?featured=true')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-2xl font-semibold text-lg hover:bg-white hover:text-gray-800 transition-all duration-300"
              >
                اكتشف المنتجات المميزة
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products with Motivational Context */}
      <section className="py-20" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse rounded-full px-6 py-3 mb-6" style={{ backgroundColor: '#FFA800', color: 'white' }}>
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">منتجات التميز</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: arkanFont, color: '#070B39' }}>
              أدوات النجاح
            </h2>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#070B39' }}>
              منتجات مختارة بعناية لمساعدتك على تحقيق أهدافك وتطوير مهاراتك الشخصية والمهنية
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#FFA800' }}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#FFA800', animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#FFA800', animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <div key={product.uid} className="group">
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f4f4f4' }}>
                <ShoppingBag className="w-12 h-12" style={{ color: '#070B39' }} />
              </div>
              <p className="text-lg" style={{ color: '#070B39' }}>لا توجد منتجات مميزة حالياً</p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/products?featured=true"
              className="group inline-flex items-center space-x-2 rtl:space-x-reverse px-8 py-4 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#FFA800' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e69900';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFA800';
              }}
            >
              <span>استكشف جميع أدوات النجاح</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Products with Growth Focus */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse rounded-full px-6 py-3 mb-6" style={{ backgroundColor: '#00c7b7', color: 'white' }}>
              <Rocket className="w-5 h-5" />
              <span className="text-sm font-medium">أحدث الإضافات</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: arkanFont, color: '#070B39' }}>
              فرص النمو الجديدة
            </h2>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#070B39' }}>
              اكتشف أحدث المنتجات التي تم إضافتها خصيصاً لمساعدتك على التطور والنمو المستمر
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#00c7b7' }}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#00c7b7', animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#00c7b7', animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : latestProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {latestProducts.map((product, index) => (
                <div key={product.uid} className="group">
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f4f4f4' }}>
                <ShoppingBag className="w-12 h-12" style={{ color: '#070B39' }} />
              </div>
              <p className="text-lg" style={{ color: '#070B39' }}>لا توجد منتجات جديدة حالياً</p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/products"
              className="group inline-flex items-center space-x-2 rtl:space-x-reverse px-8 py-4 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#00c7b7' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00b3a3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00c7b7';
              }}
            >
              <span>استكشف جميع الفرص</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Motivational Newsletter */}
      <section className="py-20" style={{ backgroundColor: '#070B39' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
              <Lightbulb className="w-5 h-5" style={{ color: '#FFA800' }} />
              <span className="text-sm font-medium">ابق ملهمًا</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: arkanFont }}>
              انضم إلى مجتمع المتفوقين
            </h2>
            <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
              احصل على نصائح يومية، عروض حصرية، ومحتوى ملهم لمساعدتك على تحقيق أهدافك
            </p>
            
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="flex-1 px-6 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-gray-800 placeholder-gray-500"
              />
              <button 
                className="px-8 py-4 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#FFA800' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e69900';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFA800';
                }}
              >
                انضم الآن
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-6 rtl:space-x-reverse text-sm opacity-80">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="w-4 h-4" style={{ color: '#FFA800' }} />
                <span>نصائح يومية مجانية</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="w-4 h-4" style={{ color: '#FFA800' }} />
                <span>عروض حصرية</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="w-4 h-4" style={{ color: '#FFA800' }} />
                <span>محتوى ملهم</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="py-16" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: arkanFont, color: '#070B39' }}>
              لماذا تثق بنا؟
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#070B39' }}>
              نحن ملتزمون بتقديم أفضل تجربة تسوق لمساعدتك على تحقيق أهدافك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#FFA800' }}>
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: arkanFont, color: '#070B39' }}>
                توصيل سريع وموثوق
              </h3>
              <p className="leading-relaxed" style={{ color: '#070B39' }}>
                نحن نضمن وصول منتجاتك إليك في الوقت المحدد لتبدأ رحلتك نحو النجاح فوراً
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#00c7b7' }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: arkanFont, color: '#070B39' }}>
                جودة مضمونة
              </h3>
              <p className="leading-relaxed" style={{ color: '#070B39' }}>
                جميع منتجاتنا مختارة بعناية فائقة لضمان حصولك على أفضل النتائج
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#FFA800' }}>
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: arkanFont, color: '#070B39' }}>
                دعم مستمر
              </h3>
              <p className="leading-relaxed" style={{ color: '#070B39' }}>
                فريقنا متاح دائماً لمساعدتك في رحلتك نحو تحقيق أهدافك وطموحاتك
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}