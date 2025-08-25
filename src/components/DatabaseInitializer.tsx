import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check server health
        await apiService.healthCheck();
        setIsConnected(true);
        
        // Initialize database with sample data if needed
        await apiService.initializeDatabase();
        
        console.log('✅ Database initialization completed');
      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connecting to MongoDB Atlas...</h2>
          <p className="text-gray-500">Please wait while we establish the database connection.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connection Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400 mb-4">Make sure the backend server is running on port 3001</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Database Not Connected</h2>
          <p className="text-gray-500">Unable to connect to MongoDB Atlas.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DatabaseInitializer; 