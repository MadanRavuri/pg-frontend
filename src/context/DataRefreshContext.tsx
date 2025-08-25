import React, { createContext, useContext, useState, useCallback } from 'react';

interface DataRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  refreshTenants: () => void;
  refreshRooms: () => void;
  refreshExpenses: () => void;
  refreshRentPayments: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

interface DataRefreshProviderProps {
  children: React.ReactNode;
}

export const DataRefreshProvider: React.FC<DataRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const refreshTenants = useCallback(() => {
    console.log('Triggering tenants refresh');
    triggerRefresh();
  }, [triggerRefresh]);

  const refreshRooms = useCallback(() => {
    console.log('Triggering rooms refresh');
    triggerRefresh();
  }, [triggerRefresh]);

  const refreshExpenses = useCallback(() => {
    console.log('Triggering expenses refresh');
    triggerRefresh();
  }, [triggerRefresh]);

  const refreshRentPayments = useCallback(() => {
    console.log('Triggering rent payments refresh');
    triggerRefresh();
  }, [triggerRefresh]);

  return (
    <DataRefreshContext.Provider value={{
      refreshTrigger,
      triggerRefresh,
      refreshTenants,
      refreshRooms,
      refreshExpenses,
      refreshRentPayments,
    }}>
      {children}
    </DataRefreshContext.Provider>
  );
};
