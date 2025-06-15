import { User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'vendor' | 'retail_user';
  shopName?: string;
  region?: string;
}

export const AUTH_STORAGE_KEY = 'kiranaconnect_user';

export class AuthService {
  static saveUser(user: User): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }

  static getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get user from localStorage:', error);
      return null;
    }
  }

  static removeUser(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove user from localStorage:', error);
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }

  static hasRole(requiredRole: string): boolean {
    const user = this.getStoredUser();
    return user ? user.role === requiredRole : false;
  }

  static hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUser();
    return user ? roles.includes(user.role) : false;
  }

  static canAccessAdminFeatures(): boolean {
    return this.hasRole('admin');
  }

  static canAccessKiranaFeatures(): boolean {
    return this.hasRole('vendor');
  }

  static canAccessRetailFeatures(): boolean {
    return this.hasRole('retail_user');
  }

  static getDashboardRoute(user?: User | null): string {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return '/';
    
    switch (currentUser.role) {
      case 'admin':
        return '/admin';
      case 'vendor':
        return '/kirana';
      case 'retail_user':
        return '/retail';
      default:
        return '/';
    }
  }

  static getUserDisplayName(user?: User | null): string {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return 'Guest';
    
    return currentUser.shopName || currentUser.name;
  }

  static getUserInitials(user?: User | null): string {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return 'GU';
    
    return currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  static isSessionExpired(): boolean {
    // In a real application, you would check JWT expiration
    // For now, we'll assume session is valid if user exists
    return !this.isAuthenticated();
  }

  static refreshSession(): Promise<User | null> {
    // In a real application, you would refresh the JWT token
    // For now, return the stored user
    return Promise.resolve(this.getStoredUser());
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePhoneNumber(phone: string): boolean {
    // Indian phone number validation
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  static formatPhoneNumber(phone: string): string {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  }

  static getRegions(): string[] {
    return [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Salem',
      'Trichy',
      'Tirunelveli',
      'Erode',
      'Vellore',
      'Thoothukudi',
      'Dindigul'
    ];
  }

  static getUserTypeLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Distributor/Admin';
      case 'vendor':
        return 'Kirana Store Owner';
      case 'retail_user':
        return 'Retail Customer';
      default:
        return 'Unknown';
    }
  }

  static getPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return [
          'view_all_orders',
          'manage_orders',
          'manage_products',
          'manage_inventory',
          'view_analytics',
          'manage_users',
          'export_data'
        ];
      case 'vendor':
        return [
          'view_own_orders',
          'place_bulk_orders',
          'view_bulk_products',
          'view_order_history',
          'track_deliveries'
        ];
      case 'retail_user':
        return [
          'view_own_orders',
          'place_retail_orders',
          'view_retail_products',
          'view_order_history',
          'track_deliveries'
        ];
      default:
        return [];
    }
  }

  static hasPermission(permission: string, user?: User | null): boolean {
    const currentUser = user || this.getStoredUser();
    if (!currentUser) return false;
    
    const permissions = this.getPermissions(currentUser.role);
    return permissions.includes(permission);
  }
}

export default AuthService;
