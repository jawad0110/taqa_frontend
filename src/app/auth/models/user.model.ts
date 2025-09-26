export interface User {
  uid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  token?: string;
}
