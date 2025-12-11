// js/auth.js
// Funções de autenticação
window.openAuthModal = function(tab = 'login') {
  const modal = document.getElementById('modalAuth');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  // Ativar tab selecionada
  document.querySelectorAll('.auth-tab').forEach(tabEl => {
    tabEl.classList.remove('active');
  });
  
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  
  const selectedTab = document.querySelector(`[data-tab="${tab}"]`);
  if (selectedTab) selectedTab.classList.add('active');
  
  const selectedForm = document.getElementById(`${tab}Form`);
  if (selectedForm) selectedForm.classList.add('active');
};

window.closeAuthModal = function() {
  const modal = document.getElementById('modalAuth');
  if (modal) modal.style.display = 'none';
  
  // Limpar formulários
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('registerName').value = '';
  document.getElementById('registerEmail').value = '';
  document.getElementById('registerPassword').value = '';
  
  // Limpar mensagens
  document.getElementById('loginMessage').textContent = '';
  document.getElementById('registerMessage').textContent = '';
};

window.login = async function() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const messageEl = document.getElementById('loginMessage');
  
  if (!email || !password) {
    messageEl.textContent = 'Preencha todos os campos';
    messageEl.style.color = 'red';
    return;
  }
  
  try {
    messageEl.textContent = 'Entrando...';
    messageEl.style.color = 'blue';
    
    // Login no Supabase Auth
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Buscar perfil do usuário na tabela usuarios
    const { data: userProfile, error: profileError } = await window.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    let userData = { 
      email: data.user.email,
      id: data.user.id
    };
    
    if (!profileError && userProfile) {
      userData = { ...userData, ...userProfile };
    } else if (profileError) {
      // Se não encontrou perfil, criar um básico
      const { error: insertError } = await window.supabase
        .from('usuarios')
        .insert({
          id: data.user.id,
          email: data.user.email,
          nome: email.split('@')[0],
          nivel_experiencia: 'iniciante',
          status: 'ativo'
        });
      
      if (!insertError) {
        userData.nome = email.split('@')[0];
        userData.nivel_experiencia = 'iniciante';
      }
    }
    
    // Salvar no localStorage
    localStorage.setItem('studyCertUser', JSON.stringify(userData));
    
    // Atualizar last_login
    await window.supabase
      .from('usuarios')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);
    
    messageEl.textContent = 'Login realizado com sucesso!';
    messageEl.style.color = 'green';
    
    setTimeout(() => {
      closeAuthModal();
      location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Erro no login:', error);
    messageEl.textContent = error.message || 'Erro ao fazer login';
    messageEl.style.color = 'red';
  }
};

window.register = async function() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const messageEl = document.getElementById('registerMessage');
  
  if (!name || !email || !password) {
    messageEl.textContent = 'Preencha todos os campos';
    messageEl.style.color = 'red';
    return;
  }
  
  if (password.length < 6) {
    messageEl.textContent = 'A senha deve ter no mínimo 6 caracteres';
    messageEl.style.color = 'red';
    return;
  }
  
  try {
    messageEl.textContent = 'Criando conta...';
    messageEl.style.color = 'blue';
    
    // Cadastro no Supabase Auth
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
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
    
    messageEl.textContent = 'Conta criada com sucesso! Verifique seu e-mail.';
    messageEl.style.color = 'green';
    
    // Auto-login após cadastro
    setTimeout(async () => {
      await loginAfterRegister(email, password, name);
    }, 2000);
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    messageEl.textContent = error.message || 'Erro ao criar conta';
    messageEl.style.color = 'red';
  }
};

async function loginAfterRegister(email, password, name) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error) {
      const userData = {
        id: data.user.id,
        email: email,
        nome: name,
        nivel_experiencia: 'iniciante'
      };
      
      localStorage.setItem('studyCertUser', JSON.stringify(userData));
      closeAuthModal();
      location.reload();
    }
  } catch (loginError) {
    console.error('Auto-login falhou:', loginError);
  }
}

window.logout = async function() {
  try {
    await window.supabase.auth.signOut();
    localStorage.removeItem('studyCertUser');
    location.reload();
  } catch (error) {
    console.error('Erro no logout:', error);
  }
};

window.forgotPassword = function() {
  const email = prompt('Digite seu e-mail para redefinir a senha:');
  if (email) {
    window.supabase.auth.resetPasswordForEmail(email)
      .then(({ error }) => {
        if (error) {
          alert('Erro: ' + error.message);
        } else {
          alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        }
      });
  }
};
