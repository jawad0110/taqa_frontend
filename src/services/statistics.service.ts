import axios, { AxiosResponse, AxiosError } from 'axios';

// Define interfaces for the API responses
interface StorageStatsResponse {
  application: {
    total_images: number;
    total_storage_mb: number;
    average_size_kb: number;
    storage_path: string;
  };
  system: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    use_percentage: number;
    disks: Array<{
      filesystem: string;
      size: string;
      used: string;
      available: string;
      use_percentage: string;
      mounted_on: string;
    }>;
  };
}

interface SalesDataResponse {
  total_revenue: number;
  yearly_sales: Array<{ month: number; revenue: number }>;
  monthly_sales: Array<{ day: number; revenue: number }>;
  weekly_sales: Array<{ day_of_week: string; revenue: number }>;
  top_selling_products: Array<{ 
    id: string; 
    name: string; 
    price: number; 
    stock: number; 
    is_active: boolean; 
    sales: number; 
  }>;
}

interface OverviewDataResponse {
  total_products: number;
  total_orders: number;
  total_users: number;
  average_price: number;
  low_stock_count: number;
  total_storage_mb: number;
  total_earnings: number;
  total_revenue: number;
  total_costs: number;
  total_delivery_fees: number;
  total_discounts: number;
}

interface AlertsDataResponse {
  missing_main_image: Array<{ name: string; id: string }>;
  out_of_stock: Array<{ 
    id: string; 
    title: string; 
    stock: number; 
    has_variants: boolean 
  }>;
}

// New financial metrics interfaces
interface FinancialMetricPoint {
  period: string;
  date: string;
  total_earnings: number;
  total_revenue: number;
  total_costs: number;
  delivery_fees: number;
  discounts: number;
  orders_count: number;
}

interface FinancialMetricsResponse {
  metrics: FinancialMetricPoint[];
  time_filter: 'week' | 'month' | 'year' | 'custom';
  summary: {
    total_earnings: number;
    total_revenue: number;
    total_costs: number;
    total_delivery_fees: number;
    total_discounts: number;
    profit_margin: number;
  };
  period_info: {
    start_date: string;
    end_date: string;
    period_name: string;
    total_days: number;
  };
}

export interface StorageBreakdown {
  type: string;
  size: string;
  percentage: number;
}

export interface StatisticsData {
  totalSales: number;
  salesChange: number;
  monthlySales: { month: string; revenue: number }[];
  topSellingProducts: { 
    id: string; 
    name: string; 
    price: number; 
    stock: number; 
    is_active: boolean; 
    sales: number; 
  }[];
  revenueByCategory?: { category: string; revenue: number }[];
  pendingAlerts: number;
  outOfStockProducts: { 
    id: string; 
    title: string; 
    stock: number; 
    has_variants: boolean 
  }[];
  missingImagesProducts: { name: string; id: string }[];
  storageUsed: string;
  storageChange: number;
  storageBreakdown: StorageBreakdown[];
  systemStorage: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usePercentage: number;
    disks: Array<{
      filesystem: string;
      size: string;
      used: string;
      available: string;
      usePercentage: string;
      mountedOn: string;
    }>;
  } | null;
  newUsers: number;
  activeUsers: number;
  userGrowth: number;
  // Earnings data
  totalEarnings: number;
  totalRevenue: number;
  totalCosts: number;
  totalDeliveryFees: number;
  totalDiscounts: number;
  profitMargin: number;
  // New financial metrics data
  financialMetrics?: FinancialMetricsResponse;
}

