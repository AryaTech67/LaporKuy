'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLaporKuyStore } from '@/lib/store';
import { ShieldCheck } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, isLoggedIn } = useLaporKuyStore();
  const [isReady, setIsReady] = useState(false);


  useEffect(() => {
    if (!isInitialized) return;

    if (!isLoggedIn) {
      // If they are not logged in and not on login/register/forgot-password/admin, kick them out
      if (
        !pathname.startsWith('/login') && 
        !pathname.startsWith('/register') && 
        !pathname.startsWith('/forgot-password') &&
        !pathname.startsWith('/admin') &&
        pathname !== '/'
      ) {
        import('sonner').then(({ toast }) => {
          toast.error('Akses Terbatas', {
            description: 'Silakan masuk atau daftar terlebih dahulu untuk mengakses fitur ini.'
          });
        });
        router.replace('/login');
      } else {
        setIsReady(true);
      }
    } else {
      // If they are logged in but trying to access login/register/forgot-password, redirect to home
      if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
        router.replace('/');
      } else {
        setIsReady(true);
      }
    }
  }, [isInitialized, isLoggedIn, pathname, router]);

  const isPublicRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/admin') ||
    pathname === '/';

  if (!isReady || !isInitialized) {
    // Do not block rendering for public routes, allows SSR to work and fixes LCP
    if (isPublicRoute) {
      return <>{children}</>;
    }
    
    // Show a sleek loading screen while checking auth
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#0057B8] rounded-2xl flex items-center justify-center animate-pulse mb-4 shadow-lg">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <p className="text-[#003B73] font-bold tracking-widest text-sm animate-pulse">
          MEMVERIFIKASI SESI...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
