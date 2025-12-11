// js/app.js - FUNÇÕES DA APLICAÇÃO E SIMULADOS

// Variáveis globais
let currentUser = null;
let simuladosData = [];

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 App.js carregado');
  
  // Aguardar inicialização do Supabase
  setTimeout(() => {
    if (window.supabase) {
      initializeAppFeatures();
    } else {
      console.error('Supabase não inicializado');
    }
  }, 500);
});

// Inicializar funcionalidades da app
function initializeAppFeatures() {
  console.log('🚀 Inicializando funcionalidades...');
  
  // Obter usuário atual
  currentUser = getCurrentUser();
  
  // Configurar botões e eventos
  setupButtons();
  setupSimuladosEvents();
  setupCardsEvents();
  
  // Verificar e carregar conteúdo conforme a seção ativa
  checkActiveSection();
}

// Configurar botões principais
function setupButtons() {
  console.log('🔘 Configurando botões...');
  
  // Botão "Começar Agora" no hero
  const heroBtn = document.querySelector('.hero .btn-primary');
  if (heroBtn) {
    heroBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentUser) {
        showSection('certificacoes');
      } else {
        openAuthModal('register');
      }
    });
  }
  
  // Botão "Upload" na seção de simulados
  const uploadBtn = document.querySelector('.simulado-card .btn[onclick*="openUploadModal"]');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openUploadModal();
    });
  }
  
  // Botão "Ver Simulados" (modal)
  const showSimuladosBtn = document.querySelector('.show-simulados-btn');
  if (showSimuladosBtn) {
    showSimuladosBtn.addEventListener('click', function(e) {
      e.preventDefault();
      abrirModalSimulados();
    });
  }
  
  // Botão "Nova Discussão" no fórum
  const newPostBtn = document.querySelector('.new-post-btn');
  if (newPostBtn) {
    newPostBtn.addEventListener('click', function(e) {
      e.preventDefault();
      createNewPost();
    });
  }
}

// Configurar eventos dos simulados
function setupSimuladosEvents() {
  console.log('🎯 Configurando eventos de simulados...');
  
  // Botões "Iniciar Simulado"
  document.querySelectorAll('.simulado-card .btn-primary').forEach(btn => {
    if (!btn.onclick) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const card = this.closest('.simulado-card');
        const title = card.querySelector('h3')?.textContent || 'Simulado';
        startSimulado(title);
      });
    }
  });
  
  // Botão de upload de arquivo
  const fileUpload = document.getElementById('fileUpload');
  if (fileUpload) {
    fileUpload.addEventListener('change', handleFileUpload);
  }
}

// Configurar eventos dos cards
function setupCardsEvents() {
  // Cards de certificações na home
  document.querySelectorAll('.cert-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = this.closest('.cert-card');
      const certName = card.querySelector('h3')?.textContent || 'Certificação';
      alert(`Iniciando estudos para: ${certName}`);
      // Aqui você pode redirecionar para página de estudos
    });
  });
  
  // Cards de materiais
  document.querySelectorAll('.material-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = this.closest('.material-card');
      const materialName = card.querySelector('h3')?.textContent || 'Material';
      alert(`Acessando: ${materialName}`);
    });
  });
}

// Verificar qual seção está ativa e carregar conteúdo
function checkActiveSection() {
  const activeSection = document.querySelector('.main-content.active');
  if (activeSection) {
    const sectionId = activeSection.id;
    loadSectionData(sectionId);
  }
}

// Carregar dados da seção
function loadSectionData(sectionId) {
  console.log(`📂 Carregando dados da seção: ${sectionId}`);
  
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
    default:
      // Home - já carregado
      break;
  }
}

// ==================== FUNÇÕES DE SIMULADOS ====================

// Abrir modal de simulados
window.abrirModalSimulados = function() {
  console.log('📋 Abrindo modal de simulados...');
  
  const modal = document.getElementById('modalSimulados');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
    
    // Carregar lista de simulados se necessário
    if (simuladosData.length === 0) {
      loadSimuladosList();
    }
  } else {
    console.error('Modal de simulados não encontrado!');
  }
};

// Fechar modal de simulados
window.fecharModalSimulados = function() {
  const modal = document.getElementById('modalSimulados');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
};

