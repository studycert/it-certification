// js/config.js - CONFIGURAÇÕES DO SUPABASE
const SUPABASE_CONFIG = {
  URL: 'https://blnnwbrhrckqegaiparr.supabase.co',
  ANON_KEY: 'sb_publishable_BRAGtPaTnBQAys82wQlwDA_ZorIxDDK'
};

// Configurações da aplicação
const APP_CONFIG = {
  APP_NAME: 'StudyCert',
  VERSION: '1.0.0',
  ITEMS_PER_PAGE: {
    MATERIAIS: 12,
    SIMULADOS: 10,
    FORUM_POSTS: 20
  }
};

// Exportar para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.APP_CONFIG = APP_CONFIG;

console.log('✅ Config.js carregado com sucesso!');
