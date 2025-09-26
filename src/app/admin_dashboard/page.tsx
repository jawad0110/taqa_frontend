﻿'use client';
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Spin, 
  Alert, 
  Table, 
  Tag, 
  Progress, 
  Space, 
  Divider,
  Badge,
  Tabs,
  Button,
  Modal,
  message,
  Select,
  Tooltip,
  Switch
} from 'antd';
import { 
  ShoppingCartOutlined, 
  AlertOutlined, 
  DatabaseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
  UserOutlined,
  ShopOutlined,
  FileImageOutlined,
  BarChartOutlined,
  LineChartOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  WarningOutlined,
  DingdingOutlined,
  DollarOutlined,
  TruckOutlined,
  PercentageOutlined,
  InfoCircleOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { errorHandler } from '@/lib/error-handler';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner';
import { AdminErrorDisplay } from '@/components/admin/AdminErrorDisplay';
import { getStatistics, getFinancialMetrics, type StatisticsData } from '@/services/statistics.service';

// Define interfaces for type safety
interface StorageBreakdownItem {
  type: string;
  size: string;
  percentage: number;
}

interface MonthlySale {
  month: string;
  revenue: number;
  orders?: number;
}

interface TopSellingProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  sales: number;
  is_active: boolean;
  created_at?: string;
}

interface OutOfStockProduct {
  id: string;
  title: string;
  stock: number;
  has_variants: boolean;
}

interface MissingImageProduct {
  id: string;
  name: string;
}

// Dynamically import charts with no SSR
const LineChart = dynamic(
  () => import('@ant-design/plots').then((mod) => mod.Line),
  { ssr: false }
);

import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

// Enhanced color constants
const BRAND_COLORS = {
  primary: '#070B39',
  success: '#22C55E', 
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    600: '#475569',
    700: '#334155',
    900: '#0F172A'
  }
};

// Legacy constants for compatibility
const BRAND_PRIMARY = BRAND_COLORS.primary;
const BRAND_SUCCESS = BRAND_COLORS.success;
const BRAND_WARNING = BRAND_COLORS.warning;
const BRAND_ERROR = BRAND_COLORS.error;
const NEUTRAL_BORDER = '#e5e7eb';
const NEUTRAL_BG = '#f8fafc';
const CHART_GRID = '#f1f5f9';
const CHART_AXIS = '#64748b';

interface OutOfStockTableItem {
  key: string;
  id: string;
  title: string;
  stock: number;
  has_variants: boolean;
}

const StatisticCard = ({ 
  title, 
  value, 
  icon, 
  color,
  suffix,
  prefix,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  loading?: boolean;
}) => (
  <Card className="h-full border border-gray-100 shadow-sm">
    <Statistic
      title={title}
      value={value}
      valueStyle={{ color: color || BRAND_PRIMARY }}
      prefix={icon}
      suffix={suffix}
      loading={loading}
    />
    {prefix}
  </Card>
);

// Enhanced Financial Analysis Component
interface EnhancedFinancialAnalysisProps {
  financialMetrics: any;
  financialMetricsLoading: boolean;
  timePeriod: 'month' | 'week' | 'year' | 'all';
  setTimePeriod: (value: 'month' | 'week' | 'year' | 'all') => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  customFromDate: string;
  setCustomFromDate: (value: string) => void;
  customToDate: string;
  setCustomToDate: (value: string) => void;
  fetchFinancialMetrics: () => void;
  fetchStatistics: () => void;
}

