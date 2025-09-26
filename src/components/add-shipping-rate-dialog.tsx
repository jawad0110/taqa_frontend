'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { errorHandler } from '@/lib/error-handler';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface AddShippingRateDialogProps {
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function AddShippingRateDialog({ onSuccess, children }: AddShippingRateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      country: formData.get('country') as string,
      city: formData.get('city') as string,
      price: parseFloat(formData.get('price') as string),
      currency: 'JOD',
    };

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/shipping-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إضافة سعر الشحن');
      }
  
      errorHandler.success('تمت إضافة سعر الشحن بنجاح', 'تمت الإضافة بنجاح');
  
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      errorHandler.error(error.message || 'حدث خطأ أثناء إضافة سعر الشحن', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>إضافة سعر شحن جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال تفاصيل سعر الشحن الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                البلد
              </Label>
              <Input
                id="country"
                name="country"
                required
                className="col-span-3"
                placeholder="مثل: سوريا"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                المدينة
              </Label>
              <Input
                id="city"
                name="city"
                className="col-span-3"
                placeholder="مثل: دمشق"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                السعر (JOD)
              </Label>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="pl-12 text-left"
                    placeholder="0.00"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                    JOD
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddShippingRateDialog;