// Carregar lista de simulados do banco
async function loadSimuladosList() {
  try {
    console.log('📥 Carregando lista de simulados...');
    
    const { data, error } = await window.supabase
      .from('simulados')
      .select(`
        *,
        certificacao:certificacoes(nome, fornecedor)
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    simuladosData = data || [];
    updateSimuladosModal(data);
    
  } catch (error) {
    console.error('Erro ao carregar simulados:', error);
  }
}

// Atualizar modal com lista de simulados
function updateSimuladosModal(simulados) {
  const simuladosList = document.getElementById('simuladosList');
  if (!simuladosList) return;
  
  if (!simulados || simulados.length === 0) {
    simuladosList.innerHTML = `
      <div class="simulado-item-modal">
        <div class="simulado-info">
          <i class="fas fa-info-circle status-icon"></i>
          <span class="simulado-nome">Nenhum simulado disponível no momento</span>
        </div>
      </div>
    `;
    return;
  }
  
  simuladosList.innerHTML = simulados.map(simulado => `
    <div class="simulado-item-modal">
      <div class="simulado-info">
        <i class="fas fa-check-circle status-icon status-disponivel"></i>
        <span class="simulado-nome">
          <strong>${simulado.nome}</strong>
          ${simulado.certificacao ? `<br><small>${simulado.certificacao.nome}</small>` : ''}
        </span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="startSimulado('${simulado.id}')">
        Iniciar
      </button>
    </div>
  `).join('');
}

// Iniciar um simulado
window.startSimulado = function(simuladoIdOrTitle) {
  if (!currentUser) {
    alert('Você precisa estar logado para fazer simulados');
    openAuthModal('login');
    return;
  }
  
  console.log(`🎮 Iniciando simulado: ${simuladoIdOrTitle}`);
  
  // Aqui você pode:
  // 1. Redirecionar para uma página de simulado específica
  // 2. Abrir um modal com o simulado
  // 3. Carregar questões dinamicamente
  
  alert(`Simulado "${simuladoIdOrTitle}" iniciado! (Funcionalidade em desenvolvimento)`);
  
  // Exemplo de redirecionamento:
  // window.location.href = `simulado.html?id=${simuladoIdOrTitle}`;
};

// Abrir modal de upload
window.openUploadModal = function() {
  if (!currentUser) {
    alert('Você precisa estar logado para enviar simulados');
    openAuthModal('login');
    return;
  }
  
  // Criar modal de upload dinamicamente
  let modal = document.getElementById('modalUpload');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalUpload';
    modal.className = 'modal-upload';
    modal.innerHTML = `
      <div class="auth-container" style="max-width: 500px;">
        <button class="close-auth-modal" onclick="closeUploadModal()">&times;</button>
        <div class="auth-header">
          <h2><i class="fas fa-cloud-upload-alt"></i> Enviar Simulado</h2>
          <p>Compartilhe seu simulado com a comunidade</p>
        </div>
        
        <div class="auth-form active">
          <div id="uploadMessage" class="message"></div>
          
          <div class="form-group">
            <label for="simuladoNome">Nome do Simulado *</label>
            <input type="text" id="simuladoNome" placeholder="Ex: Simulado ITIL 4 - Prática 1">
          </div>
          
          <div class="form-group">
            <label for="simuladoDescricao">Descrição</label>
            <textarea id="simuladoDescricao" placeholder="Descreva o conteúdo do simulado..." rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="simuladoCertificacao">Certificação Relacionada</label>
            <select id="simuladoCertificacao">
              <option value="">Selecione uma certificação</option>
              <option value="ITIL 4">ITIL 4 Foundation</option>
              <option value="LPIC-1">LPIC-1</option>
              <option value="Security+">Security+</option>
              <option value="AWS">AWS Cloud Practitioner</option>
              <option value="Azure">Azure Fundamentals</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="simuladoQuestoes">Número de Questões</label>
            <input type="number" id="simuladoQuestoes" min="1" max="100" value="20">
          </div>
          
          <div class="form-group">
            <label for="simuladoArquivo">Arquivo HTML *</label>
            <input type="file" id="simuladoArquivo" accept=".html,.htm" style="padding: 8px;">
            <small>Envie um arquivo HTML com o simulado</small>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="simuladoTermos">
              Concordo com os <a href="#" onclick="alert('Termos de uso em desenvolvimento')">termos de uso</a>
            </label>
          </div>
          
          <button class="btn btn-success" onclick="enviarSimulado()" style="width: 100%;">
            <i class="fas fa-upload"></i> Enviar Simulado
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
};

// Fechar modal de upload
window.closeUploadModal = function() {
  const modal = document.getElementById('modalUpload');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
};

// Enviar simulado
window.enviarSimulado = async function() {
  const nome = document.getElementById('simuladoNome')?.value.trim();
  const descricao = document.getElementById('simuladoDescricao')?.value.trim();
  const certificacao = document.getElementById('simuladoCertificacao')?.value;
  const questoes = document.getElementById('simuladoQuestoes')?.value;
  const arquivo = document.getElementById('simuladoArquivo')?.files[0];
  const termos = document.getElementById('simuladoTermos')?.checked;
  const messageEl = document.getElementById('uploadMessage');
  
  // Validação
  if (!nome) {
    showUploadMessage('Digite o nome do simulado', 'error');
    return;
  }
  
  if (!arquivo) {
    showUploadMessage('Selecione um arquivo HTML', 'error');
    return;
  }
  
  if (!termos) {
    showUploadMessage('Aceite os termos de uso', 'error');
    return;
  }
  
  if (arquivo.type !== 'text/html' && !arquivo.name.endsWith('.html') && !arquivo.name.endsWith('.htm')) {
    showUploadMessage('O arquivo deve ser HTML (.html ou .htm)', 'error');
    return;
  }
  
  try {
    showUploadMessage('Enviando simulado...', 'loading');
    
    // Aqui você implementaria o upload real
    // Por enquanto, vamos simular
    
    setTimeout(() => {
      showUploadMessage('Simulado enviado com sucesso! Em análise.', 'success');
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        closeUploadModal();
      }, 2000);
    }, 1500);
    
  } catch (error) {
    console.error('Erro ao enviar simulado:', error);
    showUploadMessage('Erro ao enviar simulado', 'error');
  }
};

