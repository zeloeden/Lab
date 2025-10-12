import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Lab Lead' | 'Technician' | 'Viewer';
  permissions: Record<string, string[]>;
  profilePhoto?: string; // Base64 encoded image or URL
  profilePhotoName?: string; // Original filename
}

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string, inputType?: 'email' | 'username') => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  isAuthenticated: boolean;
  updateUserProfile: (updates: Partial<User>) => void;
  uploadProfilePhoto: (file: File) => Promise<boolean>;
  removeProfilePhoto: () => void;
  canViewCost: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database with both email and username login support
const mockUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@nbslims.com',
    fullName: 'System Administrator',
    role: 'Admin',
    permissions: {
      samples: ['create', 'read', 'update', 'delete', 'view_pricing'],
      tests: ['create', 'read', 'update', 'delete', 'approve'],
      suppliers: ['create', 'read', 'update', 'delete'],
      purchasing: ['create', 'read', 'update', 'delete', 'revert', 'view_costs'],
      users: ['create', 'read', 'update', 'delete'],
      settings: ['read', 'update']
    }
  },
  {
    id: 'user-lablead',
    username: 'lablead',
    email: 'lablead@nbslims.com',
    fullName: 'Laboratory Lead',
    role: 'Lab Lead',
    permissions: {
      samples: ['create', 'read', 'update', 'delete', 'view_pricing'],
      tests: ['create', 'read', 'update', 'approve'],
      suppliers: ['read'],
      purchasing: ['create', 'read', 'update', 'view_costs'],
      users: ['read'],
      settings: ['read']
    }
  },
  {
    id: 'user-tech',
    username: 'technician',
    email: 'tech@nbslims.com',
    fullName: 'Laboratory Technician',
    role: 'Technician',
    permissions: {
      samples: ['create', 'read', 'update'],
      tests: ['create', 'read', 'update'],
      suppliers: ['read'],
      purchasing: ['read'],
      users: [],
      settings: []
    }
  },
  {
    id: 'user-viewer',
    username: 'viewer',
    email: 'viewer@nbslims.com',
    fullName: 'System Viewer',
    role: 'Viewer',
    permissions: {
      samples: ['read'],
      tests: ['read'],
      suppliers: ['read'],
      purchasing: ['read'],
      users: [],
      settings: []
    }
  }
];

// Mock password database (in real app, passwords would be hashed)
const mockPasswords: Record<string, string> = {
  'user-admin': 'admin123',
  'user-lablead': 'lablead123',
  'user-tech': 'tech123',
  'user-viewer': 'viewer123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication on app load
    const storedUser = localStorage.getItem('nbslims_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('nbslims_user');
      }
    }
  }, []);

  const findUserByEmailOrUsername = (emailOrUsername: string): User | null => {
    const lowercaseInput = emailOrUsername.toLowerCase();
    
    // First try to find by email
    let foundUser = mockUsers.find(u => u.email.toLowerCase() === lowercaseInput);
    
    // If not found by email, try by username
    if (!foundUser) {
      foundUser = mockUsers.find(u => u.username.toLowerCase() === lowercaseInput);
    }
    
    return foundUser || null;
  };

  const login = async (emailOrUsername: string, password: string, inputType?: 'email' | 'username'): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = findUserByEmailOrUsername(emailOrUsername);
      
      if (!foundUser) {
        console.log('User not found:', emailOrUsername);
        return false;
      }
      
      // Check password
      const correctPassword = mockPasswords[foundUser.id];
      if (password !== correctPassword) {
        console.log('Invalid password for user:', foundUser.username);
        return false;
      }
      
      // Load any stored profile data
      const storedProfileData = localStorage.getItem(`nbslims_profile_${foundUser.id}`);
      let userWithProfile = { ...foundUser };
      
      if (storedProfileData) {
        try {
          const profileData = JSON.parse(storedProfileData);
          userWithProfile = { ...foundUser, ...profileData };
        } catch (error) {
          console.error('Error loading profile data:', error);
        }
      }
      
      // Successful login
      setUser(userWithProfile);
      setIsAuthenticated(true);
      localStorage.setItem('nbslims_user', JSON.stringify(userWithProfile));
      
      console.log(`Login successful for ${inputType || 'credential'}:`, emailOrUsername);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nbslims_user');
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'Admin') return true;
    
    const userPermissions = user.permissions[resource] || [];
    return userPermissions.includes(action);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Save to localStorage
    localStorage.setItem('nbslims_user', JSON.stringify(updatedUser));
    localStorage.setItem(`nbslims_profile_${user.id}`, JSON.stringify(updates));
  };

  const uploadProfilePhoto = async (file: File): Promise<boolean> => {
    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }
      
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      // Update user profile
      updateUserProfile({
        profilePhoto: base64,
        profilePhotoName: file.name
      });
      
      return true;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return false;
    }
  };

  const removeProfilePhoto = () => {
    updateUserProfile({
      profilePhoto: undefined,
      profilePhotoName: undefined
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasPermission,
    isAuthenticated,
    updateUserProfile,
    uploadProfilePhoto,
    removeProfilePhoto,
    canViewCost: user?.role === 'Admin' || user?.role === 'Owner' || hasPermission('purchasing','view_costs')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};