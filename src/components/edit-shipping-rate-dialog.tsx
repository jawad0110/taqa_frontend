'use client';

import { useState, useEffect } from 'react';
import { errorHandler } from '@/lib/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EditShippingRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: {
    uid: string;
    country: string;
    city?: string;
    price: number;
    currency?: string;
  } | null;
  onSuccess: () => void;
  token: string;
}

export function EditShippingRateDialog({ 
  open, 
  onOpenChange, 
  rate, 
  onSuccess, 
  token 
}: EditShippingRateDialogProps) {

  const [formData, setFormData] = useState({
    country: '',
    city: '',
    price: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when rate changes
  useEffect(() => {
    if (rate) {
      setFormData({
        country: rate.country || '',
        city: rate.city || '',
        price: rate.price?.toString() || '0',
      });
    }
  }, [rate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rate) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/shipping-rates/${rate.uid}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            country: formData.country,
            city: formData.city || null,
            price: parseFloat(formData.price) || 0,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'فشل تحديث سعر الشحن');
      }

      errorHandler.success('تم تحديث سعر الشحن بنجاح', 'تم التحديث بنجاح');

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update Shipping Rate Error:', error);
      errorHandler.error(error.message || 'حدث خطأ أثناء تحديث سعر الشحن', 'خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>تعديل سعر الشحن</DialogTitle>
            <DialogDescription>
              قم بتعديل معلومات سعر الشحن. اضغط حفظ عند الانتهاء.
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
                value={formData.country}
                onChange={handleInputChange}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                المدينة
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                السعر (JOD)
              </Label>
              <div className="relative col-span-3">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                  JOD
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
