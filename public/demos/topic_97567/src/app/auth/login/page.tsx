'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem('token', 'local-token-1');
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❄️</div>
        <p className="text-gray-400">正在进入雪球日记...</p>
      </div>
    </div>
  );
};

export default LoginPage;
