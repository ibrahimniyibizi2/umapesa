import { useState, useEffect } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  kycStatus: string;
}

export const useAuth = (): { 
  user: User | null; 
  loading: boolean; 
  error: string | null; 
  updateProfile: (formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  }) => Promise<{ success: boolean; user: User; } | { success: boolean; error: string; }>;
  isAuthenticated: boolean;
} => {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/users");
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await res.json();
        setUser(data[0]); // Get the first user
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  // Update user profile
  const updateProfile = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  }) => {
    try {
      const res = await fetch("http://localhost:5001/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await res.json();
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error updating profile:', err);
      return { success: false, error: errorMessage };
    }
  };

  return { 
    user, 
    loading, 
    error, 
    updateProfile,
    isAuthenticated: !!user
  };
};
