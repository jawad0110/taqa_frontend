"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { errorHandler } from '@/lib/error-handler';
import { formatISO } from "date-fns";
import { Calendar as CalendarIcon, X, Check } from "lucide-react";
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
  code: string;
  discount_type: string;
  value: number;
  minimum_order_amount: number;
  expires_at: string;
  usage_limit: number;
  is_active: boolean;
}

export default function CreateDiscountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [discount, setDiscount] = useState<Partial<Discount>>({
    code: "",
    discount_type: "percentage",
    value: 0,
    minimum_order_amount: 0,
    expires_at: "",
    usage_limit: 0,
    is_active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.accessToken) {
      errorHandler.error("يجب تسجيل الدخول أولاً");
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || "فشل إنشاء كوبون الخصم");
      }

      errorHandler.success("تم إنشاء كوبون الخصم بنجاح");
      router.push("/admin_dashboard/discounts");
    } catch (error: any) {
      console.error("Error creating discount:", error);
      const errorMessage = error.message || "حدث خطأ أثناء إنشاء كوبون الخصم";
      errorHandler.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">إضافة كوبون خصم جديد</h1>
        <p className="text-gray-600">املأ النموذج أدناه لإنشاء كوبون خصم جديد</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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
                    discount.is_active ? 'bg-green-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
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

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin_dashboard/discounts")}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
