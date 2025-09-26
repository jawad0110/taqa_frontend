'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { errorHandler } from '@/lib/error-handler';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingBag, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define interfaces for data structures
interface CartItem {
  uid: string;
  product_uid: string;
  variant_choice_id?: string;
  product_title: string;
  main_image_url?: string;
  quantity: number;
  price: number;
  stock: number;
}

interface ShippingAddress {
  full_name: string;
  phone_number: string;
  country: string;
  city: string;
  area: string;
  street: string;
  building_number?: string;
  apartment_number?: string;
  zip_code?: string;
  notes?: string;
}

interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface ShippingRate {
  uid: string;
  country: string;
  city: string;
  price: number;
}

// Interface for grouped shipping rates by country
interface GroupedShippingRate {
  country: string;
  cities: Array<{
    name: string;
    price: number;
  }>;
  rates: {
    [city: string]: {
      uid: string;
      price: number;
    };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();


  // State for loading, cart items, etc.
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotals, setCartTotals] = useState<CartTotals>({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for shipping rates
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [groupedShippingRates, setGroupedShippingRates] = useState<GroupedShippingRate[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // State for shipping address form
  const [shippingAddressForm, setShippingAddressForm] = useState<ShippingAddress>({
    full_name: '',
    phone_number: '',
    country: '',
    city: '',
    area: '',
    street: '',
    building_number: '',
    apartment_number: '',
    zip_code: '',
    notes: '',
  });

  // State for coupon code (optional)
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لإتمام عملية الشراء", "الرجاء تسجيل الدخول");
      router.push('/login');
    } else if (status === "authenticated") {
      fetchCartItems();
      fetchShippingRates();
    }
  }, [status, router]);

