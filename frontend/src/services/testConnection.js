import api from './api';

export const testBackendConnection = async () => {
  try {
    console.log('🔍 Probando conexión con backend...');
    
    const healthResponse = await api.get('/health');
    console.log('✅ Health Check:', healthResponse.data);
    
    const dbResponse = await api.get('/test-db');
    console.log('✅ Database Test:', dbResponse.data);
    
    return { success: true, health: healthResponse.data, db: dbResponse.data };
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return { success: false, error: error.message };
  }
};