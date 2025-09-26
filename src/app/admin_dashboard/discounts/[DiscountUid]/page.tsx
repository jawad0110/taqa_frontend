"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { errorHandler } from '@/lib/error-handler';
import { formatISO, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Discount {
  uid: string;
  code: string;
  discount_type: string;
  value: number;
  minimum_order_amount: number;
  expires_at: string | null;
  usage_limit: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string | null;
  used_count?: number;
}

const BRAND_PRIMARY = '#070B39';
const BRAND_SUCCESS = '#63D829';

export default function EditDiscountPage() {
  const { DiscountUid } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [discount, setDiscount] = useState<Partial<Discount>>({
    code: "",
    discount_type: "percentage",
    value: 0,
    minimum_order_amount: 0,
    expires_at: null,
    usage_limit: 0,
    is_active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user?.accessToken) {
      fetchDiscount();
    }
  }, [status, session]);

  const fetchDiscount = async () => {

    
    if (status === 'unauthenticated' || !session?.user?.accessToken) {
      console.error('No access token found or not authenticated');
      errorHandler.error('يجب تسجيل الدخول أولاً');
      router.push('/auth/signin');
      return;
    }

    // Ensure DiscountUid is a string and not an array
    const discountId = Array.isArray(DiscountUid) ? DiscountUid[0] : DiscountUid;
    
    if (!discountId) {
      console.error('No discount ID provided');
      errorHandler.error('معرف الخصم غير صالح');
      router.push('/admin_dashboard/discounts');
      return;
    }

    try {

      
      // First, try to get the discount directly by ID
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts/${encodeURIComponent(discountId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      );

      
      
      if (response.status === 404) {
        // If direct fetch fails, try to find the discount in the list

        const listResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts`,
          {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          }
        );

        if (!listResponse.ok) {
          throw new Error('فشل تحميل قائمة الخصومات');
        }

        const listData = await listResponse.json();

        
        // Find the discount in the list
        const discounts = Array.isArray(listData) ? listData : (listData.items || []);
        const discount = discounts.find((d: any) => 
          d.uid === discountId || d.id === discountId || d.code === discountId
        );
        
        if (!discount) {
          throw new Error('الخصم غير موجود أو تم حذفه');
        }
        
        
        updateFormWithDiscount(discount);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشل تحميل بيانات الخصم: ${response.status} ${response.statusText}`);
      }
      
      const discountData = await response.json();

      updateFormWithDiscount(discountData);
      
    } catch (error) {
      console.error('Error in fetchDiscount:', error);
      errorHandler.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      router.push('/admin_dashboard/discounts');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormWithDiscount = (discountData: any) => {

    
    // Transform the data to match our form state
    const formattedData = {
      uid: discountData.uid || discountData.id || '',
      code: discountData.code || '',
      discount_type: discountData.discount_type || 'percentage',
      value: Number(discountData.value) || 0,
      minimum_order_amount: Number(discountData.minimum_order_amount) || 0,
      usage_limit: Number(discountData.usage_limit) || 0,
      is_active: Boolean(discountData.is_active),
      // Handle both expires_at and end_date for backward compatibility
      expires_at: discountData.expires_at || discountData.end_date || null,
      start_date: discountData.start_date || null,
      end_date: discountData.end_date || null,
      created_at: discountData.created_at || null,
      used_count: discountData.used_count || 0
    };


    
    setDiscount(formattedData);
    
    // Set the dates for the date pickers
    if (formattedData.start_date) {
      const startDate = new Date(formattedData.start_date);
  
      setStartDate(startDate);
    }
    
    if (formattedData.expires_at) {
      const endDate = new Date(formattedData.expires_at);
      
      setEndDate(endDate);
    } else if (formattedData.end_date) {
      const endDate = new Date(formattedData.end_date);
      
      setEndDate(endDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {

      return;
    }
    
    if (!session?.user?.accessToken) {
      console.error('No access token found');
      errorHandler.error("يجب تسجيل الدخول أولاً");
      router.push('/auth/signin');
      return;
    }
    
    const discountId = Array.isArray(DiscountUid) ? DiscountUid[0] : DiscountUid;
    if (!discountId) {
      console.error('Invalid discount ID:', DiscountUid);
      errorHandler.error("معرف الخصم غير صالح");
      return;
    }
    


    if (!discount.code) {
      errorHandler.error("الرجاء إدخال كود الخصم");
      return;
    }

    if (!discount.value || Number(discount.value) <= 0) {
      errorHandler.error("الرجاء إدخال قيمة صحيحة للخصم");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: discount.code,
        discount_type: discount.discount_type,
        value: Number(discount.value),
        minimum_order_amount: Number(discount.minimum_order_amount) || 0,
        expires_at: endDate ? formatISO(endDate) : null,
        usage_limit: Number(discount.usage_limit) || 0,
        is_active: Boolean(discount.is_active),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts/${encodeURIComponent(discountId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      

      
      if (response.status === 404) {
        throw new Error('الخصم غير موجود أو تم حذفه');
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || "فشل تحديث كوبون الخصم");
      }

      errorHandler.success("تم تحديث كوبون الخصم بنجاح");
      router.push("/admin_dashboard/discounts");
    } catch (error: any) {
      console.error("Error updating discount:", error);
      const errorMessage = error.message || "حدث خطأ أثناء تحديث كوبون الخصم";
      errorHandler.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_PRIMARY }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">تعديل كوبون الخصم</h1>
        <p className="text-gray-600">قم بتعديل بيانات كوبون الخصم</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* كود الخصم */}
            <div className="space-y-2">
              <Label htmlFor="code">كود الخصم</Label>
              <Input
                id="code"
                value={discount.code}
                onChange={(e) =>
                  setDiscount({ ...discount, code: e.target.value })
                }
                placeholder="مثال: SUMMER20"
                required
                className="focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
              />
            </div>

            {/* نوع الخصم */}
            <div className="space-y-2">
              <Label htmlFor="discount_type">نوع الخصم</Label>
              <Select
                value={discount.discount_type}
                onValueChange={(value: "percentage" | "fixed") =>
                  setDiscount({ ...discount, discount_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الخصم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* قيمة الخصم */}
            <div className="space-y-2">
              <Label htmlFor="value">
                {discount.discount_type === "percentage"
                  ? "نسبة الخصم %"
                  : "قيمة الخصم (د.أ)"}
              </Label>
              <Input
                id="value"
                type="number"
                min={0}
                step={discount.discount_type === "percentage" ? 0.1 : 1}
                value={discount.value}
                onChange={(e) =>
                  setDiscount({ ...discount, value: Number(e.target.value) })
                }
                required
                className="focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
              />
            </div>

            {/* الحد الأدنى للطلب */}
            <div className="space-y-2">
              <Label htmlFor="minimum_order_amount">
                الحد الأدنى للطلب (د.أ)
              </Label>
              <Input
                id="minimum_order_amount"
                type="number"
                min={0}
                value={discount.minimum_order_amount || 0}
                onChange={(e) =>
                  setDiscount({
                    ...discount,
                    minimum_order_amount: Number(e.target.value),
                  })
                }
                className="focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
              />
            </div>

            {/* حد الاستخدام */}
            <div className="space-y-2">
              <Label htmlFor="usage_limit">حد الاستخدام (اختياري، اتركه 0 ليكون غير محدود)</Label>
              <Input
                id="usage_limit"
                type="number"
                min={0}
                value={discount.usage_limit}
                onChange={(e) =>
                  setDiscount({
                    ...discount,
                    usage_limit: Number(e.target.value),
                  })
                }
                placeholder="اتركه فارغًا ليكون غير محدود"
                className="focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
              />
            </div>

            {/* تاريخ الانتهاء */}
            <div className="space-y-2">
              <Label>تاريخ انتهاء الصلاحية (اختياري)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر تاريخ انتهاء الصلاحية</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* الحالة */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="is_active" className="flex flex-col space-y-1">
                <span>الحالة</span>
                <span className="text-sm text-gray-500">
                  {discount.is_active ? "نشط" : "غير نشط"}
                </span>
              </Label>
              <div className="relative flex items-center">
                <Switch
                  id="is_active"
                  checked={discount.is_active}
                  onCheckedChange={(checked) => setDiscount({ ...discount, is_active: checked })}
                  className={`${
                    discount.is_active ? '' : ''
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#070B39] focus:ring-offset-2`}
                >
                  <span className="sr-only">Toggle status</span>
                  <span
                    className={`${
                      discount.is_active ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin_dashboard/discounts")}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#070B39] text-white hover:opacity-90">
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
