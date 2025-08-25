import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AdminView = 'dashboard' | 'wingA' | 'wingB';

interface AdminViewContextType {
  view: AdminView;
  setView: (view: AdminView) => void;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export const useAdminView = () => {
  const context = useContext(AdminViewContext);
  if (!context) {
    throw new Error('useAdminView must be used within an AdminViewProvider');
  }
  return context;
};

export const AdminViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<AdminView>('dashboard');
  return (
    <AdminViewContext.Provider value={{ view, setView }}>
      {children}
    </AdminViewContext.Provider>
  );
}; 