  // Fetch cart items from the backend
  const fetchCartItems = async () => {
    setLoading(true);
    setFetchError(null);
    
    try {
      // Fetch cart items
      const cartResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      
      if (!cartResponse.ok) {
        throw new Error('فشل في جلب عناصر السلة');
      }
      
      const cartData = await cartResponse.json();
      setCartItems(cartData);
      
      // Fetch cart totals
      const totalsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/totals`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      
      if (!totalsResponse.ok) {
        throw new Error('فشل في حساب المجموع');
      }
      
      const totalsData = await totalsResponse.json();
      // Parse discount - backend returns it as string with minus sign
      const discountValue = typeof totalsData.discount === 'string' 
        ? parseFloat(totalsData.discount.replace('-', '')) 
        : totalsData.discount || 0;
      
      setCartTotals({
        subtotal: totalsData.subtotal || 0,
        discount: discountValue,
        shipping: 0, // No shipping initially
        total: totalsData.total || 0 // Backend total (subtotal - discount)
      });
      
    } catch (error) {
      console.error('Error fetching cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب عناصر السلة';
      setFetchError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipping rates from the backend
  const fetchShippingRates = async () => {
    setLoadingRates(true);
    
    try {
      // Fetch shipping rates from our API endpoint
      const response = await fetch('/api/shipping-rates');
      
      if (!response.ok) {
        throw new Error('فشل في جلب معدلات الشحن');
      }
      
      const data = await response.json();
      
      // Extract countries from the grouped data
      const countries = data.map((item: GroupedShippingRate) => item.country);
      setAvailableCountries(countries);
      
      // Store the grouped data for later use
      setGroupedShippingRates(data);
      
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      errorHandler.error("فشل في جلب معدلات الشحن المتاحة");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddressForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle country selection change
  const handleCountryChange = (value: string) => {
    // Update form with selected country
    setShippingAddressForm(prev => ({
      ...prev,
      country: value,
      city: '' // Reset city when country changes
    }));
    
    // Find the selected country in the grouped data
    const selectedCountry = groupedShippingRates.find(item => item.country === value);
    
    if (selectedCountry) {
      // Extract city names from the selected country
      const cities = selectedCountry.cities.map(city => city.name);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
    
    // Reset selected shipping rate
    setSelectedRate(null);
    
    // Update cart totals with no shipping
    updateCartTotalsWithShipping(0);
  };

  // Handle city selection change
  const handleCityChange = (value: string) => {
    const country = shippingAddressForm.country;
    
    // Update form with selected city
    setShippingAddressForm(prev => ({
      ...prev,
      city: value
    }));
    
    // Find the selected country in the grouped data
    const selectedCountry = groupedShippingRates.find(item => item.country === country);
    
    if (selectedCountry && value) {
      // Get the rate for the selected city
      const cityRate = selectedCountry.rates[value];
      
      if (cityRate) {
        // Create a shipping rate object from the selected city
        const rate = {
          uid: cityRate.uid,
          country: country,
          city: value,
          price: cityRate.price
        };
        
        setSelectedRate(rate);
        
        // Update cart totals with shipping price
        updateCartTotalsWithShipping(cityRate.price);
      }
    } else {
      setSelectedRate(null);
      updateCartTotalsWithShipping(0);
    }
  };

  // Remove coupon code
  const handleRemoveCoupon = async () => {
    setIsApplyingCoupon(true);
    setCouponError(null);
    
    try {
      // Fetch totals without discount code
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/totals`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل في إزالة كود الخصم');
      }
      
      const totalsData = await response.json();
      setCartTotals({
        subtotal: totalsData.subtotal || 0,
        discount: 0,
        shipping: cartTotals.shipping, // Keep current shipping
        total: (totalsData.total || 0) + cartTotals.shipping // Backend total + current shipping
      });
      
      setCouponCode('');
      setCouponApplied(false);
      errorHandler.success("تم إزالة كود الخصم");
    } catch (error) {
      console.error('Error removing coupon:', error);
      errorHandler.error('حدث خطأ أثناء إزالة كود الخصم');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    setCouponError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/totals?discount_code=${encodeURIComponent(couponCode)}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error('كود الخصم غير موجود');
        } else if (response.status === 400) {
          throw new Error(errorData.detail || 'كود الخصم غير صالح');
        } else {
          throw new Error('حدث خطأ أثناء تطبيق كود الخصم');
        }
      }
      
      const totalsData = await response.json();
      // Parse discount - backend returns it as string with minus sign
      const discountValue = typeof totalsData.discount === 'string' 
        ? parseFloat(totalsData.discount.replace('-', '')) 
        : totalsData.discount || 0;
      
      setCartTotals({
        subtotal: totalsData.subtotal || 0,
        discount: discountValue,
        shipping: cartTotals.shipping, // Keep current shipping
        total: (totalsData.total || 0) + cartTotals.shipping // Backend total + current shipping
      });
      
      setCouponApplied(true);
      errorHandler.success("تم تطبيق كود الخصم بنجاح");
    } catch (error) {
      console.error('Error applying coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'كود الخصم غير صالح';
      setCouponError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Place order function
  const handlePlaceOrder = async () => {
    if (!selectedRate) {
      errorHandler.error("الرجاء اختيار طريقة الشحن");
      return;
    }

    setIsPlacingOrder(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping_address: shippingAddressForm,
          coupon_code: couponApplied ? couponCode : null,
          shipping_rate_uid: selectedRate.uid
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Checkout error response:', data);
        throw new Error(data.error || data.detail || 'فشل في إتمام الطلب');
      }

      // Clear cart and redirect to success page
      // await clearCart();
      router.push(`/profile/orders/${data.uid}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      errorHandler.error(
        error instanceof Error ? error.message : 'حدث خطأ أثناء إتمام الطلب',
        "خطأ في إتمام الطلب"
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Format price with JOD currency
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} JOD`; // JOD currency
  };

  // Function to update cart totals with shipping price
  const updateCartTotalsWithShipping = (shippingPrice: number) => {
    setCartTotals(prev => ({
      ...prev,
      shipping: shippingPrice,
      total: (prev.subtotal - prev.discount) + shippingPrice // Recalculate total with new shipping
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg">جاري تحميل معلومات الطلب...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fetchError}
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={() => fetchCartItems()}>إعادة المحاولة</Button>
          <Button variant="outline" className="mr-2" onClick={() => router.push('/cart')}>
            العودة إلى السلة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">إتمام الطلب</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {/* Shipping Address Form */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center">
              <MapPin className="mr-2 h-5 w-5" />
              <CardTitle>عنوان الشحن</CardTitle> {/* Shipping Address */}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={shippingAddressForm.full_name}
                    onChange={handleInputChange}
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">رقم الهاتف *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={shippingAddressForm.phone_number}
                    onChange={handleInputChange}
                    placeholder="أدخل رقم الهاتف"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة *</Label>
                  <Select
                    value={shippingAddressForm.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="اختر الدولة" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة *</Label>
                  <Select
                    value={shippingAddressForm.city}
                    onValueChange={handleCityChange}
                    disabled={!shippingAddressForm.country}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map(city => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">المنطقة *</Label>
                  <Input
                    id="area"
                    name="area"
                    value={shippingAddressForm.area}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم المنطقة"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">الشارع *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={shippingAddressForm.street}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الشارع"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building_number">رقم المبنى</Label>
                  <Input
                    id="building_number"
                    name="building_number"
                    value={shippingAddressForm.building_number}
                    onChange={handleInputChange}
                    placeholder="أدخل رقم المبنى"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apartment_number">رقم الشقة</Label>
                  <Input
                    id="apartment_number"
                    name="apartment_number"
                    value={shippingAddressForm.apartment_number}
                    onChange={handleInputChange}
                    placeholder="أدخل رقم الشقة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">الرمز البريدي</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={shippingAddressForm.zip_code}
                    onChange={handleInputChange}
                    placeholder="أدخل الرمز البريدي"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={shippingAddressForm.notes}
                    onChange={handleInputChange}
                    placeholder="أي ملاحظات إضافية حول الطلب أو التوصيل"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Section */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              <CardTitle>طريقة الدفع</CardTitle> {/* Payment Method */}
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={true}
                    readOnly
                    className="form-radio text-primary"
                  />
                  <span className="mr-2 text-gray-700">الدفع عند الاستلام</span> {/* Payment on Delivery */}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  سيتم الدفع نقداً عند استلام الطلب.
                </p> {/* Payment will be made in cash upon receipt of the order. */}
              </div>

              {/* Notification Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                <p className="font-semibold">ملاحظة هامة:</p> {/* Important Note: */}
                <p>سيتم تأكيد طلبك والدفع عند استلامه.</p> {/* Your order will be confirmed and paid upon receipt. */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                <CardTitle>ملخص الطلب</CardTitle> {/* Order Summary */}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">السلة فارغة</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/products')}
                  >
                    تصفح المنتجات
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {cartItems.map((item: CartItem) => (
                      <div key={item.uid} className="flex items-center space-x-4 rtl:space-x-reverse border-b pb-4">
                        <div className="h-16 w-16 relative overflow-hidden rounded-md border">
                          {item.main_image_url ? (
                            <Image
                              src={item.main_image_url}
                              alt={item.product_title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.price)} × {item.quantity}
                            </p>
                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                          {item.variant_choice_id && (
                            <Badge variant="outline" className="mt-1">
                              متغير
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Code */}
                  <div className="pt-2">
                    <Label htmlFor="couponCode">كود الخصم</Label>
                    <div className="flex mt-1">
                      <Input
                        id="couponCode"
                        placeholder="أدخل كود الخصم هنا"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="rounded-l-none"
                        disabled={couponApplied || isApplyingCoupon}
                      />
                      {couponApplied ? (
                        <Button 
                          onClick={handleRemoveCoupon}
                          disabled={isApplyingCoupon}
                          className="rounded-r-none"
                          variant="destructive"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "إزالة"
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || isApplyingCoupon}
                          className="rounded-r-none"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "تطبيق"
                          )}
                        </Button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-500 mt-1">{couponError}</p>
                    )}
                    {couponApplied && (
                      <p className="text-sm text-green-600 mt-1">تم تطبيق كود الخصم بنجاح</p>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">المجموع الفرعي:</span>
                      <span>{formatPrice(cartTotals.subtotal)}</span>
                    </div>
                    {cartTotals.discount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>الخصم:</span>
                        <span>- {formatPrice(cartTotals.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">رسوم الشحن:</span>
                      <span>{formatPrice(cartTotals.shipping)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>المجموع الكلي:</span>
                      <span>{formatPrice(cartTotals.total)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handlePlaceOrder}
                disabled={
                  isPlacingOrder || 
                  cartItems.length === 0 || 
                  Object.entries(shippingAddressForm)
                    .filter(([key]) => ['full_name', 'phone_number', 'country', 'city', 'area', 'street'].includes(key))
                    .some(([_, value]) => !value)
                }
                className="w-full py-6 text-lg"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إتمام الطلب...
                  </>
                ) : (
                  'إتمام الطلب'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
