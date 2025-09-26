'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { errorHandler } from '@/lib/error-handler';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner';
import { AdminErrorDisplay } from '@/components/admin/AdminErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, UserCheck, UserX, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface User {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const BRAND_PRIMARY = '#070B39';
const BRAND_SUCCESS = '#63D829';
const BRAND_WARNING = '#FFC721';

export default function UsersPage() {
  const router = useRouter();
  const { session, isAuthenticated, accessToken, isAdmin } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Data fetching
  useEffect(() => {
    if (isAuthenticated && accessToken && isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, accessToken, isAdmin]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => 
        verificationFilter === 'verified' ? user.is_verified : !user.is_verified
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchQuery, roleFilter, verificationFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    if (!accessToken) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Handle both old array format and new paginated format
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Fetch Users Error:', err);
      const errorMessage = err.message || "حدث خطأ أثناء جلب بيانات المستخدمين";
      setError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (userUid: string, currentStatus: boolean) => {
    if (!accessToken) {
      errorHandler.error("لم يتم العثور على رمز الوصول");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userUid}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ is_verified: !currentStatus })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      errorHandler.success(`تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`);

      // Refresh the list
      fetchUsers();
    } catch (err: any) {
      console.error('Toggle Verification Error:', err);
      errorHandler.error(err.message || "حدث خطأ أثناء تحديث حالة المستخدم");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'user': return 'مستخدم';
      default: return role;
    }
  };

  // Pagination
  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : [];
  const totalPages = Math.ceil(safeFilteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = safeFilteredUsers.slice(startIndex, endIndex);

  return (
    <AdminPageWrapper>
      {loading && (
        <AdminLoadingSpinner message="جاري تحميل بيانات المستخدمين..." />
      )}
      {error && (
        <AdminErrorDisplay 
          message={error} 
          onRetry={fetchUsers}
        />
      )}
      {!loading && !error && (
        <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
          <p className="text-gray-600">عرض وإدارة جميع المستخدمين المسجلين</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8 border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg text-gray-900">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 border-gray-300 focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-[#070B39] focus:border-transparent">
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-[#070B39] focus:border-transparent">
                <SelectValue placeholder="تصفية حسب التفعيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستخدمين</SelectItem>
                <SelectItem value="verified">مفعل</SelectItem>
                <SelectItem value="unverified">غير مفعل</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setVerificationFilter('all');
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">قائمة المستخدمين</CardTitle>
              <p className="text-sm text-gray-600 mt-1">إدارة جميع المستخدمين المسجلين</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-white px-4 py-2 rounded-full border border-gray-200 text-gray-700 shadow-sm">
                العدد: <span className="font-semibold text-gray-900">{safeFilteredUsers.length}</span> من <span className="font-semibold text-gray-900">{Array.isArray(users) ? users.length : 0}</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {currentUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {(Array.isArray(users) ? users.length : 0) === 0 ? 'لا توجد مستخدمين مسجلين حالياً' : 'لا توجد نتائج تطابق البحث'}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-center min-w-[120px] font-semibold text-gray-700">الاسم</TableHead>
                    <TableHead className="text-center min-w-[150px] font-semibold text-gray-700">البريد الإلكتروني</TableHead>
                    <TableHead className="text-center min-w-[100px] hidden sm:table-cell font-semibold text-gray-700">اسم المستخدم</TableHead>
                    <TableHead className="text-center min-w-[80px] font-semibold text-gray-700">الدور</TableHead>
                    <TableHead className="text-center min-w-[100px] font-semibold text-gray-700">الحالة</TableHead>
                    <TableHead className="text-center min-w-[120px] hidden md:table-cell font-semibold text-gray-700">تاريخ التسجيل</TableHead>
                    <TableHead className="text-center min-w-[120px] font-semibold text-gray-700">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell>
                        <div className="text-sm font-semibold text-gray-900 text-center">
                          {user.first_name} {user.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm text-gray-600 text-center">
                          {user.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            user.role === 'admin' 
                              ? 'bg-gray-100 text-gray-800 border-gray-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {user.is_verified ? (
                            <UserCheck className="h-4 w-4" style={{ color: BRAND_SUCCESS }} />
                          ) : (
                            <UserX className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            user.is_verified ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {user.is_verified ? 'مفعل' : 'غير مفعل'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                            onClick={() => router.push(`/admin_dashboard/users/UserDetails?uid=${user.uid}`)}
                          >
                            <Eye className="h-3.5 w-3.5 ml-1" />
                            عرض
                          </Button>
                          <Button
                            variant={user.is_verified ? "destructive" : "default"}
                            size="sm"
                            className={`h-8 px-3 text-xs transition-all duration-200 ${
                              user.is_verified 
                                ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' 
                                : 'bg-[#070B39] text-white hover:opacity-90'
                            }`}
                            onClick={() => handleToggleVerification(user.uid, user.is_verified)}
                          >
                            {user.is_verified ? 'إلغاء التفعيل' : 'تفعيل'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            عرض {startIndex + 1} إلى {Math.min(endIndex, safeFilteredUsers.length)} من {safeFilteredUsers.length} مستخدم
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <span className="text-sm px-3 py-1 bg-muted rounded">
              {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        </div>
        )}
        </div>
      )}
    </AdminPageWrapper>
  );
}
