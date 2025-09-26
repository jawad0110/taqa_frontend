'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { errorHandler } from '@/lib/error-handler';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface OrderItem {
  uid: string;
  product: {
    uid: string;
    title: string;
    main_image_url: string;
    variant_groups: {
      uid: string;
      name: string;
      choices: Array<{
        uid: string;
        name: string;
      }>
    }[];
  };
  quantity: number;
  price_at_purchase: number;
  total_price: number;
  variant_choice_id: string;
}

interface Order {
  uid: string;
  user_uid: string;
  first_name: string;
  last_name: string;
  status: string;
  total_price: number;
  shipping_price: number;
  discount: number;
  final_price: number;
  coupon_code: string | null;
  created_at: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const { orderUid } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');

  const updateOrderStatus = async (status: string) => {
    if (!orderUid) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderUid}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            updated_at: new Date().toISOString()
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP Error ${res.status}: ${errorText}`);
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      errorHandler.success('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error instanceof Error) {
        errorHandler.error(error.message);
      } else {
        errorHandler.error('حدث خطأ أثناء تحديث حالة الطلب');
      }
    }
  };

  const processOrderItem = (item: OrderItem) => {
    try {
      const product = item.product || {};
      const variantGroups = product.variant_groups || [];
      
      let variantName = undefined;
      if (item.variant_choice_id && variantGroups.length > 0) {
        const allChoices = variantGroups.flatMap((vg: any) => vg.choices || []);
        const variantChoice = allChoices.find((vc: any) => vc.uid === item.variant_choice_id);
        variantName = variantChoice?.name;
      }
      
      return {
        ...item,
        product: {
          ...product,
          variant_groups: variantGroups
        },
        image_url: product.main_image_url || '',
        variant_name: variantName
      };
    } catch (error) {
      console.error('Error processing order item:', error);
      return {
        ...item,
        product: item.product || {
          uid: '',
          title: 'Product not found',
          main_image_url: '',
          variant_groups: []
        },
        image_url: '',
        variant_name: ''
      };
    }
  };

  const fetchOrder = async () => {
    if (!orderUid) {
      errorHandler.error('No order UID provided');
      return;
    }

    setLoading(true);
    
    try {
  
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderUid}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );


      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP Error ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      
      if (!data || !Array.isArray(data.items)) {
        console.error('Invalid order data:', data);
        throw new Error('Invalid order data format');
      }

      // Process all order items
      const itemsWithDetails = data.items.map(processOrderItem);

      setOrder({
        ...data,
        items: itemsWithDetails
      });
    } catch (e: any) {
      console.error('API Error:', e);
      errorHandler.error(`فشل تحميل تفاصيل الطلب: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchOrder();
    }
  }, [session?.user?.accessToken]);

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!order) {
    return <div className="p-6">لم يتم العثور على الطلب</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">تفاصيل الطلب #{order.uid}</h1>
        <Button onClick={() => router.push('/admin_dashboard/orders')}>رجوع إلى قائمة الطلبات</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الأول</label>
              <Input value={order.first_name} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم العائلة</label>
              <Input value={order.last_name} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>معلومات الشحن</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الشارع</label>
              <Input value={order.shipping_address.street} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <Input value={order.shipping_address.city} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المنطقة</label>
              <Input value={order.shipping_address.state} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الرمز البريدي</label>
              <Input value={order.shipping_address.postal_code} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البلد</label>
              <Input value={order.shipping_address.country} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>معلومات الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الحالة</label>
              <Select value={order?.status} onValueChange={async (value) => {
                setNewStatus(value);
                await updateOrderStatus(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="processing">قيد المعالجة</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="canceled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">كود الخصم</label>
              <Input value={order.coupon_code || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الإنشاء</label>
              <Input value={format(new Date(order.created_at), 'MMM d, yyyy HH:mm')} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {order.items.map((item, index) => (
              <div key={index} className="border-b pb-6 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center">
                    {item.product?.main_image_url ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${item.product.uid}/${item.product.main_image_url}`}
                        alt={item.product.title}
                        className="w-32 h-32 object-cover rounded-lg"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/public/assets/images/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">لا يوجد صورة</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اسم المنتج</label>
                      <div className="text-gray-900">
                        {item.product.title}
                        <span className="text-gray-500 mr-2">× {item.quantity}</span>
                      </div>
                    </div>
                    {item.product?.variant_groups?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">النوع</label>
                        <div className="text-gray-900">
                          {(() => {
                            try {
                              if (!item.variant_choice_id || !item.product?.variant_groups) {
                                return 'لا يوجد';
                              }
                              
                              // Safely find the variant choice
                              const allChoices = (item.product.variant_groups || [])
                                .flatMap(vg => Array.isArray(vg?.choices) ? vg.choices : []);
                                
                              const variantChoice = allChoices.find(
                                vc => vc && vc.uid === item.variant_choice_id
                              );
                              
                              return variantChoice?.name || 'لا يوجد';
                            } catch (error) {
                              console.error('Error getting variant name:', error);
                              return 'لا يوجد';
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">حالة الطلب</label>
                      <div className="text-gray-900">{order?.status}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">سعر الوحدة</label>
                      <div className="text-gray-900">{item.price_at_purchase} دينار</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">المجموع</label>
                      <div className="text-gray-900">{item.total_price} دينار</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">المجموع الكلي</label>
                <div className="text-gray-900">{order.total_price} دينار</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رسوم التوصيل</label>
                <div className="text-gray-900">{order.shipping_price ? `${order.shipping_price} دينار` : 'مجاني'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الخصم</label>
                <div className="text-gray-900">{order.discount} دينار</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المجموع النهائي</label>
                <div className="text-gray-900">{order.final_price} دينار</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}