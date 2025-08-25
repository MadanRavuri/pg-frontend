import React, { createContext, useContext, ReactNode } from 'react';
import { TenantService } from '../services/tenantService';
import { RoomService } from '../services/roomService';
import { RentPaymentService } from '../services/rentPaymentService';
import { ExpenseService } from '../services/expenseService';
import { SettingsService } from '../services/settingsService';

interface DatabaseContextType {
  tenantService: typeof TenantService;
  roomService: typeof RoomService;
  rentPaymentService: typeof RentPaymentService;
  expenseService: typeof ExpenseService;
  settingsService: typeof SettingsService;
}

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
    tenantService: TenantService,
    roomService: RoomService,
    rentPaymentService: RentPaymentService,
    expenseService: ExpenseService,
    settingsService: SettingsService,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 