"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Form, Input, InputNumber, Select, Steps, Card, message, Divider, Switch, Space, Typography, notification, Upload, List } from 'antd';
import { PlusOutlined, UploadOutlined, MinusCircleOutlined, DeleteOutlined, EyeOutlined, PictureOutlined } from '@ant-design/icons';
import ImageUploadWithFit from '@/components/ImageUploadWithFit';
import type { UploadFile, UploadProps } from 'antd';
import { ProductDetailModel, VariantGroup } from '@/types/product';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  cost_price: number;
  stock: number;
  is_active: boolean;
}

interface VariantChoiceFormData {
  value: string;
  extra_price?: number;
  is_active: boolean;
  stock: number;
}

interface VariantGroupFormData {
  name: string;
  choices: VariantChoiceFormData[];
}

const CreateProductPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productUid, setProductUid] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroupFormData[]>([]);
  
  // Fetch all categories when component mounts

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string, duration: number = type === 'error' ? 5 : 3) => {
    notification[type]({
      message,
      description,
      placement: 'topRight',
      duration,
    });
  };

  // Step 1: Create the base product
  const createProduct = async (values: ProductFormData) => {
    setLoading(true);
    try {
      // Check if user is authenticated
      if (status !== "authenticated" || !session?.user?.accessToken) {
        console.error('Authentication error:', { status, accessToken: session?.user?.accessToken ? 'exists' : 'missing' });
        showNotification('error', 'خطأ في المصادقة', 'يجب تسجيل الدخول لإنشاء منتج');
        return;
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/products`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify(values),
      });


      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create product: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // The product UID is in data.product.uid
      const productUidFromResponse = data.product?.uid;
      
      if (!productUidFromResponse) {
        throw new Error('No product UID found in response');
      }
      
      // Store the product UID in state
      setProductUid(productUidFromResponse);
      
      // Use a callback to ensure we're working with the latest state
      setTimeout(() => {}, 100);
      
      message.success('تم إنشاء المنتج بنجاح!');
      setCurrentStep(1);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('E11000')) {
          showNotification('error', 'خطأ', 'المنتج موجود بالفعل');
        } else if (error.message.includes('validation failed')) {
          showNotification('error', 'خطأ في التحقق', 'فشل التحقق من البيانات');
        } else {
          showNotification('error', 'خطأ', `فشل في إنشاء المنتج: ${error.message}`);
        }
      } else {
        message.error('حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload main image
  const uploadMainImage = async () => {
    if (!productUid || !mainImageFile) {
      showNotification('error', 'بيانات ناقصة', 'معرف المنتج أو الصورة الرئيسية غير موجود');
      return;
    }

    setLoading(true);
    
    try {
      // Validate the file
      if (!mainImageFile) {
        throw new Error('لم يتم تحديد ملف للرفع');
      }

      // Check if user is authenticated
      if (status !== "authenticated" || !session?.user?.accessToken) {
        console.error('Authentication error:', { status, accessToken: session?.user?.accessToken ? 'exists' : 'missing' });
        showNotification('error', 'خطأ في المصادقة', 'يجب تسجيل الدخول لرفع الصور');
        setLoading(false);
        return;
      }

      // Create a fresh FormData instance
      const formData = new FormData();
      
      // Append the file with the correct field name that FastAPI expects
      // The field name here must match what the backend expects (in this case 'file')
      formData.append('file', mainImageFile);
      
      // Log the form data for debugging
      console.log('FormData entries:', Array.from(formData.entries()));
      
      // Verify the product UID is valid
      if (!productUid || typeof productUid !== 'string' || productUid.trim() === '') {
        throw new Error('Invalid product UID: ' + JSON.stringify(productUid));
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productUid}/main_image`;
      
      
      // Don't set Content-Type header - let the browser set it with the correct boundary
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          // Note: We're intentionally NOT setting Content-Type
          // The browser will set it automatically with the correct boundary
        },
        body: formData,
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to upload main image: ${response.status} ${response.statusText}\n${responseText}`);
      }
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
  
      } catch (e) {
        console.warn('Failed to parse response as JSON:', e);
        responseData = {};
      }
      
      message.success('تم رفع الصورة الرئيسية بنجاح!');
      
      // Reset the main image file state after successful upload
      setMainImageFile(null);
      
      // Move to the next step
      setCurrentStep(2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      showNotification('error', 'فشل في رفع الصورة', `فشل في رفع الصورة الرئيسية: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Upload additional images (optional)
  const uploadAdditionalImages = async () => {
    if (!productUid || additionalImageFiles.length === 0) {
      // Skip this step if no additional images
      setCurrentStep(3);
      return;
    }

    setLoading(true);
    
    try {
      // Check if user is authenticated
      if (status !== "authenticated" || !session?.user?.accessToken) {
        console.error('Authentication error:', { status, accessToken: session?.user?.accessToken ? 'exists' : 'missing' });
        showNotification('error', 'خطأ في المصادقة', 'يجب تسجيل الدخول لرفع الصور');
        setLoading(false);
        return;
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productUid}/additional_images`;
      
      // Upload each file one by one
      for (const file of additionalImageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            // Don't set Content-Type header - let the browser set it with the correct boundary
          },
          body: formData,
        });
        
  
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`فشل في رفع الصور الإضافية: ${response.status} ${errorText}`);
        }
        
        const responseData = await response.json().catch(() => ({}));
  
      }
      
      message.success('تم رفع الصور الإضافية بنجاح!');
      
      // Reset the additional images state after successful upload
      setAdditionalImageFiles([]);
      
      // Move to the next step
      setCurrentStep(3);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      showNotification('error', 'فشل في رفع الصور', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create variant groups (optional)
  const createVariantGroups = async () => {
    if (!productUid) {
      showNotification('error', 'بيانات ناقصة', 'معرف المنتج غير موجود. الرجاء المحاولة مرة أخرى.');
      return;
    }
    
    if (variantGroups.length === 0) {
      // Skip this step if no variant groups
      finishProductCreation();
      return;
    }

    setLoading(true);
    try {
      // Check if user is authenticated
      if (status !== "authenticated" || !session?.user?.accessToken) {
        showNotification('error', 'خطأ في المصادقة', 'يجب تسجيل الدخول لإنشاء مجموعات المتغيرات');
        return;
      }
      
      // Prepare variant groups data for the request

      const requests = variantGroups.map((group, index) => {
        // Format the data to match the expected API structure
        const formattedGroup = {
          name: group.name,
          choices: group.choices.map(choice => ({
            value: choice.value,
            extra_price: Number(choice.extra_price) || 0,
            is_active: choice.is_active !== false, // Ensure boolean
            stock: Number(choice.stock) || 0 // Default stock value, can be updated by the user if needed
          }))
        };

        const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productUid}/variant_groups`;
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(formattedGroup)
        };

        return { url, options, group: formattedGroup, index };
      });

      const results = [];
      
      // Process requests one by one to better track errors
      for (const { url, options, group, index } of requests) {
        try {

          
          const response = await fetch(url, options);
          let data;
          let textResponse;
          
          try {
            textResponse = await response.text();
            data = textResponse ? JSON.parse(textResponse) : {};
          } catch (e) {

            data = { error: 'Invalid JSON in response', raw: textResponse };
          }
          
          if (!response.ok) {
            const errorDetails = {
              request: {
                url,
                method: 'POST',
                headers: options.headers,
                body: JSON.parse(options.body)
              },
              response: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: data
              }
            };

          }
          
          results.push({
            ok: response.ok,
            status: response.status,
            data,
            request: { url, body: options.body },
            responseText: textResponse
          });
          
        } catch (error) {
  
          
          results.push({
            ok: false,
            status: 0,
            data: { error: error instanceof Error ? error.message : 'Request failed' },
            request: { url, body: options.body },
            error: error instanceof Error ? error.stack : String(error)
          });
        }
      }

      const failedRequests = results.filter(res => !res.ok);
      
      if (failedRequests.length > 0) {
        const errorDetails = {
          count: failedRequests.length,
          total: results.length,
          requests: failedRequests.map((req, i) => ({
            requestNumber: i + 1,
            status: req.status,
            error: req.data,
            responseText: req.responseText,
            request: {
              url: req.request.url,
              body: req.request.body ? JSON.parse(req.request.body) : null
            },
            rawError: req.error
          }))
        };
        

        
        const errorMessages = failedRequests.map((res, i) => {
          const errorDetail = res.data?.detail || res.data?.error || res.responseText || 'Unknown error';
          return `Group ${i + 1}: ${res.status} - ${JSON.stringify(errorDetail)}`;
        });
        
        showNotification('error', 'خطأ', `فشل في إنشاء ${failedRequests.length} من مجموعات المتغيرات. الرجاء التحقق من وحدة التحكم لمزيد من التفاصيل.`);
      } else {
        showNotification('success', 'نجاح', 'تم إنشاء جميع مجموعات المتغيرات بنجاح!');
      }

      finishProductCreation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      showNotification('error', 'خطأ', `فشل في إنشاء مجموعات المتغيرات: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const finishProductCreation = () => {
    if (!productUid) {
      showNotification('error', 'بيانات ناقصة', 'معرف المنتج غير موجود. الرجاء المحاولة مرة أخرى.');
      return;
    }
    
    showNotification('success', 'نجاح', 'تم إنشاء المنتج بنجاح!');
    
    // Redirect after a short delay to allow the notification to be seen
    setTimeout(() => {
      router.push('/admin_dashboard/products');
    }, 2000);
    
    // In case the message doesn't close automatically, add a timeout
    setTimeout(() => {
      router.push('/admin_dashboard/products');
    }, 5000);
  };

  const validateImage = (file: File) => {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('فشل في تحميل الصورة'));
      };
      
      img.src = objectUrl;
    });
  };

  const handleMainImageSelected = async (file: File): Promise<boolean> => {
    try {
      // Validate file type
      if (!file.type || !file.type.startsWith('image/')) {
        showNotification('error', 'خطأ في الملف', 'الملف المرفوع ليس صورة');
        return false;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'حجم الملف كبير', 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
        return false;
      }
      
      // Check image dimensions
      const { width, height } = await validateImage(file);
      
      if (width < 800 || height < 800) {
        showNotification('warning', 'تنبيه', 'لأفضل جودة، يفضل استخدام صور بحجم 800×800 بكسل على الأقل', 5);
      }
      
      setMainImageFile(file);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الصورة';
      showNotification('error', 'خطأ في معالجة الصورة', errorMessage);
      return false;
    }
  };

  const removeMainImage = () => {
    setMainImageFile(null);
  };

  const handleAdditionalImageSelected = async (file: File): Promise<boolean> => {
    try {
      // Validate number of files
      if (additionalImageFiles.length >= 4) {
        throw new Error('يمكنك رفع 4 صور كحد أقصى');
      }
      
      // Validate file type
      if (!file.type || !file.type.startsWith('image/')) {
        throw new Error('أحد الملفات المرفوعة ليس صورة');
      }
      
      // Validate file size (5MB max per file)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم كل صورة يجب أن لا يتجاوز 5 ميجابايت');
      }
      
      // Check image dimensions
      const { width, height } = await validateImage(file);
      
      if (width < 800 || height < 800) {
        showNotification('warning', 'تنبيه', 'لأفضل جودة، يفضل استخدام صور بحجم 800×800 بكسل على الأقل', 5);
      }
      
      setAdditionalImageFiles([...additionalImageFiles, file]);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الصور';
      showNotification('error', 'خطأ في معالجة الصور', errorMessage);
      return false;
    }
  };

  const removeAdditionalImage = (index: number) => {
    const newFiles = [...additionalImageFiles];
    newFiles.splice(index, 1);
    setAdditionalImageFiles(newFiles);
  };

  const previewImage = (file: File) => {
    return URL.createObjectURL(file);
  };

  const addVariantGroup = () => {
    setVariantGroups([...variantGroups, { 
      name: '', 
      choices: [{ 
        value: '', 
        extra_price: 0, 
        is_active: true,
        stock: 0
      }] 
    }]);
  };

  const removeVariantGroup = (index: number) => {
    const updatedGroups = [...variantGroups];
    updatedGroups.splice(index, 1);
    setVariantGroups(updatedGroups);
  };

  const addVariantChoice = (groupIndex: number) => {
    const updatedGroups = [...variantGroups];
    updatedGroups[groupIndex].choices.push({ 
      value: '', 
      extra_price: 0, 
      is_active: true,
      stock: 0
    });
    setVariantGroups(updatedGroups);
  };

  const removeVariantChoice = (groupIndex: number, choiceIndex: number) => {
    const updatedGroups = [...variantGroups];
    updatedGroups[groupIndex].choices.splice(choiceIndex, 1);
    setVariantGroups(updatedGroups);
  };

  const updateVariantGroup = (groupIndex: number, field: string, value: any) => {
    const updatedGroups = [...variantGroups];
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], [field]: value };
    setVariantGroups(updatedGroups);
  };

  const updateVariantChoice = (groupIndex: number, choiceIndex: number, field: string, value: any) => {
    const updatedGroups = [...variantGroups];
    
    // Handle numeric fields
    let processedValue = value;
    if (field === 'stock' || field === 'extra_price') {
      // Convert to number, default to 0 if null/undefined/empty
      processedValue = value === null || value === undefined || value === '' ? 0 : Number(value);
    }
    
    updatedGroups[groupIndex].choices[choiceIndex] = { 
      ...updatedGroups[groupIndex].choices[choiceIndex], 
      [field]: processedValue
    };
    
    setVariantGroups(updatedGroups);
  };

  const steps = [
    {
      title: 'المعلومات الأساسية',
      content: (
        <Form
          form={form}
          layout="vertical"
          onFinish={createProduct}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="title"
            label="عنوان المنتج"
            rules={[{ required: true, message: 'الرجاء إدخال عنوان المنتج' }]}
          >
            <Input placeholder="أدخل عنوان المنتج" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="الوصف"
            rules={[{ required: true, message: 'الرجاء إدخال وصف المنتج' }]}
          >
            <TextArea rows={4} placeholder="أدخل وصف المنتج" />
          </Form.Item>
          
          
          <Form.Item
            name="price"
            label="السعر"
            rules={[{ required: true, message: 'الرجاء إدخال السعر' }]}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 60,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #d9d9d9',
                borderRight: 'none',
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                padding: '0 11px',
                fontSize: 14
              }}>
                JOD
              </div>
              <InputNumber
                min={0}
                step={0.01}
                style={{ flex: 1, borderRadius: '4px 0 0 4px' }}
                placeholder="أدخل السعر"
              />
            </div>
          </Form.Item>
          
          <Form.Item
            name="cost_price"
            label="سعر التكلفة (للإدارة فقط)"
            rules={[{ required: true, message: 'الرجاء إدخال سعر التكلفة' }]}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 60,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #d9d9d9',
                borderRight: 'none',
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                padding: '0 11px',
                fontSize: 14
              }}>
                JOD
              </div>
              <InputNumber
                min={0}
                step={0.01}
                style={{ flex: 1, borderRadius: '4px 0 0 4px' }}
                placeholder="أدخل سعر التكلفة"
              />
            </div>
          </Form.Item>
          
          <Form.Item
            name="stock"
            label="الكمية المتوفرة"
            rules={[{ required: true, message: 'الرجاء إدخال الكمية المتوفرة' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="أدخل الكمية المتوفرة"
            />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="حالة المنتج"
            valuePropName="checked"
          >
            <Switch checkedChildren="نشط" unCheckedChildren="غير نشط" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              إنشاء المنتج والمتابعة
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'الصورة الرئيسية',
      content: (
        <div>
          <Title level={4} style={{ textAlign: 'right' }}>رفع الصورة الرئيسية للمنتج</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginBottom: 24 }}>
            هذه هي الصورة الرئيسية التي سيتم عرضها لمنتجك
          </Text>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '24px',
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            minHeight: '400px',
            justifyContent: 'center'
          }}>
            {mainImageFile ? (
              <div style={{ 
                position: 'relative', 
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '100%',
                  backgroundColor: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <img
                    src={URL.createObjectURL(mainImageFile)}
                    alt="Main product preview"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '16px'
                    }}
                  />
                </div>
                <div style={{ 
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Button
                    type="default"
                    icon={<UploadOutlined />}
                    onClick={() => document.getElementById('main-image-upload')?.click()}
                  >
                    تغيير الصورة
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={removeMainImage}
                  >
                    حذف
                  </Button>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => window.open(URL.createObjectURL(mainImageFile), '_blank')}
                  >
                    معاينة
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PictureOutlined style={{ fontSize: '40px', color: '#999' }} />
                </div>
                <Title level={5} style={{ marginBottom: '8px' }}>اسحب الصورة هنا</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                  أو انقر لاختيار صورة
                </Text>
                <div style={{ textAlign: 'center' }}>
                  <ImageUploadWithFit
                    onImageSelected={handleMainImageSelected}
                    aspect={1}
                    buttonText={
                      <Button type="primary" icon={<UploadOutlined />}>
                        اختر صورة رئيسية
                      </Button>
                    }
                    id="main-image-upload"
                    maxFileSizeMB={5}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    الحجم الموصى به: 800×800 بكسل
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
                  يفضل أن تكون الصورة بحجم 800×800 بكثافة 72 نقطة في البوصة
                </div>
              </div>
            )}
          </div>
          
          <div style={{ 
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '12px'
          }}>
            <Button 
              type="primary" 
              onClick={uploadMainImage} 
              disabled={!mainImageFile} 
              loading={loading}
              size="large"
              style={{ minWidth: '120px' }}
            >
              حفظ والمتابعة
            </Button>
            {mainImageFile && (
              <Button 
                onClick={removeMainImage}
                danger
                size="large"
              >
                إزالة الصورة
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'صور إضافية',
      content: (
        <div>
          <Title level={4} style={{ textAlign: 'right' }}>رفع صور إضافية للمنتج (اختياري)</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginBottom: 24 }}>
            يمكنك رفع ما يصل إلى 4 صور إضافية للمنتج
          </Text>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Upload Area */}
            {additionalImageFiles.length < 4 && (
              <div 
                className="upload-area"
                style={{ 
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#fafafa',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PlusOutlined style={{ fontSize: '24px', color: '#999' }} />
                </div>
                <Title level={5} style={{ marginBottom: '8px' }}>اسحب الصور هنا</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                  أو انقر لاختيار الصور
                </Text>
                <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                  <ImageUploadWithFit
                    onImageSelected={handleAdditionalImageSelected}
                    aspect={1}
                    buttonText={
                      <Button 
                        type="primary" 
                        icon={<UploadOutlined />}
                        disabled={additionalImageFiles.length >= 4}
                      >
                        إضافة صور
                      </Button>
                    }
                    disabled={additionalImageFiles.length >= 4}
                    id="additional-images-upload"
                    maxFileSizeMB={5}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    الحجم الموصى به: 800×800 بكسل
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  يمكنك تحميل {4 - additionalImageFiles.length} صور إضافية
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  يفضل أن تكون الصور بحجم 800×800 بكثافة 72 نقطة في البوصة
                </Text>
              </div>
            )}
            
            {/* Image Grid */}
            {additionalImageFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Title level={5} style={{ marginBottom: '16px', textAlign: 'right' }}>
                  الصور المرفوعة ({additionalImageFiles.length}/4)
                </Title>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '16px'
                }}>
                  {additionalImageFiles.map((file, index) => (
                    <div key={index} style={{ 
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      backgroundColor: '#fff',
                      aspectRatio: '1',
                      padding: '8px'
                    }}>
                      <div style={{ 
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#fafafa',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <img
                          alt={`Additional ${index + 1}`}
                          src={URL.createObjectURL(file)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '8px'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          right: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}>
                          <span>صورة {index + 1}</span>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined style={{ color: '#fff' }} />}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAdditionalImage(index);
                            }}
                            style={{ height: 'auto', padding: '0 4px' }}
                          />
                        </div>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '4px',
                            height: '28px',
                            width: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ 
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '12px'
          }}>
            <Button 
              type="primary" 
              onClick={uploadAdditionalImages} 
              disabled={additionalImageFiles.length === 0}
              loading={loading}
              size="large"
              style={{ minWidth: '120px' }}
            >
              {additionalImageFiles.length > 0 ? 'حفظ الصور والمتابعة' : 'تخطي'}
            </Button>
            {additionalImageFiles.length > 0 && (
              <Button 
                onClick={() => setAdditionalImageFiles([])}
                danger
                size="large"
              >
                إزالة الكل
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'المتغيرات',
      content: (
        <div>
          <Title level={4}>إضافة متغيرات للمنتج (اختياري)</Title>
          <Text type="secondary">يمكنك إضافة متغيرات للمنتج مثل الألوان والمقاسات</Text>
          
          {variantGroups.map((group, groupIndex) => (
            <Card 
              key={groupIndex} 
              title={`مجموعة متغيرات ${groupIndex + 1}`}
              style={{ marginTop: 16 }}
              extra={
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => removeVariantGroup(groupIndex)}
                  disabled={variantGroups.length <= 1}
                />
              }
            >
              <Form.Item
                label="اسم المجموعة"
                required
              >
                <Input 
                  placeholder="مثال: اللون، المقاس" 
                  value={group.name}
                  onChange={(e) => updateVariantGroup(groupIndex, 'name', e.target.value)}
                />
              </Form.Item>
              
              <Divider orientation="right">الخيارات</Divider>
              
              {group.choices.map((choice, choiceIndex) => (
                <div key={choiceIndex} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 24,
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8
                }}>
                  <div style={{ flex: '2 1 0%', width: '100%' }}>
                    <Input 
                      placeholder="قيمة الخيار (مثال: صغير، أحمر)" 
                      value={choice.value}
                      onChange={(e) => updateVariantChoice(groupIndex, choiceIndex, 'value', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ flex: '1.5 1 0%', width: '100%', display: 'flex' }}>
                    <div style={{ 
                      width: '100%',
                      display: 'flex'
                    }}>
                      <div style={{
                        width: 60,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRight: 'none',
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                        padding: '0 11px',
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        JOD
                      </div>
                      <InputNumber 
                        placeholder="سعر إضافي" 
                        value={choice.extra_price}
                        onChange={(value) => updateVariantChoice(groupIndex, choiceIndex, 'extra_price', value)}
                        style={{ flex: 1, borderRadius: '4px 0 0 4px' }}
                        min={0}
                      />
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ flex: 1 }}>
                      <InputNumber 
                        placeholder="الكمية المتوفرة"
                        value={choice.stock}
                        onChange={(value) => updateVariantChoice(groupIndex, choiceIndex, 'stock', value)}
                        min={0}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ marginLeft: 16, display: 'flex', gap: 8 }}>
                      <Switch 
                        checkedChildren="نشط" 
                        unCheckedChildren="غير نشط" 
                        checked={choice.is_active}
                        onChange={(checked) => updateVariantChoice(groupIndex, choiceIndex, 'is_active', checked)}
                      />
                      <Button 
                        danger 
                        icon={<MinusCircleOutlined />} 
                        onClick={() => removeVariantChoice(groupIndex, choiceIndex)}
                        disabled={group.choices.length <= 1}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                type="dashed" 
                onClick={() => addVariantChoice(groupIndex)}
                block
                icon={<PlusOutlined />}
              >
                إضافة خيار
              </Button>
            </Card>
          ))}
          
          <Button 
            type="dashed" 
            onClick={addVariantGroup}
            style={{ marginTop: 16 }}
            block
            icon={<PlusOutlined />}
          >
            إضافة مجموعة متغيرات
          </Button>
          
          <div style={{ marginTop: 20, display: 'flex', gap: '8px' }}>
            {variantGroups.length > 0 && (
              <Button 
                type="primary" 
                onClick={createVariantGroups} 
                loading={loading}
              >
                حفظ المتغيرات والانتهاء
              </Button>
            )}
            <Button 
              type={variantGroups.length > 0 ? 'default' : 'primary'}
              onClick={finishProductCreation}
              loading={loading}
            >
              {variantGroups.length > 0 ? 'تخطي' : 'إنهاء'}
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'right' }}>إنشاء منتج جديد</Title>
        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
          items={steps.map(item => ({ title: item.title }))}
        />
        <div>{steps[currentStep].content}</div>
        
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          {currentStep > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => setCurrentStep(currentStep - 1)}>
              السابق
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={() => {
              if (currentStep === 0) {
                form.submit();
              } else if (currentStep === 1) {
                uploadMainImage();
              } else if (currentStep === 2) {
                uploadAdditionalImages();
              } else if (currentStep === 3) {
                // Don't automatically create variants, let the user choose
                finishProductCreation();
              }
            }} loading={loading}>
              {currentStep === steps.length - 1 ? 'إنهاء' : 'التالي'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateProductPage;