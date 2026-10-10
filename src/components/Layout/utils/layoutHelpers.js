// src/components/Layout/utils/layoutHelpers.js
import {
  LayoutDashboard, ShoppingBag, Factory, Calculator, Carrot, Box,
  BookOpen, Wallet, TrendingUp, Hammer, Users, BarChart3,
  FileSpreadsheet, Bell, History, Settings,
  FileText                                            // 🆕
} from 'lucide-react';

export const MENU_SECTIONS = [
  {
    id: 'main',
    label: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
    ]
  },
  {
    id: 'business',
    label: 'BUSINESS',
    items: [
      { id: 'daily-sales',      label: 'Daily Sales',      icon: ShoppingBag, path: '/daily-sales' },
      { id: 'production',       label: 'Production',       icon: Factory,     path: '/production' },
      { id: 'product-costing',  label: 'Product Costing',  icon: Calculator,  path: '/product-costing' }
    ]
  },
  {
    id: 'inventory',
    label: 'INVENTORY',
    items: [
      { id: 'ingredients',       label: 'Ingredients',       icon: Carrot, path: '/ingredients' },
      { id: 'packing-materials', label: 'Packing Materials', icon: Box,    path: '/packing-materials' }
    ]
  },
  {
    id: 'finance',
    label: 'FINANCE',
    items: [
      { id: 'cashbook',        label: 'Cashbook',        icon: BookOpen,   path: '/cashbook' },
      { id: 'expenses',        label: 'Expenses',        icon: Wallet,     path: '/expenses' },
      { id: 'investments',     label: 'Investments',     icon: TrendingUp, path: '/investments' },
      { id: 'assets-purchase', label: 'Assets Purchase', icon: Hammer,     path: '/assets-purchase' }
    ]
  },
  {
    id: 'people',
    label: 'PEOPLE',
    items: [
      { id: 'customers', label: 'Customers', icon: Users, path: '/customers' }
    ]
  },
  {
    id: 'reports',
    label: 'REPORTS',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3,       path: '/reports' },
      { id: 'excel',   label: 'Excel',   icon: FileSpreadsheet, path: '/excel' }
    ]
  },
  {
    id: 'personal',
    label: 'PERSONAL',
    items: [
      { id: 'resume', label: 'Resume', icon: FileText, path: '/resume' }
    ]
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      { id: 'alerts',        label: 'Alerts',        icon: Bell,     path: '/alerts' },
      { id: 'audit-history', label: 'Audit History', icon: History,  path: '/audit-history' },
      { id: 'settings',      label: 'Settings',      icon: Settings, path: '/settings' }
    ]
  }
];

export const ALL_MENU_ITEMS = MENU_SECTIONS.flatMap(s => s.items);

export const getUserData = () => {
  try {
    const saved = localStorage.getItem('businessUser');
    if (!saved) return { name: 'Business Owner', email: 'owner@racharuchi.com' };
    const user = JSON.parse(saved);
    if (!user.name && user.email) {
      const username = user.email.split('@')[0];
      user.name = username.charAt(0).toUpperCase() + username.slice(1);
    }
    return user;
  } catch {
    return { name: 'Business Owner', email: 'owner@racharuchi.com' };
  }
};

export const getUserInitials = (userData) => {
  if (userData.name) {
    return userData.name.trim().split(' ')
      .map(w => w[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'BO';
  }
  return userData.email?.[0]?.toUpperCase() || 'BO';
};

export const getActivePageId = (pathname) =>
  ALL_MENU_ITEMS.find(item => item.path === pathname)?.id || 'dashboard';

export const getCurrentPageLabel = (pathname) =>
  ALL_MENU_ITEMS.find(item => item.path === pathname)?.label || 'Dashboard';