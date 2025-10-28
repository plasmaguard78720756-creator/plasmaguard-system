// backend/test-register.js
const supabase = require('./config/database');

async function testTable() {
  try {
    console.log('🔍 Probando estructura de tabla users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accediendo a la tabla:', error);
    } else {
      console.log('✅ Tabla users accesible');
      console.log('Estructura:', data.length > 0 ? Object.keys(data[0]) : 'Tabla vacía');
    }
  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

testTable();