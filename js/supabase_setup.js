// supabase_setup.js
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config.js';

// Inicializar cliente Supabase
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'StudyCert'
      }
    }
  }
);

// Verificar conexão
export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexão com Supabase estabelecida');
    console.log('📊 Configurações do sistema:', data);
    
    return { connected: true, settings: data };
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message);
    return { connected: false, error: error.message };
  }
}

// Buscar configurações do sistema
export async function getSystemSettings() {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*');
  
  if (error) {
    console.error('Erro ao buscar configurações:', error);
    return {};
  }
  
  // Converter array em objeto
  return data.reduce((acc, item) => {
    acc[item.chave] = item.valor;
    return acc;
  }, {});
}
