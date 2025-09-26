import { useRouter } from 'next/navigation';

export function useRouteParams<T extends Record<string, string>>(params: T): T {
  const router = useRouter();
  return params;
}
