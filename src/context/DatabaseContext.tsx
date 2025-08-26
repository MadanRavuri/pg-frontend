import React, { createContext, useContext, ReactNode } from 'react';
// import { TenantService } from '../services/tenantService';


// No backend services, so DatabaseContextType is an empty object for now
type DatabaseContextType = {};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const value: DatabaseContextType = {
    // Only API-based services should be provided here.
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 