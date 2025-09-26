"use client";

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Clock } from 'lucide-react';

const Footer = () => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    const socialLinks = [
        {
            name: 'Instagram',
            href: 'https://www.instagram.com/taqa.motivation?igsh=dDd3ZGpienY5NXAw',
            icon: (
                <Image
                    src="/assets/images/instagram.png"
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="w-6 h-6 transition-transform group-hover:scale-110 stroke-primary"
                />
            ),
        },
        {
            name: 'Facebook',
            href: 'https://www.facebook.com/profile.php?id=61573443502774',
            icon: (
                <Image
                    src="/assets/images/facebook.png"
                    alt="Facebook"
                    width={24}
                    height={24}
                    className="w-6 h-6 transition-transform group-hover:scale-110 stroke-primary"
                />
            ),
        },
    ];

    const quickLinks = [
        { name: 'الصفحة الرئيسية', href: '/' },
        { name: 'المنتجات', href: '/products' },
        { name: 'قائمة الرغبات', href: '/wishlist' },
        { name: 'سلة التسوق', href: '/cart' },
    ];

    const contactInfo = [
        {
            icon: <Mail className="w-5 h-5 text-primary stroke-primary" />,
            text: 'taqa.store01@gmail.com ',
            href: 'mailto:taqa.store01@gmail.com'
        },
        {
            icon: <MapPin className="w-5 h-5 text-primary stroke-primary" />,
            text: 'الاردن و سوريا',
            href: '#'
        },
        {
            icon: <Clock className="w-5 h-5 text-primary stroke-primary" />,
            text: 'جميع ايام الاسبوع: 9 ص - 9 م',
            href: '#'
        }
    ];

    const footerLinks = [
        { name: 'سياسة الخصوصية', href: '/privacy' },
        { name: 'الشروط والأحكام', href: '/terms' },
        { name: 'سياسة الإرجاع', href: '/return-policy' },
        { name: 'الشحن والتوصيل', href: '/shipping' },
    ];

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-muted/50 to-background border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Image
                                src="/assets/images/logo.png"
                                alt="Taqa Logo"
                                width={40}
                                height={40}
                                className="h-10 w-auto"
                            />
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            نوفر لكم أفضل المنتجات بجودة عالية وأسعار تنافسية. نسعى دائمًا لتحقيق رضا عملائنا الكرام.
                        </p>
                        <div className="flex space-x-4 space-x-reverse">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-2 rounded-full bg-background shadow-sm hover:shadow-md transition-all duration-300"
                                    aria-label={link.name}
                                >
                                    {link.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-foreground relative pb-2 after:absolute after:right-0 after:bottom-0 after:h-0.5 after:w-10 after:bg-gradient-to-r after:from-primary after:to-secondary after:rounded-full">
                            روابط سريعة
                        </h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors duration-200 group ${pathname === link.href ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                                    >
                                        <span className="ml-2 group-hover:mr-1 transition-all">
                                            {link.name}
                                        </span>
                                        <svg className="w-4 h-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-foreground relative pb-2 after:absolute after:right-0 after:bottom-0 after:h-0.5 after:w-10 after:bg-gradient-to-r after:from-primary after:to-secondary after:rounded-full">
                            معلومات التواصل
                        </h3>
                        <ul className="space-y-3">
                            {contactInfo.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 hover:bg-muted p-2 rounded-lg transition-colors duration-200">
                                    <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                                    <a 
                                        href={item.href} 
                                        className="text-muted-foreground hover:text-primary transition-colors duration-200 leading-relaxed"
                                    >
                                        {item.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-foreground relative pb-2 after:absolute after:right-0 after:bottom-0 after:h-0.5 after:w-10 after:bg-gradient-to-r after:from-primary after:to-secondary after:rounded-full">
                            النشرة البريدية
                        </h3>
                        <p className="text-muted-foreground text-right leading-relaxed">
                            اشترك في نشرتنا البريدية لتصلك آخر العروض والتحديثات
                        </p>
                        <form className="space-y-4">
                            <div className="relative">
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="بريدك الإلكتروني"
                                        className="w-full px-4 py-3 pl-32 pr-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-right"
                                        dir="rtl"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 text-sm font-medium"
                                    >
                                        اشتراك الآن
                                    </button>
                                </div>
                            </div>
                        </form>
                        {!isAuthenticated && status !== 'loading' && (
                            <div className="pt-4 space-y-3">
                                <Link
                                    href="/signup"
                                    className="block w-full text-center bg-gradient-to-r from-secondary to-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:opacity-90 transition-all duration-300 font-medium"
                                >
                                    إنشاء حساب جديد
                                </Link>
                                <p className="text-center text-sm text-muted-foreground">
                                    لديك حساب؟{' '}
                                    <Link href="/login" className="text-primary hover:underline">
                                        تسجيل الدخول
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-6 border-t border-border">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-muted-foreground text-sm">
                            {currentYear} طاقة. جميع الحقوق محفوظة
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                            {footerLinks.map((link, index) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-muted-foreground hover:text-primary text-sm transition-colors flex items-center"
                                >
                                    {index > 0 && <span className="mx-1">•</span>}
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground/60">
                            جميع المنتجات المعروضة على الموقع مملوكة لشركة طاقة. أي نسخ أو توزيع غير مصرح به يعرض صاحبه للمساءلة القانونية.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
