// js/auth.js - FUNÇÕES DE AUTENTICAÇÃO

// Abrir modal de autenticação
window.openAuthModal = function(tab = 'login') {
  console.log('🔑 Abrindo modal de autenticação, tab:', tab);
  
  // Verificar se modal já existe
  let modal = document.getElementById('modalAuth');
  
  if (!modal) {
    console.log('Criando modal de auth...');
    // Criar modal dinamicamente
    modal = document.createElement('div');
    modal.id = 'modalAuth';
    modal.className = 'modal-auth';
    modal.innerHTML = `
      <div class="auth-container">
        <button class="close-auth-modal" onclick="closeAuthModal()">&times;</button>
        <div class="auth-header">
          <h2>Study<span style="color: #3498db;">Cert</span></h2>
          <p>Sua jornada começa aqui</p>
        </div>
        <div class="auth-tabs">
          <div class="auth-tab active" data-tab="login">Entrar</div>
          <div class="auth-tab" data-tab="register">Cadastrar</div>
        </div>
        
        <div id="loginForm" class="auth-form active">
          <div id="loginMessage" class="message"></div>
          <div class="form-group">
            <label for="loginEmail">E-mail</label>
            <input type="email" id="loginEmail" placeholder="seu@email.com">
          </div>
          <div class="form-group">
            <label for="loginPassword">Senha</label>
            <input type="password" id="loginPassword" placeholder="Sua senha">
          </div>
          <button class="btn btn-primary" onclick="login()" style="width: 100%;">Entrar</button>
          <div class="auth-footer">
            <p>Esqueceu sua senha? <a href="#" onclick="forgotPassword()">Redefinir senha</a></p>
          </div>
        </div>
        
        <div id="registerForm" class="auth-form">
          <div id="registerMessage" class="message"></div>
          <div class="form-group">
            <label for="registerName">Nome Completo</label>
            <input type="text" id="registerName" placeholder="Seu nome completo">
          </div>
          <div class="form-group">
            <label for="registerEmail">E-mail</label>
            <input type="email" id="registerEmail" placeholder="seu@email.com">
          </div>
          <div class="form-group">
            <label for="registerPassword">Senha</label>
            <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres">
          </div>
          <button class="btn btn-success" onclick="register()" style="width: 100%;">Criar Conta</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Configurar eventos dos tabs
    setTimeout(() => {
      document.querySelectorAll('.auth-tab').forEach(tabEl => {
        tabEl.addEventListener('click', function() {
          const tabName = this.getAttribute('data-tab');
          switchAuthTab(tabName);
        });
      });
    }, 100);
  }
  
  // Mostrar modal
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
  
  // Ativar tab selecionada
  switchAuthTab(tab);
};

// Fechar modal de autenticação
window.closeAuthModal = function() {
  const modal = document.getElementById('modalAuth');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  
  // Limpar formulários
  const inputs = ['loginEmail', 'loginPassword', 'registerName', 'registerEmail', 'registerPassword'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
  
  // Limpar mensagens
  const messages = ['loginMessage', 'registerMessage'];
  messages.forEach(id => {
    const msg = document.getElementById(id);
    if (msg) {
      msg.textContent = '';
      msg.style.display = 'none';
    }
  });
};

// Alternar entre tabs de login/cadastro
function switchAuthTab(tabName) {
  // Desativar todas as tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Esconder todos os formulários
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  
  // Ativar tab selecionada
  const activeTab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
  if (activeTab) activeTab.classList.add('active');
  
  // Mostrar formulário correspondente
  const activeForm = document.getElementById(`${tabName}Form`);
  if (activeForm) {
    activeForm.classList.add('active');
  }
}

// Função de login
window.login = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const messageEl = document.getElementById('loginMessage');
  
  // Validação
  if (!email || !password) {
    showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showAuthMessage(messageEl, 'E-mail inválido', 'error');
    return;
  }
  
  try {
    showAuthMessage(messageEl, 'Entrando...', 'loading');
    
    // Login no Supabase
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Buscar perfil do usuário
    const { data: userProfile, error: profileError } = await window.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    let userData = {
      id: data.user.id,
      email: data.user.email,
      nome: data.user.user_metadata?.name || email.split('@')[0]
    };
    
    // Se não encontrou perfil, criar um
    if (profileError || !userProfile) {
      console.log('Criando novo perfil para usuário...');
      const { error: insertError } = await window.supabase
        .from('usuarios')
        .insert({
          id: data.user.id,
          email: email,
          nome: userData.nome,
          nivel_experiencia: 'iniciante',
          status: 'ativo',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.warn('Erro ao criar perfil:', insertError);
      }
    } else {
      // Combinar dados do perfil existente
      userData = { ...userData, ...userProfile };
    }
    
    // Atualizar last_login
    await window.supabase
      .from('usuarios')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);
    
    // Salvar no localStorage
    localStorage.setItem('studyCertUser', JSON.stringify(userData));
    
    showAuthMessage(messageEl, 'Login realizado com sucesso!', 'success');
    
    // Recarregar a página após 1 segundo
    setTimeout(() => {
      closeAuthModal();
      location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Erro no login:', error);
    
    let errorMessage = 'Erro ao fazer login';
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'E-mail ou senha incorretos';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Confirme seu e-mail antes de fazer login';
    }
    
    showAuthMessage(messageEl, errorMessage, 'error');
  }
};

// Função de cadastro
window.register = async function() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const messageEl = document.getElementById('registerMessage');
  
  // Validação
  if (!name || !email || !password) {
    showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showAuthMessage(messageEl, 'E-mail inválido', 'error');
    return;
  }
  
  if (password.length < 6) {
    showAuthMessage(messageEl, 'A senha deve ter no mínimo 6 caracteres', 'error');
    return;
  }
  
  try {
    showAuthMessage(messageEl, 'Criando conta...', 'loading');
    
    // Cadastro no Supabase
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name }
      }
    });
    
    if (error) throw error;
    
    // Criar perfil na tabela usuarios
    const { error: profileError } = await window.supabase
      .from('usuarios')
      .insert({
        id: data.user.id,
        email: email,
        nome: name,
        nivel_experiencia: 'iniciante',
        status: 'ativo',
        created_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.warn('Erro ao criar perfil:', profileError);
    }
    
    showAuthMessage(messageEl, 
      data.user.identities?.length === 0 
        ? 'Conta criada! Faça login para continuar.' 
        : 'Conta criada com sucesso! Verifique seu e-mail.', 
      'success');
    
    // Se o usuário foi criado automaticamente, fazer login
    if (data.user && !data.session) {
      setTimeout(() => {
        closeAuthModal();
        // Alternar para tab de login
        openAuthModal('login');
      }, 2000);
    }
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    
    let errorMessage = 'Erro ao criar conta';
    if (error.message.includes('already registered')) {
      errorMessage = 'Este e-mail já está cadastrado';
    } else if (error.message.includes('password')) {
      errorMessage = 'A senha é muito fraca';
    }
    
    showAuthMessage(messageEl, errorMessage, 'error');
  }
};

// Função de logout
window.logout = async function() {
  try {
    // Logout do Supabase
    await window.supabase.auth.signOut();
    
    // Remover dados locais
    localStorage.removeItem('studyCertUser');
    
    console.log('✅ Logout realizado');
    
    // Recarregar página
    location.reload();
    
  } catch (error) {
    console.error('Erro no logout:', error);
    alert('Erro ao sair da conta');
  }
};

// Função de recuperação de senha
window.forgotPassword = function() {
  const email = prompt('Digite seu e-mail para redefinir a senha:');
  if (email && isValidEmail(email)) {
    window.supabase.auth.resetPasswordForEmail(email)
      .then(({ error }) => {
        if (error) {
          alert('Erro: ' + error.message);
        } else {
          alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
          closeAuthModal();
        }
      });
  } else if (email) {
    alert('E-mail inválido');
  }
};

// Funções auxiliares
function showAuthMessage(element, message, type = 'info') {
  if (!element) return;
  
  element.textContent = message;
  element.style.display = 'block';
  element.className = 'message';
  
  switch(type) {
    case 'error':
      element.style.color = '#e74c3c';
      element.style.backgroundColor = '#fee';
      element.style.border = '1px solid #fcc';
      break;
    case 'success':
      element.style.color = '#27ae60';
      element.style.backgroundColor = '#efe';
      element.style.border = '1px solid #cfc';
      break;
    case 'loading':
      element.style.color = '#3498db';
      element.style.backgroundColor = '#eef';
      element.style.border = '1px solid #cce';
      break;
    default:
      element.style.color = '#666';
      element.style.backgroundColor = '#f5f5f5';
      element.style.border = '1px solid #ddd';
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
