// js/supabase_setup.js
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar cliente Supabase
  window.supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.URL,
    window.SUPABASE_CONFIG.ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log('✅ Supabase inicializado');
  
  // Verificar conexão com o banco
  checkConnection();
});

async function checkConnection() {
  try {
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Conexão com banco estabelecida');
    
    // Inicializar autenticação
    checkAuth();
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    showConnectionError();
  }
}

function checkAuth() {
  const user = getCurrentUser();
  if (user) {
    updateAuthUI(user);
    loadUserProgress();
  } else {
    showLoginButtons();
  }
}

function getCurrentUser() {
  const userData = localStorage.getItem('studyCertUser');
  return userData ? JSON.parse(userData) : null;
}

function updateAuthUI(user) {
  const authButtons = document.getElementById('authButtons');
  if (!authButtons) return;
  
  authButtons.innerHTML = `
    <div class="user-menu">
      <span class="user-name">${user.nome || user.email}</span>
      <button class="btn btn-outline" onclick="logout()">Sair</button>
    </div>
  `;
  
  // Mostrar área de progresso
  const userProgress = document.getElementById('userProgress');
  if (userProgress) userProgress.style.display = 'block';
}

function showLoginButtons() {
  const authButtons = document.getElementById('authButtons');
  if (!authButtons) return;
  
  authButtons.innerHTML = `
    <button class="btn btn-outline" onclick="openAuthModal('login')">Entrar</button>
    <button class="btn btn-primary" onclick="openAuthModal('register')">Cadastrar</button>
  `;
}

function showConnectionError() {
  // Pode mostrar um alerta sutil para o usuário
  console.warn('Verifique sua conexão com a internet');
}
