import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const LOCAL_TOKEN = 'local-token-1';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      let storedToken = localStorage.getItem('token');
      if (!storedToken) {
        storedToken = LOCAL_TOKEN;
        localStorage.setItem('token', LOCAL_TOKEN);
      }
      setToken(storedToken);
    } catch {
      setToken(LOCAL_TOKEN);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Fetch user error:', err);
      }
    };

    fetchUser();
  }, [token]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return { token, user, isLoading, logout };
}
