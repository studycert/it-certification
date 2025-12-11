// config.js
export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL || 'https://seu-id.supabase.co',
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-publica',
  
  // Configurações do seu app
  APP_NAME: 'StudyCert',
  APP_VERSION: '1.0.0',
  
  // Configurações de storage
  STORAGE_BUCKET: 'material',
  
  // Configurações de paginação
  ITEMS_PER_PAGE: {
    MATERIAIS: 12,
    SIMULADOS: 10,
    FORUM_POSTS: 20,
    COMENTARIOS: 15
  }
};