const EnhancedFinancialAnalysis: React.FC<EnhancedFinancialAnalysisProps> = ({ 
  financialMetrics, 
  financialMetricsLoading, 
  timePeriod, 
  setTimePeriod,
  selectedDate,
  setSelectedDate,
  customFromDate,
  setCustomFromDate,
  customToDate,
  setCustomToDate,
  fetchFinancialMetrics,
  fetchStatistics 
}) => {
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Enhanced metric configuration
  const metricsConfig = [
    { 
      name: 'إجمالي الأرباح', 
      field: 'total_earnings', 
      color: BRAND_COLORS.success, 
      icon: '💰',
      description: 'صافي الأرباح بعد خصم التكاليف'
    },
    { 
      name: 'إجمالي الإيرادات', 
      field: 'total_revenue', 
      color: BRAND_COLORS.blue, 
      icon: '📈',
      description: 'إجمالي المبيعات قبل التكاليف'
    },
    { 
      name: 'إجمالي التكاليف', 
      field: 'total_costs', 
      color: BRAND_COLORS.warning, 
      icon: '💸',
      description: 'تكلفة المنتجات والعمليات'
    },
    { 
      name: 'رسوم التوصيل', 
      field: 'delivery_fees', 
      color: BRAND_COLORS.purple, 
      icon: '🚚',
      description: 'رسوم الشحن والتوصيل'
    }
  ];

  const toggleMetric = (metricName: string) => {
    const newHiddenMetrics = new Set(hiddenMetrics);
    if (newHiddenMetrics.has(metricName)) {
      newHiddenMetrics.delete(metricName);
    } else {
      newHiddenMetrics.add(metricName);
    }
    setHiddenMetrics(newHiddenMetrics);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <WarningOutlined style={{ color: BRAND_COLORS.success }} /> : 
      <DingdingOutlined style={{ color: BRAND_COLORS.error }} />;
  };

  // Transform chart data
  const financialChartData = (() => {
    if (!financialMetrics || !financialMetrics.metrics || financialMetrics.metrics.length === 0) {
      // Generate appropriate empty data based on time period
      switch (timePeriod) {
        case 'week':
          return [
            { period: 'الأحد', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'الاثنين', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'الثلاثاء', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'الأربعاء', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'الخميس', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'الجمعة', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'السبت', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 }
          ];
        case 'month':
          const currentDate = new Date();
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          return Array.from({ length: Math.min(daysInMonth, 31) }, (_, i) => ({
            period: `${i + 1}`,
            total_earnings: 0,
            total_revenue: 0,
            total_costs: 0,
            delivery_fees: 0
          }));
        case 'year':
        case 'all':
        default:
          return [
            { period: 'كانون الثاني', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'شباط', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'آذار', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'نيسان', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'أيار', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'حزيران', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'تموز', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'آب', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'أيلول', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'تشرين الأول', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'تشرين الثاني', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 },
            { period: 'كانون الأول', total_earnings: 0, total_revenue: 0, total_costs: 0, delivery_fees: 0 }
          ];
      }
    }
    
    return financialMetrics.metrics.map((item: any) => ({
      period: item.period,
      total_earnings: item.total_earnings || 0,
      total_revenue: item.total_revenue || 0,
      total_costs: item.total_costs || 0,
      delivery_fees: item.delivery_fees || 0,
      date: item.date
    }));
  })();

  // Transform data for multi-line chart
  const multiLineChartData = (() => {
    const transformedData: any[] = [];
    
    financialChartData.forEach((item: any) => {
      metricsConfig.forEach((metric) => {
        if (!hiddenMetrics.has(metric.name)) {
          const value = item[metric.field] || 0;
          transformedData.push({
            period: item.period,
            value: value,
            metric: metric.name,
            date: item.date,
            color: metric.color
          });
        }
      });
    });
    
    return transformedData;
  })();

  // Enhanced Summary Cards
  const renderSummaryCards = () => (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card className="h-full bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <span className="text-sm font-medium text-gray-600">إجمالي الأرباح</span>
                <WarningOutlined style={{ color: BRAND_COLORS.success }} />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                JOD {(financialMetrics?.summary?.total_earnings || 0).toLocaleString('en-US')}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  count={`${(financialMetrics?.summary?.profit_margin || 0).toFixed(1)}%`} 
                  style={{ backgroundColor: BRAND_COLORS.success }}
                />
                <span className="text-xs text-gray-500">هامش الربح</span>
              </div>
            </div>
            <Progress 
              type="circle" 
              percent={financialMetrics?.summary?.profit_margin || 0} 
              size={60}
              strokeColor={BRAND_COLORS.success}
              format={() => `${(financialMetrics?.summary?.profit_margin || 0).toFixed(0)}%`}
            />
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📈</span>
                <span className="text-sm font-medium text-gray-600">إجمالي الإيرادات</span>
                <WarningOutlined style={{ color: BRAND_COLORS.blue }} />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                JOD {(financialMetrics?.summary?.total_revenue || 0).toLocaleString('en-US')}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  count={financialMetrics?.summary?.orders_count || 0} 
                  style={{ backgroundColor: BRAND_COLORS.blue }}
                />
                <span className="text-xs text-gray-500">عدد الطلبات</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-semibold">
                +{(financialMetrics?.summary?.growth_rate || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">معدل النمو</div>
            </div>
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card className="h-full bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💸</span>
                <span className="text-sm font-medium text-gray-600">إجمالي التكاليف</span>
                <DingdingOutlined style={{ color: BRAND_COLORS.success }} />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                JOD {(financialMetrics?.summary?.total_costs || 0).toLocaleString('en-US')}
              </div>
              <div className="text-xs text-gray-500">
                {financialMetrics?.summary?.total_revenue ? 
                  ((financialMetrics.summary.total_costs / financialMetrics.summary.total_revenue) * 100).toFixed(1) : 0
                }% من الإيرادات
              </div>
            </div>
            <Progress 
              type="circle" 
              percent={financialMetrics?.summary?.total_revenue ? 
                (financialMetrics.summary.total_costs / financialMetrics.summary.total_revenue) * 100 : 0
              } 
              size={60}
              strokeColor={BRAND_COLORS.warning}
              format={(percent) => `${percent?.toFixed(0) || 0}%`}
            />
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card className="h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚚</span>
                <span className="text-sm font-medium text-gray-600">رسوم التوصيل</span>
                <WarningOutlined style={{ color: BRAND_COLORS.purple }} />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                JOD {(financialMetrics?.summary?.total_delivery_fees || 0).toLocaleString('en-US')}
              </div>
              <div className="text-xs text-gray-500">
                متوسط {financialMetrics?.summary?.orders_count ? 
                  (financialMetrics.summary.total_delivery_fees / financialMetrics.summary.orders_count).toFixed(2) : 
                  '0.00'
                } لكل طلب
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TruckOutlined className="text-purple-600 text-lg" />
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  // Multi-line chart configuration
  const multiLineChartConfig = {
    data: multiLineChartData,
    xField: 'period',
    yField: 'value',
    seriesField: 'metric',
    height: 380,
    autoFit: true,
    
    color: (datum: any) => {
      const metricColors: Record<string, string> = {
        'إجمالي الأرباح': BRAND_COLORS.success,
        'إجمالي الإيرادات': BRAND_COLORS.blue,
        'إجمالي التكاليف': BRAND_COLORS.warning,
        'رسوم التوصيل': BRAND_COLORS.purple
      };
      return metricColors[datum.metric] || BRAND_COLORS.success;
    },
    
    line: {
      style: {
        strokeWidth: 4,
        strokeOpacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      },
    },
    
    point: {
      size: 8,
      shape: 'circle',
      style: {
        strokeWidth: 2,
        stroke: '#ffffff',
        fillOpacity: 1,
      },
    },
    smooth: true,
    
    padding: [60, 30, 80, 120],
    xAxis: {
      title: {
        text: timePeriod === 'week' ? 'أيام الأسبوع' : timePeriod === 'month' ? 'أيام الشهر' : 'الفترة الزمنية',
        style: { 
          fontSize: 14,
          fontWeight: 600,
          fill: CHART_AXIS,
        },
        offset: 30,
      },
      label: {
        style: {
          fill: CHART_AXIS,
          fontSize: 12,
          fontWeight: 500,
        },
      },
    },
    yAxis: {
      title: {
        text: 'القيمة (دينار أردني)',
        style: { 
          fontSize: 14,
          fontWeight: 600,
          fill: CHART_AXIS,
        },
        offset: 60,
      },
      label: {
        formatter: (v: string) => {
          const value = parseFloat(v);
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
          }
          return `${value.toFixed(0)}`;
        },
      },
    },
    tooltip: {
      showTitle: true,
      title: (data: any) => {
        const displayDate = data.date || data.period;
        return `📅 ${displayDate}`;
      },
      formatter: (data: any) => {
        const value = typeof data.value === 'number' && !isNaN(data.value) ? data.value : 0;
        const metricName = data.metric || 'غير محدد';
        
        const metricIcons: Record<string, string> = {
          'إجمالي الأرباح': '💰',
          'إجمالي الإيرادات': '📈',
          'إجمالي التكاليف': '💸',
          'رسوم التوصيل': '🚚'
        };
        
        const icon = metricIcons[metricName] || '📊';
        
        return {
          name: `${icon} ${metricName}`,
          value: `${value.toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'JOD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}`,
        };
      },
      showCrosshairs: true,
      crosshairs: {
        type: 'xy',
        line: {
          style: {
            stroke: BRAND_PRIMARY,
            strokeWidth: 1,
            lineDash: [3, 3],
            opacity: 0.7,
          },
        },
      },
    },
    legend: false,
  };

  // Custom Legend Component
  const renderCustomLegend = () => (
    <Card className="w-64 h-full">
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">المؤشرات المالية</h4>
          <Switch 
            size="small" 
            checked={showComparison}
            onChange={setShowComparison}
            checkedChildren="مقارنة"
            unCheckedChildren="عادي"
          />
        </div>
        
        {metricsConfig.map((metric) => {
          const isHidden = hiddenMetrics.has(metric.name);
          const currentValue = financialMetrics?.summary?.[metric.field] || 0;
          
          return (
            <div
              key={metric.name}
              onClick={() => toggleMetric(metric.name)}
              className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                isHidden ? 'opacity-60 bg-gray-50 border-gray-200' : 'bg-white'
              }`}
              style={{
                borderColor: isHidden ? '#e5e7eb' : `${metric.color}30`,
                backgroundColor: isHidden ? '#f8fafc' : `${metric.color}08`,
                boxShadow: isHidden ? 'none' : `0 2px 8px ${metric.color}20`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: isHidden ? '#9ca3af' : metric.color,
                    }}
                  />
                  <span className={`text-xs font-medium ${isHidden ? 'text-gray-400' : 'text-gray-700'}`}>
                    {metric.icon} {metric.name}
                  </span>
                </div>
                <Tooltip title={metric.description}>
                  <InfoCircleOutlined className="text-gray-400 text-xs" />
                </Tooltip>
              </div>
              
              {!isHidden && (
                <div className="space-y-1">
                  <div className="text-lg font-bold" style={{ color: metric.color }}>
                    JOD {currentValue.toLocaleString('en-US')}
                  </div>
                  {showComparison && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">+12.5%</span>
                      <span className="text-gray-500">مقارنة بالشهر السابق</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <LineChartOutlined className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">تحليل الأداء المالي</h2>
              <p className="text-gray-600">
                {timePeriod === 'week' ? 'التحليل الأسبوعي للأرباح والإيرادات' : 
                 timePeriod === 'month' ? 'التحليل اليومي للأداء المالي' : 
                 timePeriod === 'year' ? 'التحليل الشهري للنمو المالي' : 
                 'تحليل مالي شامل للفترة المخصصة'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <Select
              value={timePeriod}
              onChange={(value: 'month' | 'week' | 'year' | 'all') => {
                setTimePeriod(value);
                if (value !== 'all') {
                  setSelectedDate('');
                  setCustomFromDate('');
                  setCustomToDate('');
                }
              }}
              className="w-full sm:w-32"
              size="large"
            >
              <Option value="week">أسبوع</Option>
              <Option value="month">شهر</Option>
              <Option value="year">سنة</Option>
              <Option value="all">مخصص</Option>
            </Select>
            
            {timePeriod === 'all' && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                  placeholder="من تاريخ"
                />
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                  placeholder="إلى تاريخ"
                />
              </div>
            )}
            
            {timePeriod !== 'all' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                placeholder="تاريخ محدد"
              />
            )}
            
            <Button 
              type="primary" 
              size="large"
              loading={financialMetricsLoading}
              icon={<FilterOutlined />}
              className="w-full sm:w-auto"
              style={{ backgroundColor: BRAND_COLORS.primary }}
              onClick={() => {
                fetchStatistics();
                fetchFinancialMetrics();
              }}
            >
              تحديث
            </Button>
          </div>
        </div>
      </Card>

      {/* Financial Summary Cards */}
      {renderSummaryCards()}

      {/* Main Chart with Custom Legend */}
      <div className="p-6">
        <div className="w-full bg-white rounded-lg border border-gray-100 p-8" style={{ height: 'clamp(400px, 50vh, 600px)' }}>
          {financialMetricsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 32, color: BRAND_PRIMARY }} spin />} 
                tip="جاري تحميل البيانات المالية..."
              />
            </div>
          ) : (
            <div className="h-full relative">
              {!financialMetrics || !financialMetrics.metrics || financialMetrics.metrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#F3F4F6' }}>
                    <BarChartOutlined className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-3">لا توجد بيانات مالية</h3>
                  <p className="text-gray-500 text-base max-w-md">
                    {timePeriod === 'week' ? 'لا توجد بيانات مالية خلال الأسبوع المحدد' : 
                     timePeriod === 'month' ? 'لا توجد بيانات مالية خلال الشهر المحدد' : 
                     timePeriod === 'year' ? 'لا توجد بيانات مالية خلال السنة المحددة' : 
                     'لا توجد بيانات مالية متاحة للفترة المحددة'}
                  </p>
                  <div className="mt-6 px-6 py-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: `1px solid ${CHART_GRID}` }}>
                    <p className="text-sm text-gray-600">
                      ستظهر البيانات هنا بمجرد إتمام المعاملات المالية
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full">
                  {/* Chart Container */}
                  <div className="flex-1 h-full">
                    <LineChart {...multiLineChartConfig} />
                  </div>
                  
                  {/* Custom Legend on the Right */}
                  <div className="ml-4">
                    {renderCustomLegend()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Additional Analysis Tabs */}
      <Card>
        <Tabs defaultActiveKey="1" size="large">
          <Tabs.TabPane tab={<span><BarChartOutlined />تحليل الاتجاهات</span>} key="1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'نمو الأرباح', value: '+12.5%', trend: 'up', color: BRAND_COLORS.success },
                { title: 'نمو الإيرادات', value: '+8.3%', trend: 'up', color: BRAND_COLORS.blue },
                { title: 'تحسن التكاليف', value: '-5.2%', trend: 'down', color: BRAND_COLORS.success },
                { title: 'كفاءة التوصيل', value: '+15.7%', trend: 'up', color: BRAND_COLORS.purple }
              ].map((item, index) => (
                <Card key={index} className="text-center">
                  <div className="text-3xl font-bold mb-2" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{item.title}</div>
                  <div className="flex items-center justify-center">
                    {item.trend === 'up' ? 
                      <WarningOutlined style={{ color: BRAND_COLORS.success }} /> :
                      <DingdingOutlined style={{ color: BRAND_COLORS.success }} />
                    }
                  </div>
                </Card>
              ))}
            </div>
          </Tabs.TabPane>
          
          <Tabs.TabPane tab={<span><PercentageOutlined />نسب الأداء</span>} key="2">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="هامش الربح الإجمالي">
                  <Progress 
                    percent={financialMetrics?.summary?.profit_margin || 0} 
                    strokeColor={BRAND_COLORS.success}
                    size="small"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    {(financialMetrics?.summary?.profit_margin || 0).toFixed(1)}% من إجمالي الإيرادات
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="نسبة التكاليف">
                  <Progress 
                    percent={financialMetrics?.summary?.total_revenue ? 
                      (financialMetrics.summary.total_costs / financialMetrics.summary.total_revenue) * 100 : 0
                    } 
                    strokeColor={BRAND_COLORS.warning}
                    size="small"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    {financialMetrics?.summary?.total_revenue ? 
                      ((financialMetrics.summary.total_costs / financialMetrics.summary.total_revenue) * 100).toFixed(1) : 0
                    }% من إجمالي الإيرادات
                  </div>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Storage Card Component
const StorageCard = ({ stats, loading }: { stats: StatisticsData; loading: boolean }) => {
  if (loading) {
    return (
      <Card className="h-full border border-gray-100 shadow-sm">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: BRAND_PRIMARY }} spin />} />
      </Card>
    );
  }

  const systemStorage = stats.systemStorage;
  const appStorage = stats.storageBreakdown.find((item: StorageBreakdownItem) => item.type === 'Application Images');

  return (
    <Card 
      title={
        <div className="flex items-center">
          <DatabaseOutlined className="ml-2" />
          <span>تخزين النظام</span>
        </div>
      }
      className="h-full border border-gray-100 shadow-sm"
    >
      {systemStorage ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">المساحة الإجمالية</span>
              <span className="font-medium">{systemStorage.totalGB.toFixed(1)} GB</span>
            </div>
            <Progress 
              percent={systemStorage.usePercentage} 
              status={systemStorage.usePercentage > 90 ? 'exception' : 'active'}
              strokeColor={systemStorage.usePercentage > 70 ? BRAND_WARNING : BRAND_PRIMARY}
              showInfo={false}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{systemStorage.usedGB.toFixed(1)} GB مستخدمة</span>
              <span>{systemStorage.freeGB.toFixed(1)} GB متبقية</span>
            </div>
          </div>

          {appStorage && (
            <div className="pt-4 border-t" style={{ borderColor: NEUTRAL_BORDER }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">تخزين التطبيق</span>
                <span className="font-medium">{appStorage.size}</span>
              </div>
              <Progress 
                percent={appStorage.percentage} 
                status={appStorage.percentage > 90 ? 'exception' : 'active'}
                strokeColor={appStorage.percentage > 70 ? BRAND_WARNING : BRAND_PRIMARY}
                showInfo={false}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          لا توجد بيانات تخزين متاحة
        </div>
      )}
    </Card>
  );
};

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsData>({
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
    newUsers: 0,
    activeUsers: 0,
    userGrowth: 0,
    systemStorage: null,
    totalEarnings: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalDeliveryFees: 0,
    totalDiscounts: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session, isAuthenticated, accessToken, isAdmin } = useAdminAuth();
  const router = useRouter();
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'year' | 'all'>('year');
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [financialMetricsLoading, setFinancialMetricsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && accessToken && isAdmin) {
      fetchStatistics();
      fetchFinancialMetrics();
    }
  }, [isAuthenticated, accessToken, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && accessToken && isAdmin) {
      const timeoutId = setTimeout(() => {
        fetchStatistics();
        fetchFinancialMetrics();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [timePeriod, selectedDate, customFromDate, customToDate, isAuthenticated, accessToken, isAdmin]);

  const fetchStatistics = async () => {
    if (!accessToken) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getStatistics(accessToken, timePeriod);
      const processedData = {
        ...data,
        revenueByCategory: data.revenueByCategory || []
      };
      setStats(processedData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('فشل تحميل الإحصائيات. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialMetrics = async () => {
    if (!accessToken) return;

    try {
      setFinancialMetricsLoading(true);
      const timeFilter = timePeriod === 'all' ? 'year' : timePeriod as 'week' | 'month' | 'year';
      
      const data = await getFinancialMetrics(
        accessToken,
        timeFilter,
        selectedDate || undefined,
        customFromDate || undefined,
        customToDate || undefined
      );
      
      setFinancialMetrics(data);
    } catch (err) {
      console.error('Failed to fetch financial metrics:', err);
    } finally {
      setFinancialMetricsLoading(false);
    }
  };

  const renderChangeIndicator = (value: number, reverseColors = false) => {
    const isPositive = value >= 0;
    const color = isPositive ? (reverseColors ? '#cf1322' : BRAND_SUCCESS) : (reverseColors ? BRAND_SUCCESS : '#cf1322');
    const Icon = isPositive ? ArrowUpOutlined : ArrowDownOutlined;
    
    return (
      <span style={{ color }} className="text-sm ml-2">
        <Icon /> {Math.abs(value)}%
      </span>
    );
  };

  // Sales chart config with data validation
  const chartData = (() => {
    if (stats.monthlySales && stats.monthlySales.length > 0) {
      if (timePeriod === 'month') {
        return stats.monthlySales.map((item: MonthlySale, index: number) => {
          let formattedDate;
          try {
            const date = new Date(item.month);
            if (isNaN(date.getTime())) {
              formattedDate = `${index + 1} ${new Date().toLocaleDateString('ar-SA', { month: 'short' })}`;
            } else {
              formattedDate = date.toLocaleDateString('ar-SA', { 
                day: 'numeric',
                weekday: 'short'
              });
            }
          } catch (error) {
            formattedDate = `${index + 1} ${new Date().toLocaleDateString('ar-SA', { month: 'short' })}`;
          }
          return {
            month: formattedDate,
            revenue: typeof item.revenue === 'number' && !isNaN(item.revenue) ? item.revenue : 0,
            originalDate: item.month
          };
        });
      }
      
      if (timePeriod === 'week') {
        return stats.monthlySales.map((item: MonthlySale, index: number) => {
          const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          let dayName;
          try {
            const date = new Date(item.month);
            if (isNaN(date.getTime())) {
              dayName = weekDays[index % 7] || `يوم ${index + 1}`;
            } else {
              dayName = weekDays[date.getDay()] || date.toLocaleDateString('ar-SA', { weekday: 'long' });
            }
          } catch (error) {
            dayName = weekDays[index % 7] || `يوم ${index + 1}`;
          }
          return {
            month: dayName,
            revenue: typeof item.revenue === 'number' && !isNaN(item.revenue) ? item.revenue : 0,
            originalDate: item.month
          };
        });
      }
      
      return stats.monthlySales.map((item: MonthlySale, index: number) => {
        const monthNames = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        let monthName;
        try {
          const date = new Date(item.month);
          if (isNaN(date.getTime())) {
            monthName = monthNames[index % 12] || `شهر ${index + 1}`;
          } else {
            monthName = monthNames[date.getMonth()] || date.toLocaleDateString('ar-SA', { month: 'long' });
          }
        } catch (error) {
          monthName = monthNames[index % 12] || `شهر ${index + 1}`;
        }
        return {
          month: monthName,
          revenue: typeof item.revenue === 'number' && !isNaN(item.revenue) ? item.revenue : 0,
          originalDate: item.month
        };
      });
    }
    
    switch (timePeriod) {
      case 'week':
        return [
          { month: 'الأحد', revenue: 0 },
          { month: 'الاثنين', revenue: 0 },
          { month: 'الثلاثاء', revenue: 0 },
          { month: 'الأربعاء', revenue: 0 },
          { month: 'الخميس', revenue: 0 },
          { month: 'الجمعة', revenue: 0 },
          { month: 'السبت', revenue: 0 }
        ];
      case 'month':
        const currentDate = new Date();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        return Array.from({ length: Math.min(daysInMonth, 31) }, (_, i) => ({
          month: `${i + 1}`,
          revenue: 0
        }));
      case 'year':
      case 'all':
      default:
        return [
          { month: 'يناير', revenue: 0 },
          { month: 'فبراير', revenue: 0 },
          { month: 'مارس', revenue: 0 },
          { month: 'أبريل', revenue: 0 },
          { month: 'مايو', revenue: 0 },
          { month: 'يونيو', revenue: 0 },
          { month: 'يوليو', revenue: 0 },
          { month: 'أغسطس', revenue: 0 },
          { month: 'سبتمبر', revenue: 0 },
          { month: 'أكتوبر', revenue: 0 },
          { month: 'نوفمبر', revenue: 0 },
          { month: 'ديسمبر', revenue: 0 }
        ];
    }
  })();

  const salesChartConfig = {
    data: chartData,
    xField: 'month',
    yField: 'revenue',
    height: 450,
    autoFit: true,
    point: {
      size: 8,
      shape: 'circle' as const,
      style: {
        fill: BRAND_PRIMARY,
        stroke: '#ffffff',
        strokeWidth: 3,
        shadowColor: 'rgba(7, 11, 57, 0.3)',
        shadowBlur: 6,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
      },
    },
    line: {
      style: {
        stroke: BRAND_PRIMARY,
        strokeWidth: 4,
        shadowColor: 'rgba(7, 11, 57, 0.2)',
        shadowBlur: 8,
        shadowOffsetX: 0,
        shadowOffsetY: 3,
      },
    },
    area: {
      style: {
        fill: `linear-gradient(180deg, ${BRAND_PRIMARY}30 0%, ${BRAND_PRIMARY}08 100%)`,
      },
    },
    smooth: true,
    color: BRAND_PRIMARY,
    padding: [80, 120, 120, 140],
    theme: {
      styleSheet: {
        brandColor: BRAND_PRIMARY,
        paletteQualitative10: [BRAND_PRIMARY, BRAND_SUCCESS, BRAND_WARNING, BRAND_ERROR],
      },
    },
    xAxis: {
      title: {
        text: timePeriod === 'week' ? 'أيام الأسبوع' : timePeriod === 'month' ? 'أيام الشهر' : 'الفترة الزمنية',
        style: { 
          fontSize: 16,
          fontWeight: 700,
          fill: CHART_AXIS,
          textAlign: 'center',
        },
        offset: 50,
      },
      line: {
        style: {
          stroke: CHART_AXIS,
          lineWidth: 2,
        },
      },
      tickLine: {
        style: {
          stroke: CHART_AXIS,
          lineWidth: 2,
        },
      },
      subTickLine: null,
      label: {
        style: {
          fill: CHART_AXIS,
          fontSize: timePeriod === 'month' && chartData.length > 15 ? 11 : 13,
          fontWeight: 600,
          textAlign: 'center',
        },
        rotate: timePeriod === 'month' && chartData.length > 15 ? -45 : 0,
        offset: 20,
        autoRotate: false,
        autoHide: timePeriod === 'month' && chartData.length > 20,
        formatter: (text: string, item: any, index: number) => {
          if (timePeriod === 'month' && chartData.length > 15) {
            const step = Math.ceil(chartData.length / 8);
            return index % step === 0 ? text : '';
          }
          return text;
        },
      },
      grid: {
        line: {
          style: {
            stroke: CHART_GRID,
            lineWidth: 1,
            lineDash: [4, 4],
            opacity: 0.7,
          },
        },
      },
      nice: true,
    },
    yAxis: {
      title: {
        text: 'الإيرادات (دينار أردني)',
        style: { 
          fontSize: 16,
          fontWeight: 700,
          fill: CHART_AXIS,
          textAlign: 'center',
        },
        offset: 80,
      },
      line: {
        style: {
          stroke: CHART_AXIS,
          lineWidth: 2,
        },
      },
      tickLine: {
        style: {
          stroke: CHART_AXIS,
          lineWidth: 2,
        },
      },
      subTickLine: null,
      label: {
        style: {
          fill: CHART_AXIS,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'right',
        },
        formatter: (v: string) => {
          const value = parseFloat(v);
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
          } else if (value >= 1) {
            return `${value.toFixed(0)}`;
          } else {
            return `${value.toFixed(2)}`;
          }
        },
        offset: 15,
      },
      grid: {
        line: {
          style: {
            stroke: CHART_GRID,
            lineWidth: 1,
            lineDash: [4, 4],
            opacity: 0.7,
          },
        },
      },
      nice: true,
      tickCount: 6,
    },
    tooltip: {
      showTitle: true,
      title: (data: any) => {
        const displayDate = data.originalDate || data.month;
        return `📅 ${displayDate}`;
      },
      formatter: (data: any) => ({
        name: 'إجمالي الإيرادات',
        value: `${data.revenue.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'JOD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`,
      }),
      showCrosshairs: true,
      crosshairs: {
        type: 'xy',
        line: {
          style: {
            stroke: BRAND_PRIMARY,
            strokeWidth: 1,
            lineDash: [3, 3],
            opacity: 0.7,
          },
        },
      },
      domStyles: {
        'g2-tooltip': {
          backgroundColor: '#ffffff',
          border: `2px solid ${BRAND_PRIMARY}`,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(7, 11, 57, 0.15)',
          padding: '16px 20px',
          fontSize: '14px',
          minWidth: '220px',
        },
        'g2-tooltip-title': {
          color: BRAND_PRIMARY,
          fontWeight: 700,
          fontSize: '16px',
          marginBottom: '12px',
          textAlign: 'center',
          borderBottom: `1px solid ${CHART_GRID}`,
          paddingBottom: '8px',
        },
        'g2-tooltip-list-item': {
          color: '#374151',
          fontSize: '14px',
          fontWeight: 600,
          padding: '4px 0',
        },
        'g2-tooltip-list-item-value': {
          color: BRAND_PRIMARY,
          fontWeight: 700,
          fontSize: '15px',
        },
      },
    },
    legend: false,
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1200,
      },
      enter: {
        animation: 'fade-in',
        duration: 600,
      },
    },
    interactions: [
      {
        type: 'marker-active',
      },
      {
        type: 'brush',
      },
    ],
  };

  // Out of stock products columns
  const outOfStockColumns: ColumnsType<OutOfStockProduct> = [
    {
      title: 'المنتج',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: OutOfStockProduct) => (
        <div>
          <Text strong>{text || 'اسم غير متوفر'}</Text>
          {record.has_variants && (
            <div>
              <Tag color={BRAND_PRIMARY} className="text-xs mt-1">لديه متغيرات</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'حالة المخزون',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: OutOfStockProduct) => (
        <Tag color={stock === 0 ? BRAND_ERROR : BRAND_WARNING}>
          {record.has_variants 
            ? stock === 0 
              ? 'كل المتغيرات نفذت من المخزون' 
              : 'بعض المتغيرات متوفرة'
            : stock === 0 
              ? 'نفذ من المخزون' 
              : `${stock} متبقي`}
        </Tag>
      ),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      align: 'center' as const,
      render: (_, record: OutOfStockProduct) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEditProduct(record)}
            title="تعديل المنتج"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            size="small" 
            onClick={() => {
              Modal.confirm({
                title: 'تأكيد الحذف',
                content: `هل أنت متأكد من حذف المنتج "${record.title}"؟`,
                okText: 'نعم، احذف',
                okType: 'danger',
                cancelText: 'إلغاء',
                onOk: () => handleDeleteProduct(record),
              });
            }}
            title="حذف المنتج"
            loading={deletingProductId === record.id}
          />
        </Space>
      ),
    },
  ];

  // Missing images columns
  const missingImagesColumns = [
    {
      title: 'المنتج',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Text style={{ color: BRAND_PRIMARY }} className="hover:underline">{text}</Text>
      ),
    },
    {
      title: 'الحالة',
      key: 'status',
      render: () => (
        <Tag icon={<FileImageOutlined />} color={BRAND_WARNING}>
          صورة رئيسية ناقصة
        </Tag>
      ),
    },
  ];

  const handleEditProduct = (product: OutOfStockProduct) => {
    router.push(`/admin_dashboard/products/${product.id}`);
  };

  const handleDeleteProduct = async (product: OutOfStockProduct) => {
    if (!accessToken) return;
    
    try {
      setDeletingProductId(product.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل حذف المنتج');
      }

      const data = await getStatistics(accessToken);
      const processedData = {
        ...data,
        revenueByCategory: data.revenueByCategory || []
      };
      setStats(processedData);
      message.success('تم حذف المنتج بنجاح');
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('حدث خطأ أثناء محاولة حذف المنتج');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <AdminPageWrapper>
      {loading && (
        <AdminLoadingSpinner message="جاري تحميل الإحصائيات..." />
      )}
      {error && (
        <AdminErrorDisplay 
          message={error} 
          onRetry={fetchStatistics}
        />
      )}
      {!loading && !error && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <Title level={2} className="mb-2 text-gray-900">لوحة التحكم</Title>
              <p className="text-gray-600 text-sm">مرحباً بك في لوحة تحكم متجر طاقة</p>
            </div>
          </div>

          {/* Original Earnings Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card 
              hoverable 
              className="h-full border border-gray-100 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND_SUCCESS }}>
                    <span className="text-white text-xl font-bold">₪</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">إجمالي الأرباح</h3>
                  <p className="text-3xl font-bold" style={{ color: BRAND_SUCCESS }}>
                    JOD {stats.totalEarnings.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-gray-500">صافي الأرباح بعد التكاليف</p>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">هامش الربح</span>
                      <span className="text-sm font-semibold" style={{ color: BRAND_SUCCESS }}>
                        {stats.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              hoverable 
              className="h-full border border-gray-100 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND_PRIMARY }}>
                    <span className="text-white text-xl font-bold">💰</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">إجمالي الإيرادات</h3>
                  <p className="text-3xl font-bold" style={{ color: BRAND_PRIMARY }}>
                    JOD {stats.totalRevenue.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-gray-500">من جميع الطلبات المكتملة</p>
                </div>
              </div>
            </Card>

            <Card 
              hoverable 
              className="h-full border border-gray-100 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND_WARNING }}>
                    <span className="text-white text-xl font-bold">📦</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">إجمالي التكاليف</h3>
                  <p className="text-3xl font-bold" style={{ color: BRAND_WARNING }}>
                    JOD {stats.totalCosts.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-gray-500">تكلفة المنتجات المباعة</p>
                </div>
              </div>
            </Card>

            <Card 
              hoverable 
              className="h-full border border-gray-100 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#8B5CF6' }}>
                    <span className="text-white text-xl font-bold">🚚</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">رسوم التوصيل</h3>
                  <p className="text-3xl font-bold" style={{ color: '#8B5CF6' }}>
                    JOD {stats.totalDeliveryFees.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-gray-500">إجمالي رسوم الشحن</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Financial Metrics Chart */}
          <EnhancedFinancialAnalysis 
            financialMetrics={financialMetrics}
            financialMetricsLoading={financialMetricsLoading}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            customFromDate={customFromDate}
            setCustomFromDate={setCustomFromDate}
            customToDate={customToDate}
            setCustomToDate={setCustomToDate}
            fetchFinancialMetrics={fetchFinancialMetrics}
            fetchStatistics={fetchStatistics}
          />

          {/* Original Sales Chart */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card 
              className="h-full border border-gray-100 shadow-sm"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: NEUTRAL_BG }}>
                      <LineChartOutlined style={{ color: BRAND_PRIMARY }} className="text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timePeriod === 'week' ? 'مبيعات الأسبوع' : 
                         timePeriod === 'month' ? 'مبيعات الشهر اليومية' : 
                         timePeriod === 'year' ? 'مبيعات السنة الشهرية' : 
                         'تحليل المبيعات الشامل'}
                      </h3>
                      <p className="text-sm text-gray-500">تطور الإيرادات عبر الزمن</p>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="p-6">
                <div className="w-full bg-white rounded-lg border border-gray-100 p-8" style={{ height: '500px' }}>
                  <LineChart {...salesChartConfig} />
                </div>
              </div>
            </Card>
          </div>

          {/* Alerts and Storage Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card 
                className="h-full border border-gray-100 shadow-sm"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                        <AlertOutlined className="text-lg" style={{ color: BRAND_WARNING }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">التنبيهات المهمة</h3>
                        <p className="text-sm text-gray-500">مشاكل تحتاج إلى انتباهك</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg transition-colors text-sm font-medium" style={{ backgroundColor: '#fef3c7', color: BRAND_WARNING }}>
                      عرض الكل
                    </button>
                  </div>
                }
              >
                <Tabs 
                  defaultActiveKey="1" 
                  items={[
                    {
                      key: '1',
                      label: (
                        <span>
                          <ShopOutlined />
                          <span className="mr-1">نفاد المخزون ({stats.outOfStockProducts.length})</span>
                        </span>
                      ),
                      children: (
                        <div className="overflow-x-auto">
                          <Table<OutOfStockProduct> 
                            columns={outOfStockColumns} 
                            dataSource={stats.outOfStockProducts.map((item: any): OutOfStockTableItem => ({
                              key: item.id,
                              id: item.id,
                              title: item.title || 'اسم غير معروف',
                              stock: typeof item.stock === 'number' ? item.stock : 0,
                              has_variants: item.has_variants,
                            }))}
                            pagination={{ pageSize: 3, hideOnSinglePage: true }}
                            size="small"
                            rowKey="key"
                            scroll={{ x: 600 }}
                            locale={{
                              emptyText: 'لا توجد منتجات نفدت من المخزون'
                            }}
                          />
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: (
                        <span>
                          <FileImageOutlined />
                          <span className="mr-1">صور ناقصة ({stats.missingImagesProducts.length})</span>
                        </span>
                      ),
                      children: (
                        <div className="overflow-x-auto">
                          <Table 
                            columns={missingImagesColumns} 
                            dataSource={stats.missingImagesProducts} 
                            pagination={{ pageSize: 3, hideOnSinglePage: true }}
                            size="small"
                            rowKey="id"
                            scroll={{ x: 400 }}
                          />
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            </div>
            <div className="lg:col-span-1">
              <StorageCard stats={stats} loading={loading} />
            </div>
          </div>

          {/* Top Selling Products */}
          <Card 
            className="mb-8 border border-gray-100 shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#f0fdf4' }}>
                    <BarChartOutlined className="text-lg" style={{ color: BRAND_SUCCESS }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">المنتجات الأكثر مبيعاً</h3>
                    <p className="text-sm text-gray-500">أفضل المنتجات أداءً</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg transition-colors text-sm font-medium" style={{ backgroundColor: '#f0fdf4', color: BRAND_SUCCESS }}>
                  إدارة المنتجات
                </button>
              </div>
            }
          >
            <div className="p-6">
              {stats.topSellingProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stats.topSellingProducts.map((product: TopSellingProduct, index: number) => (
                    <div key={product.id} className="group relative">
                      <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        {/* Product Image */}
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${product.id}/main.jpg`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png';
                            }}
                          />
                          {/* Rank Badge */}
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: BRAND_PRIMARY }}>
                            #{index + 1}
                          </div>
                          {/* Sales Badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white shadow-lg" style={{ backgroundColor: BRAND_SUCCESS }}>
                            {product.sales} مبيعات
                          </div>
                          {/* Status Badge */}
                          <div className="absolute bottom-3 right-3">
                            <Tag color={product.is_active ? BRAND_SUCCESS : BRAND_ERROR} className="text-xs">
                              {product.is_active ? 'نشط' : 'غير نشط'}
                            </Tag>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-right">{product.name}</h4>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold" style={{ color: BRAND_PRIMARY }}>
                              JOD {product.price.toLocaleString('en-US')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {product.stock} متبقي
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Button 
                                type="text" 
                                icon={<EditOutlined />} 
                                size="small" 
                                onClick={() => router.push(`/admin_dashboard/products/${product.id}`)}
                                title="تعديل المنتج"
                                className="text-gray-600 hover:text-blue-600"
                              />
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'تأكيد الحذف',
                                    content: `هل أنت متأكد من حذف المنتج "${product.name}"؟`,
                                    okText: 'نعم، احذف',
                                    okType: 'danger',
                                    cancelText: 'إلغاء',
                                    onOk: () => handleDeleteProduct({ 
                                      id: product.id, 
                                      title: product.name, 
                                      stock: product.stock, 
                                      has_variants: false 
                                    }),
                                  });
                                }}
                                title="حذف المنتج"
                                loading={deletingProductId === product.id}
                                className="text-gray-600 hover:text-red-600"
                              />
                            </div>
                            <div className="text-xs text-gray-400">
                              {product.created_at ? 
                                new Date(product.created_at).toLocaleDateString('ar-SA') : 
                                new Date().toLocaleDateString('ar-SA')
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F3F4F6' }}>
                    <BarChartOutlined className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-500">لا توجد بيانات متاحة عن المنتجات الأكثر مبيعاً</p>
                </div>
              )}
            </div>
          </Card>

        </div>
      )}
    </AdminPageWrapper>
  );
}