import { redirect } from 'next/navigation';
import { AuthService } from './auth.service';

export async function authGuard() {
  const authService = AuthService.getInstance();
  const token = localStorage.getItem('token');
  
  if (!token) {
    redirect('/login');
  }
  
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      redirect('/login');
    }
    return user;
  } catch (error) {
    redirect('/login');
  }
}