// Manipular upload de arquivo
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
    alert('Por favor, selecione um arquivo HTML (.html ou .htm)');
    event.target.value = '';
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    alert('O arquivo é muito grande. Máximo: 5MB');
    event.target.value = '';
    return;
  }
  
  console.log('Arquivo selecionado:', file.name, file.size, 'bytes');
  // Aqui você pode fazer o preview ou upload
};

// Mostrar mensagem no upload
function showUploadMessage(message, type = 'info') {
  const messageEl = document.getElementById('uploadMessage');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Estilizar conforme tipo
    const colors = {
      error: '#e74c3c',
      success: '#27ae60',
      loading: '#3498db',
      info: '#666'
    };
    messageEl.style.color = colors[type] || '#666';
  }
}

// ==================== FUNÇÕES DO FÓRUM ====================

// Criar nova postagem
window.createNewPost = function() {
  if (!currentUser) {
    alert('Você precisa estar logado para criar uma discussão');
    openAuthModal('login');
    return;
  }
  
  alert('Funcionalidade de criar postagem em desenvolvimento');
  // Aqui você pode abrir um modal para criar postagem
};

// Carregar posts do fórum
async function loadForumPosts() {
  try {
    const { data, error } = await window.supabase
      .from('forum_posts')
      .select(`
        *,
        usuario:usuarios(nome, foto_url),
        categoria:forum_categorias(nome, icone)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    updateForumPosts(data);
    
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
  }
}

// Atualizar posts do fórum na UI
function updateForumPosts(posts) {
  const forumPosts = document.getElementById('forumPosts');
  if (!forumPosts || !posts) return;
  
  if (posts.length === 0) {
    forumPosts.innerHTML = `
      <div class="post">
        <div class="post-header">
          <div class="post-title">Nenhuma discussão encontrada</div>
        </div>
        <div class="post-excerpt">
          <p>Seja o primeiro a iniciar uma discussão!</p>
        </div>
      </div>
    `;
    return;
  }
  
  forumPosts.innerHTML = posts.map(post => `
    <div class="post">
      <div class="post-header">
        <a href="#" class="post-title">${post.titulo}</a>
        <div class="post-meta">
          por ${post.usuario?.nome || 'Usuário'} • ${formatDate(post.created_at)}
        </div>
      </div>
      <div class="post-excerpt">
        <p>${post.conteudo?.substring(0, 150) || 'Sem conteúdo'}...</p>
      </div>
      <div class="post-footer">
        <span><i class="far fa-comment"></i> ${post.respostas || 0} respostas</span>
        <span><i class="far fa-eye"></i> ${post.visualizacoes || 0} visualizações</span>
      </div>
    </div>
  `).join('');
}

// ==================== FUNÇÕES DE CERTIFICAÇÕES ====================

// Carregar certificações
async function loadCertificacoes() {
  try {
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('*')
      .eq('ativo', true)
      .order('categoria')
      .order('nome');
    
    if (error) throw error;
    
    console.log('Certificações carregadas:', data?.length || 0);
    
  } catch (error) {
    console.error('Erro ao carregar certificações:', error);
  }
}

// ==================== FUNÇÕES DE MATERIAIS ====================

// Carregar materiais
async function loadMateriais() {
  try {
    const { data, error } = await window.supabase
      .from('materiais')
      .select(`
        *,
        usuario:usuarios(nome)
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false })
      .limit(12);
    
    if (error) throw error;
    
    console.log('Materiais carregados:', data?.length || 0);
    
  } catch (error) {
    console.error('Erro ao carregar materiais:', error);
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

// Formatar data
function formatDate(dateString) {
  if (!dateString) return 'Data desconhecida';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} h atrás`;
  if (diffDays < 7) return `${diffDays} dias atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

// Obter usuário atual
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('studyCertUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

// Carregar simulados
async function loadSimulados() {
  try {
    console.log('📚 Carregando simulados...');
    
    const { data, error } = await window.supabase
      .from('simulados')
      .select(`
        *,
        certificacao:certificacoes(nome, fornecedor)
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    simuladosData = data || [];
    console.log(`✅ ${simuladosData.length} simulados carregados`);
    
  } catch (error) {
    console.error('Erro ao carregar simulados:', error);
  }
}
