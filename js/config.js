// js/config.js
const SUPABASE_CONFIG = {
  URL: 'https://seu-id.supabase.co', // SUBSTITUA pelo seu Project URL
  ANON_KEY: 'sua-chave-anon-publica' // SUBSTITUA pelo seu anon public key
};

// Exportar para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('✅ Configuração do Supabase carregada');
