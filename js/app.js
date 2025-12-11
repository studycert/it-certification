// js/app.js
document.addEventListener('DOMContentLoaded', function() {
  // Configurar navegação
  setupNavigation();
  
  // Configurar eventos dos formulários
  setupAuthTabs();
  
  // Fechar modal ao clicar fora
  setupModalClose();
  
  // Carregar dados iniciais
  if (window.supabase) {
    loadInitialData();
  } else {
    console.error('Supabase não inicializado');
  }
});

function setupNavigation() {
  // Navegação entre seções
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      
      // Remover classe active de todos os links
      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
      });
      
      // Adicionar classe active ao link clicado
      this.classList.add('active');
      
      // Esconder todos os conteúdos
      document.querySelectorAll('.main-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Mostrar conteúdo selecionado
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Carregar dados específicos da seção
        if (target === 'certificacoes') loadCertificacoes();
        if (target === 'forum') loadForum();
        if (target === 'materiais') loadMateriais();
        if (target === 'simulados') loadSimulados();
      }
    });
  });
  
  // Links do footer também navegam
  document.querySelectorAll('footer [data-target]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
      if (navLink) navLink.click();
    });
  });
}

function setupAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Ativar tab
      document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
      });
      this.classList.add('active');
      
      // Mostrar formulário correspondente
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
      });
      document.getElementById(`${tabName}Form`).classList.add('active');
    });
  });
}

function setupModalClose() {
  const modal = document.getElementById('modalAuth');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAuthModal();
      }
    });
  }
}

async function loadInitialData() {
  // Verificar se usuário está logado
  const user = localStorage.getItem('studyCertUser');
  if (user) {
    const userData = JSON.parse(user);
    await loadUserProgress(userData.id);
  }
  
  // Carregar certificações para a home
  await loadCertificacoesHome();
}

async function loadUserProgress(userId) {
  try {
    const { data, error } = await window.supabase
      .from('progresso_usuario')
      .select(`
        *,
        certificacao:certificacoes(nome, nivel)
      `)
      .eq('usuario_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      updateProgressUI(data);
    }
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
  }
}

function updateProgressUI(progressData) {
  const progressElement = document.getElementById('userProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (!progressElement || !progressFill || !progressText) return;
  
  // Calcular progresso médio
  const totalProgress = progressData.reduce((sum, item) => sum + item.progresso_percentual, 0);
  const avgProgress = Math.round(totalProgress / progressData.length);
  
  // Atualizar UI
  progressFill.style.width = `${avgProgress}%`;
  progressText.textContent = `Progresso médio: ${avgProgress}% (${progressData.length} certificações)`;
  progressElement.style.display = 'block';
}

async function loadCertificacoesHome() {
  try {
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('*')
      .eq('ativo', true)
      .order('popularidade', { ascending: false })
      .limit(4);
    
    if (error) throw error;
    
    // Atualizar cards da home se existirem
    updateHomeCertifications(data);
  } catch (error) {
    console.error('Erro ao carregar certificações:', error);
  }
}

function updateHomeCertifications(certificacoes) {
  // Esta função pode atualizar os cards da home com dados reais
  // Por enquanto, mantemos os cards estáticos
}

async function loadCertificacoes() {
  try {
    const { data, error } = await window.supabase
      .from('certificacoes')
      .select('*')
      .eq('ativo', true)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });
    
    if (error) throw error;
    
    // Aqui você pode atualizar a seção de certificações com dados reais
    console.log('Certificações carregadas:', data.length);
  } catch (error) {
    console.error('Erro ao carregar certificações:', error);
  }
}

async function loadForum() {
  try {
    // Carregar categorias do fórum
    const { data: categories, error: catError } = await window.supabase
      .from('forum_categorias')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    
    if (catError) throw catError;
    
    // Carregar posts recentes
    const { data: posts, error: postsError } = await window.supabase
      .from('forum_posts')
      .select(`
        *,
        usuario:usuarios(nome),
        categoria:forum_categorias(nome)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (postsError) throw postsError;
    
    updateForumUI(categories, posts);
  } catch (error) {
    console.error('Erro ao carregar fórum:', error);
  }
}

function updateForumUI(categories, posts) {
  // Atualizar lista de categorias
  const categoriesList = document.getElementById('forumCategories');
  if (categoriesList && categories) {
    categoriesList.innerHTML = categories.map(cat => `
      <li><a href="#">${cat.nome} <span class="category-count">${cat.total_posts || 0}</span></a></li>
    `).join('');
  }
  
  // Atualizar posts
  const postsContainer = document.getElementById('forumPosts');
  if (postsContainer && posts) {
    postsContainer.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-header">
          <a href="#" class="post-title">${post.titulo}</a>
          <div class="post-meta">por ${post.usuario?.nome || 'Usuário'} • ${formatDate(post.created_at)}</div>
        </div>
        <div class="post-excerpt">
          <p>${post.conteudo.substring(0, 150)}...</p>
        </div>
        <div class="post-footer">
          <span><i class="far fa-comment"></i> ${post.respostas || 0} respostas</span>
          <span><i class="far fa-eye"></i> ${post.visualizacoes || 0} visualizações</span>
        </div>
      </div>
    `).join('');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minutos atrás`;
  if (diffHours < 24) return `${diffHours} horas atrás`;
  if (diffDays < 7) return `${diffDays} dias atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

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
    
    // Aqui você pode atualizar a seção de materiais
    console.log('Materiais carregados:', data.length);
  } catch (error) {
    console.error('Erro ao carregar materiais:', error);
  }
}

async function loadSimulados() {
  try {
    const { data, error } = await window.supabase
      .from('simulados')
      .select(`
        *,
        certificacao:certificacoes(nome, fornecedor)
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Aqui você pode atualizar a seção de simulados
    console.log('Simulados carregados:', data.length);
  } catch (error) {
    console.error('Erro ao carregar simulados:', error);
  }
}

// Funções dos simulados
window.openUploadModal = function() {
  const user = localStorage.getItem('studyCertUser');
  if (!user) {
    alert('Você precisa estar logado para enviar simulados');
    openAuthModal('login');
    return;
  }
  
  // Mostrar área de upload
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) uploadArea.style.display = 'block';
};

window.uploadSimulado = function() {
  document.getElementById('fileUpload').click();
};

window.createNewPost = function() {
  const user = localStorage.getItem('studyCertUser');
  if (!user) {
    alert('Você precisa estar logado para criar uma discussão');
    openAuthModal('login');
    return;
  }
  
  // Aqui você pode implementar o modal para criar novo post
  alert('Funcionalidade de criar nova discussão em desenvolvimento');
};

window.openRegister = function() {
  openAuthModal('register');
};

// Funções do modal de simulados
window.abrirModalSimulados = function() {
  document.getElementById('modalSimulados').style.display = 'block';
};

window.fecharModalSimulados = function() {
  document.getElementById('modalSimulados').style.display = 'none';
};