// Helper function to create a safe axios request with timeout
const safeAxiosGet = async <T>(url: string, headers: any, timeout = 5000): Promise<T> => {
  try {
    const response = await axios.get<T>(url, { 
      headers,
      timeout,
      validateStatus: () => true // Don't throw on HTTP error status codes
    });
    return response.data;
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
};

export const getStatistics = async (token: string, timePeriod: 'week' | 'month' | 'year' | 'all' = 'year'): Promise<StatisticsData> => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Default fallback data
  const defaultStats: StatisticsData = {
    totalSales: 0,
    salesChange: 0,
    monthlySales: [],
    topSellingProducts: [],
    revenueByCategory: [],
    pendingAlerts: 0,
    outOfStockProducts: [],
    missingImagesProducts: [],
    storageUsed: '0%',
    storageChange: 0,
    storageBreakdown: [],
    systemStorage: null,
    newUsers: 0,
    activeUsers: 0,
    userGrowth: 0,
    totalEarnings: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalDeliveryFees: 0,
    totalDiscounts: 0,
    profitMargin: 0
  };

  try {
    // Make parallel requests to available endpoints with proper typing
    const [salesRes, alertsRes, storageRes, overviewRes] = await Promise.allSettled([
      safeAxiosGet<SalesDataResponse>(`${baseUrl}/admin/sales-analytics/sales`, headers).catch((): SalesDataResponse => ({
        total_revenue: 0,
        yearly_sales: [],
        monthly_sales: [],
        weekly_sales: [],
        top_selling_products: [],
      })),
      
      safeAxiosGet<AlertsDataResponse>(`${baseUrl}/admin/recent-products-alerts/alerts`, headers).catch((): AlertsDataResponse => ({
        missing_main_image: [],
        out_of_stock: []
      })),
      
      safeAxiosGet<StorageStatsResponse>(`${baseUrl}/admin/storage-usage/storage`, headers).catch((): StorageStatsResponse | null => null),
      
      safeAxiosGet<OverviewDataResponse>(`${baseUrl}/admin/overview/overview`, headers).catch((): OverviewDataResponse => ({
        total_products: 0,
        total_orders: 0,
        total_users: 0,
        average_price: 0,
        low_stock_count: 0,
        total_storage_mb: 0,
        total_earnings: 0,
        total_revenue: 0,
        total_costs: 0,
        total_delivery_fees: 0,
        total_discounts: 0
      }))
    ]);

    // Process sales data with type assertions
    const salesData = salesRes.status === 'fulfilled' ? salesRes.value : {
      total_revenue: 0,
      yearly_sales: [],
      monthly_sales: [],
      weekly_sales: [],
      top_selling_products: [],
    } as SalesDataResponse;

    // Process alerts data with type assertions
    const alertsData = alertsRes.status === 'fulfilled' ? alertsRes.value : {
      missing_main_image: [],
      out_of_stock: []
    };

    // Helper function to get Arabic month names
    const getArabicMonthName = (monthNumber: number): string => {
      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return months[monthNumber - 1] || 'غير محدد';
    };

    // Helper function to get Arabic day names
    const getArabicDayName = (dayOfWeek: string): string => {
      const days: { [key: string]: string } = {
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت',
        'Sunday': 'الأحد'
      };
      return days[dayOfWeek] || dayOfWeek;
    };

    // Process sales data based on time period
    let processedSalesData: { month: string; revenue: number }[] = [];
    
    switch (timePeriod) {
      case 'week':
        processedSalesData = (salesData.weekly_sales || []).map(item => ({
          month: getArabicDayName(item.day_of_week),
          revenue: item.revenue || 0
        }));
        break;
      case 'month':
        processedSalesData = (salesData.monthly_sales || []).map(item => ({
          month: `${item.day} ${getArabicMonthName(new Date().getMonth() + 1)}`,
          revenue: item.revenue || 0
        }));
        break;
      case 'year':
        processedSalesData = (salesData.yearly_sales || []).map(item => ({
          month: getArabicMonthName(item.month),
          revenue: item.revenue || 0
        }));
        break;
      case 'all':
        // For 'all', show yearly data but with more comprehensive range
        processedSalesData = (salesData.yearly_sales || []).map(item => ({
          month: getArabicMonthName(item.month),
          revenue: item.revenue || 0
        }));
        break;
      default:
        processedSalesData = (salesData.yearly_sales || []).map(item => ({
          month: getArabicMonthName(item.month),
          revenue: item.revenue || 0
        }));
    }

  

    // Process storage data with type assertion
    const storageData = storageRes.status === 'fulfilled' ? storageRes.value : null;

    // Process overview data with type assertion
    const overviewData = overviewRes.status === 'fulfilled' ? overviewRes.value : {
      total_products: 0,
      total_orders: 0,
      total_users: 0,
      average_price: 0,
      low_stock_count: 0,
      total_storage_mb: 0,
      total_earnings: 0,
      total_revenue: 0,
      total_costs: 0,
      total_delivery_fees: 0,
      total_discounts: 0
    };

    // Format storage breakdown
    const storageBreakdown: StorageBreakdown[] = [];
    
    // Add system disks to breakdown if storage data exists
    if (storageData?.system?.disks) {
      storageData.system.disks.forEach((disk) => {
        storageBreakdown.push({
          type: disk.mounted_on || disk.filesystem,
          size: disk.size,
          percentage: parseFloat(disk.use_percentage) || 0
        });
      });
    }

    // Add application storage to breakdown if storage data exists
    if (storageData?.application) {
      storageBreakdown.push({
        type: 'Application Images',
        size: `${storageData.application.total_storage_mb?.toFixed(2) || 0} MB`,
        percentage: storageData.application.total_storage_mb > 0 ? 
          Math.min(100, (storageData.application.total_storage_mb / 1024) * 10) : 0
      });
    }

    // Calculate storage used percentage
    const storageUsed = storageData?.system?.use_percentage !== undefined 
      ? `${storageData.system.use_percentage.toFixed(1)}%` 
      : '0%';

    // Calculate storage change (placeholder - use actual comparison logic in production)
    const storageChange = 0; // Replace with actual comparison logic

    // Use processed sales data based on time period
    const monthlySales = processedSalesData;

    // Calculate profit margin
    const profitMargin = overviewData.total_revenue > 0 
      ? (overviewData.total_earnings / overviewData.total_revenue) * 100 
      : 0;

    return {
      totalSales: salesData.total_revenue || 0,
      salesChange: calculatePercentageChange(monthlySales || []),
      monthlySales,
      topSellingProducts: salesData.top_selling_products || [],
      pendingAlerts: (alertsData.out_of_stock || []).length,
      outOfStockProducts: alertsData.out_of_stock || [],
      missingImagesProducts: alertsData.missing_main_image || [],
      storageUsed,
      storageChange,
      storageBreakdown,
      systemStorage: storageData?.system ? {
        totalGB: storageData.system.total_gb || 0,
        usedGB: storageData.system.used_gb || 0,
        freeGB: storageData.system.free_gb || 0,
        usePercentage: storageData.system.use_percentage || 0,
        disks: storageData.system.disks?.map(d => ({
          filesystem: d.filesystem,
          size: d.size,
          used: d.used,
          available: d.available,
          usePercentage: d.use_percentage,
          mountedOn: d.mounted_on
        })) || []
      } : null,
      newUsers: 0, // Replace with actual data when available
      activeUsers: 0, // Replace with actual data when available
      userGrowth: 0, // Replace with actual data when available
      // Earnings data
      totalEarnings: overviewData.total_earnings || 0,
      totalRevenue: overviewData.total_revenue || 0,
      totalCosts: overviewData.total_costs || 0,
      totalDeliveryFees: overviewData.total_delivery_fees || 0,
      totalDiscounts: overviewData.total_discounts || 0,
      profitMargin: profitMargin
    };
  } catch (error) {
    console.error('Error in getStatistics:', error);
    return defaultStats;
  }
};

