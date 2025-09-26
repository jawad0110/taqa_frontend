"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Check, Trash2, Plus, UploadCloud, X, PlusCircle, ImageUp, XCircle, Palette, AlertTriangle } from 'lucide-react';
import { errorHandler } from "@/lib/error-handler";
import ImageUploadWithFit from "@/components/ImageUploadWithFit";
import { ProductDetailModel, ProductImage, VariantGroup, VariantChoice } from "@/types/product";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function EditProductPage() {
    const { ProductUid } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();


    const [product, setProduct] = useState<ProductDetailModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Image state variables
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [deletingImage, setDeletingImage] = useState<string | null>(null);
    const [settingMainImage, setSettingMainImage] = useState<string | null>(null);

    // Variant state variables
    const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [savingVariants, setSavingVariants] = useState(false);
    const [variantActionInProgress, setVariantActionInProgress] = useState<{type: string, id: string} | null>(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);

    // Form state for product details
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [costPrice, setCostPrice] = useState<number | string>('');
    const [stock, setStock] = useState<number | string>('');
    const [selectedCategoryUid, setSelectedCategoryUid] = useState<string>('');
    const [isActive, setIsActive] = useState(true);

    // Function to fetch product images separately
    const fetchProductImages = useCallback(async () => {
        if (status !== "authenticated" || !session?.user?.accessToken || !ProductUid) return;
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}/images`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.user.accessToken}`,
                    },
                    cache: 'no-store'
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to fetch product images:', errorData.detail || response.statusText);
                return [];
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching product images:', error);
            return [];
        }
    }, [ProductUid, session?.user?.accessToken, status]);

    // Function to refresh images
    const refreshImages = useCallback(async () => {
        const images = await fetchProductImages();
        setProductImages(images);
        return images;
    }, [fetchProductImages]);

    const fetchProductData = useCallback(async () => {
        if (status !== "authenticated" || !session?.user?.accessToken || !ProductUid) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch product data and images in parallel
            const [productResponse, images] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.user.accessToken}`,
                    },
                    cache: 'no-store'
                }),
                fetchProductImages()
            ]);

            if (!productResponse.ok) {
                const errorData = await productResponse.json();
                throw new Error(errorData.detail || `Failed to fetch product data: ${productResponse.statusText}`);
            }

            const data: ProductDetailModel = await productResponse.json();
            
            setProduct(data);
            setTitle(data.title);
            setDescription(data.description);
            setPrice(data.price);
            setCostPrice(data.cost_price || 0);
            setStock(data.stock ?? '');
            setIsActive(data.is_active);
            setProductImages(images || []);
            setVariantGroups(data.variant_groups || []); 
        } catch (err: any) {
            setError(err.message);
            errorHandler.error("خطأ في جلب بيانات المنتج: " + err.message, "خطأ");
        } finally {
            setLoading(false);
        }
    }, [ProductUid, session, status]);


    useEffect(() => {
        if (status === "authenticated" && ProductUid) {
            fetchProductData();
            refreshImages();
        }
    }, [status, ProductUid, fetchProductData, refreshImages]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.accessToken || !product) return;

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const payload = {
            title,
            description,
            price: Number(price),
            cost_price: Number(costPrice),
            stock: Number(stock),
            is_active: isActive,
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.uid}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.user.accessToken}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في تحديث المنتج');
            }
            setSaveSuccess(true);
            errorHandler.success("تم تحديث تفاصيل المنتج بنجاح", "نجح");
            fetchProductData();
        } catch (err: any) {
            setSaveError(err.message);
            errorHandler.error("خطأ في تحديث المنتج: " + err.message, "خطأ");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (imageFile: File): Promise<boolean> => {
        if (!session?.user?.accessToken || !product) {
            errorHandler.error("المنتج أو الجلسة غير موجودة", "خطأ");
            return false;
        }
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", imageFile);

        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.uid}/additional_images`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.user.accessToken}`,
                },
                body: formData,
            });
            
            const responseText = await response.text();
            
            if (!response.ok) {
                let errorDetail = "فشل في رفع الصورة";
                try {
                    const errorData = responseText ? JSON.parse(responseText) : {};
                    errorDetail = errorData.detail || errorDetail;
                } catch (parseError) {
                    console.error("Error parsing API error response:", parseError);
                }
                throw new Error(errorDetail);
            }
            
            await refreshImages();
            await fetchProductData();
            
            errorHandler.success("تم رفع الصورة بنجاح", "نجح");
            return true;
        } catch (err: any) {
            console.error("Image upload error:", err);
            errorHandler.error("خطأ في رفع الصورة: " + err.message, "خطأ");
            return false;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteImage = async (imageUid: string) => {
        if (!session?.user?.accessToken || !product || !imageUid) {
            errorHandler.error("معلومات مطلوبة مفقودة", "خطأ");
            return;
        }
        
        setDeletingImage(imageUid);
        
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.uid}/images/${imageUid}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.user.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في حذف الصورة');
            }
            
            await refreshImages();
            await fetchProductData();
            
            errorHandler.success("تم حذف الصورة بنجاح", "نجح");
        } catch (err: any) {
            console.error('Error deleting image:', err);
            errorHandler.error("خطأ في حذف الصورة: " + err.message, "خطأ");
        } finally {
            setDeletingImage(null);
        }
    };

    const handleSetMainImage = async (imageUid: string) => {
        if (!session?.user?.accessToken || !product) return;
        
        setSettingMainImage(imageUid);
        
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.uid}/images/${imageUid}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.user.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في تعيين الصورة الرئيسية');
            }
            
            await refreshImages();
            await fetchProductData();
            
            errorHandler.success("تم تحديث الصورة الرئيسية بنجاح", "نجح");
        } catch (err: any) {
            console.error('Error setting main image:', err);
            errorHandler.error(err.message || 'حدث خطأ أثناء تحديث الصورة الرئيسية', "خطأ");
        } finally {
            setSettingMainImage(null);
        }
    };

    // Variant Management Handlers
    const handleAddVariantGroup = () => {
        const newGroupId = `temp-group-${Date.now()}`;
        const newChoiceId = `temp-choice-${Date.now()}`;
        const newGroup: VariantGroup = {
            id: newGroupId, 
            name: '',
            product_uid: ProductUid as string,
            choices: [{
                id: newChoiceId, 
                value: '',
                extra_price: 0,
                stock: 0,
                group_id: newGroupId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                product: product!,
                name: ''
            }],
            product: product!
        };
        setVariantGroups(prev => [...prev, newGroup]);
    };

    const handleUpdateVariantGroupName = (groupId: string, name: string) => {
        setVariantGroups(prevGroups => 
            prevGroups.map(group => 
                group.id === groupId ? { ...group, name } : group
            )
        );
    };

    const handleAddVariantChoice = (groupId: string) => {
        const newChoiceId = `temp-choice-${Date.now()}`;
        setVariantGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    const newChoice: VariantChoice = {
                        id: newChoiceId,
                        value: '',
                        extra_price: 0,
                        stock: 0,
                        group_id: groupId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        product: product!,
                        name: ''
                    };
                    return { ...group, choices: [...group.choices, newChoice] };
                }
                return group;
            })
        );
    };

    const handleUpdateVariantChoice = (groupId: string, choiceId: string, field: keyof VariantChoice, value: any) => {
        setVariantGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.id === groupId) {
                    const updatedChoices = group.choices.map(choice => 
                        choice.id === choiceId ? { ...choice, [field]: value } : choice
                    );
                    return { ...group, choices: updatedChoices };
                }
                return group;
            })
        );
    };

    const handleSaveVariants = async () => {
        if (!session?.user?.accessToken || !ProductUid) {
            errorHandler.error("يجب أن تكون مسجل الدخول", "خطأ");
            return;
        }
        setSavingVariants(true);
        try {
            for (const group of variantGroups) {
                const isNewGroup = group.id.startsWith('temp-group-');
                const groupPayload = {
                    name: group.name,
                    choices: group.choices.map(choice => ({
                        ...(choice.id.startsWith('temp-choice-') ? {} : { id: choice.id }),
                        value: choice.value,
                        extra_price: Number(choice.extra_price) || 0,
                        stock: Number(choice.stock) || 0
                    }))
                };

                let response;
                if (isNewGroup) {
                    response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}/variant_groups`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.user.accessToken}` },
                        body: JSON.stringify(groupPayload),
                    });
                } else {
                    response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}/variant_groups/${group.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.user.accessToken}` },
                        body: JSON.stringify(groupPayload),
                    });
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `فشل في حفظ مجموعة المتغيرات ${group.name}`);
                }
            }
            await fetchProductData();
            errorHandler.success("تم تحديث مجموعات المتغيرات والخيارات بنجاح", "نجح");
        } catch (err: any) {
            errorHandler.error("خطأ في حفظ المتغيرات: " + err.message, "خطأ");
        } finally {
            setSavingVariants(false);
        }
    };

    const handleDeleteVariantGroup = async (groupId: string) => {
        if (!session?.user?.accessToken || !ProductUid) return;
        if (groupId.startsWith('temp-group-')) {
            setVariantGroups(prev => prev.filter(g => g.id !== groupId));
            return;
        }
        setVariantActionInProgress({ type: 'delete-group', id: groupId });
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}/variant_groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.user.accessToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في حذف مجموعة المتغيرات');
            }
            setVariantGroups(prev => prev.filter(g => g.id !== groupId));
            errorHandler.success("تم حذف مجموعة المتغيرات", "نجح");
        } catch (err: any) {
            errorHandler.error("خطأ في حذف مجموعة المتغيرات: " + err.message, "خطأ");
        } finally {
            setVariantActionInProgress(null);
        }
    };

    const handleDeleteVariantChoice = async (groupId: string, choiceId: string) => {
        if (!session?.user?.accessToken || !ProductUid) return;
        if (choiceId.startsWith('temp-choice-')) {
            setVariantGroups(prevGroups => 
                prevGroups.map(group => {
                    if (group.id === groupId) {
                        return { ...group, choices: group.choices.filter(c => c.id !== choiceId) };
                    }
                    return group;
                })
            );
            return;
        }
        setVariantActionInProgress({ type: 'delete-choice', id: choiceId });
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${ProductUid}/variant_choices/${choiceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.user.accessToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في حذف خيار المتغير');
            }
            setVariantGroups(prevGroups => 
                prevGroups.map(group => {
                    if (group.id === groupId) {
                        return { ...group, choices: group.choices.filter(c => c.id !== choiceId) };
                    }
                    return group;
                })
            );
            errorHandler.success("تم حذف خيار المتغير", "نجح");
        } catch (err: any) {
            errorHandler.error("خطأ في حذف خيار المتغير: " + err.message, "خطأ");
        } finally {
            setVariantActionInProgress(null);
        }
    };

    const handleDeleteProduct = async () => {
        if (!session?.user?.accessToken || !product) return;
        setIsDeletingProduct(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.user.accessToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'فشل في حذف المنتج');
            }
            errorHandler.success("تم حذف المنتج بنجاح", "نجح");
            router.push('/admin_dashboard/products');
        } catch (err: any) {
            errorHandler.error("خطأ في حذف المنتج: " + err.message, "خطأ");
        } finally {
            setIsDeletingProduct(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground">جاري تحميل بيانات المنتج...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push('/auth/signin');
        return null;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">خطأ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 w-full"
                        >
                            إعادة المحاولة
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>المنتج غير موجود</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">لم يتم العثور على المنتج المطلوب.</p>
                        <Button 
                            onClick={() => router.push('/admin_dashboard/products')} 
                            className="mt-4 w-full"
                        >
                            العودة إلى قائمة المنتجات
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">تحرير المنتج</h1>
                <p className="text-muted-foreground mt-2">إدارة تفاصيل المنتج والصور والمتغيرات</p>
            </div>

            <Tabs defaultValue="info" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        معلومات المنتج
                    </TabsTrigger>
                    <TabsTrigger value="images" className="flex items-center gap-2">
                        <ImageUp className="h-4 w-4" />
                        الصور
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        المتغيرات
                    </TabsTrigger>
                    <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        منطقة الخطر
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader>
                            <CardTitle>معلومات المنتج</CardTitle>
                            <CardDescription>تحديث التفاصيل الأساسية للمنتج</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleFormSubmit}>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">عنوان المنتج *</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="أدخل عنوان المنتج"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">السعر *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice">سعر التكلفة</Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            step="0.01"
                                            value={costPrice}
                                            onChange={(e) => setCostPrice(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">المخزون</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <Switch
                                            id="active"
                                            checked={isActive}
                                            onCheckedChange={setIsActive}
                                        />
                                        <Label htmlFor="active">المنتج نشط</Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">الوصف</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="أدخل وصف المنتج"
                                        rows={4}
                                    />
                                </div>

                                {saveError && (
                                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                {saveSuccess && (
                                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        تم حفظ التغييرات بنجاح!
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        'حفظ التغييرات'
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="images">
                    <Card>
                        <CardHeader>
                            <CardTitle>إدارة الصور</CardTitle>
                            <CardDescription>رفع وإدارة صور المنتج</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">رفع صورة جديدة</h3>
                                <ImageUploadWithFit
                                    onImageSelected={handleImageUpload}
                                    accept="image/jpeg,image/png,image/webp"
                                    buttonText={
                                        <div className="flex items-center gap-2">
                                            <UploadCloud className="h-5 w-5" />
                                            <span>Upload Product Image</span>
                                        </div>
                                    }
                                    maxFileSizeMB={5}
                                    disabled={uploadingImage}
                                    aspect={1}
                                    frameWidth={600}
                                    frameHeight={600}
                                />
                                {uploadingImage && (
                                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        جاري رفع الصورة...
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-4">صور المنتج الحالية</h3>
                                {productImages.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ImageUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>لا توجد صور للمنتج حتى الآن</p>
                                        <p className="text-sm">استخدم النموذج أعلاه لرفع الصور</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {productImages.map((image) => (
                                            <div key={image.uid} className="relative group">
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                                                    <img
                                                        src={image.filename.startsWith('http')
                                                            ? `${image.filename}?v=${new Date().getTime()}`
                                                            : `${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${ProductUid}/${image.filename}?v=${new Date().getTime()}`
                                                        }
                                                        alt={`صورة المنتج ${image.uid}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = '/placeholder-product.png';
                                                        }}
                                                    />
                                                    {image.is_main && (
                                                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                                                            الصورة الرئيسية
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        onClick={() => handleSetMainImage(image.uid)}
                                                        disabled={settingMainImage === image.uid || image.is_main}
                                                        size="sm"
                                                        variant={image.is_main ? "default" : "outline"}
                                                        className={`flex-1 transition-all duration-200 ${
                                                            image.is_main 
                                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                                                                : 'border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 hover:text-green-800'
                                                        }`}
                                                    >
                                                        {settingMainImage === image.uid ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                                                جاري التعيين...
                                                            </>
                                                        ) : image.is_main ? (
                                                            <>
                                                                <Check className="h-3 w-3 ml-1" />
                                                                رئيسية
                                                            </>
                                                        ) : (
                                                            'تعيين كرئيسية'
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteImage(image.uid)}
                                                        disabled={deletingImage === image.uid}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 transition-all duration-200"
                                                    >
                                                        {deletingImage === image.uid ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="variants">
                    <Card>
                        <CardHeader>
                            <CardTitle>إدارة المتغيرات</CardTitle>
                            <CardDescription>إضافة وتحرير متغيرات المنتج مثل الحجم واللون</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">مجموعات المتغيرات</h3>
                                <div className="flex gap-2">
                                    <Button onClick={handleAddVariantGroup} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        إضافة مجموعة
                                    </Button>
                                    <Button 
                                        onClick={handleSaveVariants} 
                                        disabled={savingVariants}
                                        size="sm"
                                    >
                                        {savingVariants ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                جاري الحفظ...
                                            </>
                                        ) : (
                                            'حفظ المتغيرات'
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {variantGroups.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>لا توجد مجموعات متغيرات حتى الآن</p>
                                    <p className="text-sm">أضف مجموعة متغيرات لبدء إدارة خيارات المنتج</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-6">
                                        {variantGroups.map((group) => (
                                            <Card key={group.id} className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 mr-4">
                                                            <Label htmlFor={`group-name-${group.id}`}>اسم المجموعة</Label>
                                                            <Input
                                                                id={`group-name-${group.id}`}
                                                                value={group.name}
                                                                onChange={(e) => handleUpdateVariantGroupName(group.id, e.target.value)}
                                                                placeholder="مثل: الحجم، اللون، المادة"
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={() => handleDeleteVariantGroup(group.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={variantActionInProgress?.type === 'delete-group' && variantActionInProgress?.id === group.id}
                                                        >
                                                            {variantActionInProgress?.type === 'delete-group' && variantActionInProgress?.id === group.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label>الخيارات</Label>
                                                            <Button
                                                                onClick={() => handleAddVariantChoice(group.id)}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                إضافة خيار
                                                            </Button>
                                                        </div>
                                                        
                                                        {group.choices.map((choice) => (
                                                            <div key={choice.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                                                                <div>
                                                                    <Label htmlFor={`choice-value-${choice.id}`}>القيمة</Label>
                                                                    <Input
                                                                        id={`choice-value-${choice.id}`}
                                                                        value={choice.value}
                                                                        onChange={(e) => handleUpdateVariantChoice(group.id, choice.id, 'value', e.target.value)}
                                                                        placeholder="مثل: كبير، أحمر"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`choice-price-${choice.id}`}>السعر الإضافي</Label>
                                                                    <Input
                                                                        id={`choice-price-${choice.id}`}
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={choice.extra_price}
                                                                        onChange={(e) => handleUpdateVariantChoice(group.id, choice.id, 'extra_price', Number(e.target.value))}
                                                                        placeholder="0.00"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`choice-stock-${choice.id}`}>المخزون</Label>
                                                                    <Input
                                                                        id={`choice-stock-${choice.id}`}
                                                                        type="number"
                                                                        value={choice.stock}
                                                                        onChange={(e) => handleUpdateVariantChoice(group.id, choice.id, 'stock', Number(e.target.value))}
                                                                        placeholder="0"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div className="flex items-end">
                                                                    <Button
                                                                        onClick={() => handleDeleteVariantChoice(group.id, choice.id)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive w-full"
                                                                        disabled={variantActionInProgress?.type === 'delete-choice' && variantActionInProgress?.id === choice.id}
                                                                    >
                                                                        {variantActionInProgress?.type === 'delete-choice' && variantActionInProgress?.id === choice.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">منطقة الخطر</CardTitle>
                            <CardDescription>إجراءات لا يمكن التراجع عنها. تعامل بحذر.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-destructive mb-2">حذف المنتج</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        سيؤدي حذف هذا المنتج إلى إزالته نهائياً من النظام. لا يمكن التراجع عن هذا الإجراء.
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeletingProduct}>
                                                {isDeletingProduct ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        جاري الحذف...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        حذف المنتج
                                                    </>
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    سيتم حذف المنتج "{product.title}" نهائياً من النظام. 
                                                    لا يمكن التراجع عن هذا الإجراء.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleDeleteProduct}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    نعم، احذف المنتج
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}