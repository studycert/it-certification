// js/supabase_setup.js - INICIALIZAÇÃO DO SUPABASE
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando Supabase...');
  
  // Inicializar cliente Supabase
  try {
    window.supabase = window.supabase.createClient(
      window.SUPABASE_CONFIG.URL,
      window.SUPABASE_CONFIG.ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers: { 'x-application-name': 'StudyCert' }
        }
      }
    );
    
    console.log('✅ Supabase inicializado com sucesso');
    
    // Verificar conexão com banco
    checkDatabaseConnection();
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Supabase:', error);
    showError('Não foi possível conectar ao servidor');
  }
});

// Função para verificar conexão com banco
async function checkDatabaseConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      showError('Banco de dados não disponível');
      return;
    }
    
    console.log('✅ Conexão com banco estabelecida');
    
    // Carregar dados iniciais
    initializeApp();
    
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    showError('Erro de conexão');
  }
}

// Função principal para inicializar a aplicação
function initializeApp() {
  console.log('🚀 Inicializando aplicação StudyCert...');
  
  // 1. Verificar se usuário está logado
  checkAuthStatus();
  
  // 2. Configurar navegação
  setupNavigation();
  
  // 3. Configurar eventos dos modais
  setupModalEvents();
  
  // 4. Carregar conteúdo inicial
  loadInitialContent();
  
  // 5. Configurar botões de auth
  setupAuthButtons();
}

// Verificar status de autenticação
function checkAuthStatus() {
  const user = getCurrentUser();
  
  if (user) {
    console.log('👤 Usuário logado:', user.email);
    updateUIForLoggedInUser(user);
  } else {
    console.log('🔓 Usuário não logado');
    updateUIForGuest();
  }
}

// Obter usuário atual do localStorage
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('studyCertUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao ler usuário:', error);
    return null;
  }
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser(user) {
  const authButtons = document.getElementById('authButtons');
  if (!authButtons) return;
  
  authButtons.innerHTML = `
    <div class="user-info">
      <div class="user-avatar">
        ${user.nome ? user.nome.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
      </div>
      <span class="user-name">${user.nome || user.email.split('@')[0]}</span>
      <button class="btn btn-outline btn-sm" onclick="logout()">Sair</button>
    </div>
  `;
  
  // Mostrar área de upload de simulados
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) uploadArea.style.display = 'block';
  
  // Mostrar progresso do usuário
  const userProgress = document.getElementById('userProgress');
  if (userProgress) userProgress.style.display = 'block';
}

// Atualizar UI para visitante
function updateUIForGuest() {
  const authButtons = document.getElementById('authButtons');
  if (!authButtons) return;
  
  authButtons.innerHTML = `
    <button class="btn btn-outline" onclick="openAuthModal('login')">Entrar</button>
    <button class="btn btn-primary" onclick="openAuthModal('register')">Cadastrar</button>
  `;
  
  // Esconder área de upload
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) uploadArea.style.display = 'none';
}

// Configurar navegação
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      showSection(target);
    });
  });
  
  // Links do footer também navegam
  const footerLinks = document.querySelectorAll('footer [data-target]');
  footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      showSection(target);
    });
  });
}

// Mostrar seção específica
function showSection(sectionId) {
  // Esconder todas as seções
  document.querySelectorAll('.main-content').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remover active de todos os links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Mostrar seção alvo
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Ativar link correspondente
    const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Carregar conteúdo específico se necessário
    loadSectionContent(sectionId);
  }
}

// Carregar conteúdo da seção
function loadSectionContent(sectionId) {
  switch(sectionId) {
    case 'certificacoes':
      loadCertificacoes();
      break;
    case 'forum':
      loadForumPosts();
      break;
    case 'materiais':
      loadMateriais();
      break;
    case 'simulados':
      loadSimulados();
      break;
  }
}

// Configurar eventos dos modais
function setupModalEvents() {
  // Modal de auth - clicar fora fecha
  document.addEventListener('click', function(e) {
    const modalAuth = document.getElementById('modalAuth');
    if (modalAuth && e.target === modalAuth) {
      closeAuthModal();
    }
    
    const modalSimulados = document.getElementById('modalSimulados');
    if (modalSimulados && e.target === modalSimulados) {
      fecharModalSimulados();
    }
  });
  
  // Configurar tabs do modal de auth
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchAuthTab(tabName);
    });
  });
}

// Configurar botões de auth dinamicamente
function setupAuthButtons() {
  const loginBtn = document.querySelector('.btn[onclick*="openRegister"]');
  if (loginBtn) {
    loginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openAuthModal('register');
    });
  }
}

// Carregar conteúdo inicial
function loadInitialContent() {
  console.log('📦 Carregando conteúdo inicial...');
  
  // Verificar se já existe um usuário logado para carregar progresso
  const user = getCurrentUser();
  if (user) {
    loadUserProgress(user.id);
  }
  
  // Carregar algumas certificações para a home
  loadCertificacoesForHome();
}

// Funções auxiliares
function showError(message) {
  console.error('Erro:', message);
  // Pode implementar uma notificação visual aqui
}

// Carregar progresso do usuário
async function loadUserProgress(userId) {
  try {
    const { data, error } = await window.supabase
      .from('progresso_usuario')
      .select(`
        *,
        certificacao:certificacoes(nome, nivel)
      `)
      .eq('usuario_id', userId);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      updateProgressUI(data);
    }
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
  }
}

function updateProgressUI(progressData) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (!progressFill || !progressText) return;
  
  const totalProgress = progressData.reduce((sum, item) => sum + item.progresso_percentual, 0);
  const avgProgress = Math.round(totalProgress / progressData.length);
  
  progressFill.style.width = `${avgProgress}%`;
  progressText.textContent = `Progresso médio: ${avgProgress}% (${progressData.length} certificações)`;
}

// Carregar certificações para a home
async function loadCertificacoesForHome() {
  try {
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('*')
      .eq('ativo', true)
      .order('popularidade', { ascending: false })
      .limit(4);
    
    if (error) throw error;
    console.log('✅ Certificações carregadas para home:', data.length);
  } catch (error) {
    console.error('Erro ao carregar certificações:', error);
  }
}

// Funções globais (serão chamadas pelos botões)
window.showSection = showSection;