// Helper function to calculate percentage change
const calculatePercentageChange = (monthlySales: { revenue: number }[]): number => {
  if (!monthlySales || monthlySales.length < 2) return 0;
  
  const currentMonth = monthlySales[monthlySales.length - 1]?.revenue || 0;
  const previousMonth = monthlySales[monthlySales.length - 2]?.revenue || 0;
  
  if (previousMonth === 0) return 0;
  return ((currentMonth - previousMonth) / previousMonth) * 100;
};

function formatMonthLabel(monthNumber: number): string {
  const date = new Date();
  date.setMonth((monthNumber - 1 + 12) % 12);
  return date.toLocaleString('ar', { month: 'short' });
}

// New function to get financial metrics with time filtering
export const getFinancialMetrics = async (
  token: string, 
  timeFilter: 'week' | 'month' | 'year' | 'custom' = 'year',
  selectedDate?: string,
  fromDate?: string,
  toDate?: string
): Promise<FinancialMetricsResponse> => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const params = new URLSearchParams({
      time_filter: timeFilter
    });

    if (selectedDate) {
      params.append('selected_date', selectedDate);
    }

    if (fromDate && toDate) {
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
    }

    const response = await axios.get<FinancialMetricsResponse>(
      `${baseUrl}/admin/earnings-analytics/financial-metrics?${params.toString()}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    // Return default empty data
    return {
      metrics: [],
      time_filter: timeFilter,
      summary: {
        total_earnings: 0,
        total_revenue: 0,
        total_costs: 0,
        total_delivery_fees: 0,
        total_discounts: 0,
        profit_margin: 0
      },
      period_info: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        period_name: 'No Data',
        total_days: 0
      }
    };
  }
};
