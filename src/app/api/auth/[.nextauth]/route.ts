import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

// Ensure API URL ends with a slash
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || '';
  return url.endsWith('/') ? url : `${url}/`;
};

const API_URL = getApiUrl();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          throw new Error(JSON.stringify({
            message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور',
            error_code: 'missing_credentials'
          }));
        }
      
        try {
          if (!API_URL) {
            console.error('NEXT_PUBLIC_API_URL is not defined');
            throw new Error(JSON.stringify({
              message: 'خطأ في إعدادات النظام',
              error_code: 'config_error'
            }));
          }
      
          const loginUrl = `${API_URL}auth/login`;
  
          
          const response = await axios.post(loginUrl, {
            email: credentials.email,
            password: credentials.password
          });
      
  
          
          if (response.status === 200 && response.data) {
            const user = response.data.user;
    
            return {
              uid: user.uid,
              id: user.uid,
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token,
              first_name: user.first_name,
              role: user.role,
              last_name: user.last_name,
              is_verified: user.is_verified,
              created_at: user.created_at,
              updated_at: user.updated_at
            };
          }
          console.error('Invalid response from server:', response.data);
          throw new Error(JSON.stringify({
            message: 'استجابة غير صالحة من الخادم',
            error_code: 'invalid_response'
          }));
        } catch (error: any) {
          console.error('Login error:', error);
          
          let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
          let errorCode = 'login_failed';
          let canResendVerification = false;
  
          if (error.response) {
            const status = error.response.status;
            const responseData = error.response.data;
            
            if (status === 404 && responseData?.error_code === 'user_does_not_exists') {
              // User not found
              errorMessage = responseData.message || 'حسابك غير موجود، يرجى إنشاء حساب جديد';
              errorCode = 'user_does_not_exists';
            } else if (status === 400 && responseData?.error_code === 'invalid_credentials') {
              // Wrong password
              errorMessage = responseData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
              errorCode = 'invalid_credentials';
            } else if (status === 403 && responseData?.error_code === 'account_not_verified') {
              // Account not verified - CRITICAL: This must match backend error code exactly
              errorMessage = responseData.message || 'حسابك غير مفعل، يرجى تفعيل حسابك';
              errorCode = 'account_not_verified';
              canResendVerification = true;
            } else {
              // Generic server error
              errorMessage = 'الخدمة غير متوفرة حالياً، يرجى المحاولة لاحقاً';
              errorCode = 'service_unavailable';
            }
          }
  
          throw new Error(JSON.stringify({
            message: errorMessage,
            error_code: errorCode,
            can_resend: canResendVerification
          }));
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...token.user,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken
        };
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login?error=AuthenticationFailed',
    signOut: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code: string, metadata: unknown) {
      if (typeof metadata === 'object' && metadata !== null) {
        console.error('Auth error:', { code, ...metadata as Record<string, unknown> });
      } else {
        console.error('Auth error:', code, metadata);
      }
    },
    warn(code: string) {
      console.warn('Auth warning:', code);
    },
    debug(code: string, metadata: unknown) {
      if (typeof metadata === 'object' && metadata !== null) {
  
      } else {
  
      }
    }
  }
});

export { handler as GET, handler as POST };
