// ============================================
// SISTEMA DE VIDEOAULAS - SUPABASE
// ============================================

// Configurações
const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';

// Variáveis globais
let supabaseClient = null;
let currentUser = null;
let currentVideo = null;
let currentUploadFile = null;
let uploadedVideoUrl = null;

// Categorias de videoaulas
const videoCategories = {
    'itil': { name: 'ITIL 4', icon: 'fas fa-cube', color: '#3498db' },
    'linux': { name: 'LPIC-1/LPIC-2', icon: 'fas fa-server', color: '#333333' },
    'aws': { name: 'AWS', icon: 'fab fa-aws', color: '#ff9900' },
    'azure': { name: 'Azure', icon: 'fab fa-microsoft', color: '#0078d4' },
    'security': { name: 'Security+', icon: 'fas fa-shield-alt', color: '#ff6b6b' },
    'ccna': { name: 'CCNA', icon: 'fas fa-network-wired', color: '#00a0d2' },
    'outros': { name: 'Outros', icon: 'fas fa-video', color: '#95a5a6' }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando sistema de videoaulas...');
    
    // Inicializar Supabase
    await initSupabase();
    
    // Atualizar interface de autenticação
    updateAuthUI();
    
    // Carregar estatísticas
    await loadVideoStats();
    
    // Carregar videoaulas
    await loadVideos();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('✅ Sistema de videoaulas inicializado');
});

// Inicializar Supabase
async function initSupabase() {
    try {
        if (window.authManager && window.authManager.getSupabase()) {
            supabaseClient = window.authManager.getSupabase();
            currentUser = window.authManager.getUser();
            console.log('✅ Usando Supabase do authManager');
        } else {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: true }
            });
            
            // Verificar sessão
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
            }
            console.log('✅ Criado novo cliente Supabase');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
    }
}

// Atualizar interface de autenticação
function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const authContainer = document.getElementById('authContainer');
    const uploadSection = document.getElementById('uploadSection');
    
    if (!window.authManager) {
        authStatus.innerHTML = '<i class="fas fa-user"></i> Autenticação';
        return;
    }
    
    if (window.authManager.isAuthenticated()) {
        const user = window.authManager.getUser();
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        
        authStatus.innerHTML = `
            <i class="fas fa-user-circle" style="color: #27ae60;"></i>
            <span style="margin-left: 0.5rem;">${userName}</span>
        `;
        
        authContainer.innerHTML = `
            <button onclick="logoutFromVideos()" class="btn btn-outline btn-sm">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        `;
        
        // Mostrar seção de upload para usuários autenticados
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    } else {
        authStatus.innerHTML = `
            <i class="fas fa-user" style="color: #95a5a6;"></i>
            <span style="margin-left: 0
