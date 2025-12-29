// Admin Panel Application
class AdminPanel {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminData = null;
        this.currentSection = 'dashboard';
        this.simulados = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.simuladosSelecionados = new Set();
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando Painel Admin');
        
        try {
            // Inicializar Supabase
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        storage: window.localStorage
                    }
                }
            );
            
            // Verificar sessão
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro na sessão:', error);
                this.showToast('Erro de sessão. Redirecionando...', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            if (!session) {
                console.log('❌ Sem sessão ativa');
                this.showToast('Sessão expirada. Faça login novamente.', 'warning');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            this.currentUser = session.user;
            console.log('✅ Usuário logado:', this.currentUser.email);
            
            // DEBUG: Mostrar token e dados
            this.debugAuth();
            
            // Verificar permissões com timeout
            const isAdmin = await this.verificarPermissaoAdminComTimeout();
            
            if (!isAdmin) {
                console.log('❌ Usuário não é administrador ou erro na verificação');
                this.showToast('Acesso não autorizado. Você não é administrador.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
                return;
            }
            
            console.log('✅ Permissões confirmadas:', this.adminData.role);
            
            // Carregar interface
            this.carregarInterface();
            
            // Carregar dados iniciais
            await this.carregarDadosIniciais();
            
            // Configurar eventos
            this.configurarEventos();
            
            console.log('✅ Painel Admin carregado com sucesso');
            
        } catch (err) {
            console.error('❌ Erro crítico na inicialização:', err);
            this.showToast('Erro crítico ao carregar painel', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    debugAuth() {
        console.log('=== 🔍 DEBUG AUTH ===');
        console.log('User ID:', this.currentUser.id);
        console.log('User Email:', this.currentUser.email);
        
        // Verificar token no localStorage
        const authToken = localStorage.getItem(`sb-${SUPABASE_CONFIG.url.split('//')[1].split('.')[0]}-auth-token`);
        if (authToken) {
            try {
                const tokenData = JSON.parse(authToken);
                console.log('Token expira em:', new Date(tokenData.expires_at));
                console.log('Token user_id:', tokenData.user?.id);
            } catch (e) {
                console.log('Token inválido no localStorage');
            }
        }
        console.log('=== FIM DEBUG ===');
    }

    async verificarPermissaoAdminComTimeout() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⚠️ Timeout na verificação de admin');
                resolve(false);
            }, 10000); // 10 segundos timeout
            
            this.verificarPermissaoAdmin()
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    console.error('❌ Erro na verificação:', error);
                    resolve(false);
                });
        });
    }

    async verificarPermissaoAdmin() {
        try {
            console.log('🔍 Iniciando verificação de permissões admin...');
            console.log('👤 Usuário atual:', this.currentUser.email);
            console.log('🆔 User ID:', this.currentUser.id);
            
            // Primeiro tenta buscar por user_id
            console.log('1. Buscando por user_id...');
            const { data: dataByUserId, error: errorByUserId } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .maybeSingle(); // Usa maybeSingle em vez de single para não dar erro se não encontrar
            
            if (dataByUserId) {
                console.log('✅ Encontrado por user_id!');
                this.processarDadosAdmin(dataByUserId);
                return true;
            }
            
            console.log('ℹ️ Não encontrado por user_id:', errorByUserId?.message || 'Nenhum resultado');
            
            // Se não encontrou por user_id, tenta por email
            console.log('2. Buscando por email...');
            const { data: dataByEmail, error: errorByEmail } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('email', this.currentUser.email)
                .maybeSingle();
            
            if (dataByEmail) {
                console.log('✅ Encontrado por email!');
                this.processarDadosAdmin(dataByEmail);
                return true;
            }
            
            console.log('ℹ️ Não encontrado por email:', errorByEmail?.message || 'Nenhum resultado');
            
            // DEBUG: Listar todos os admins para diagnóstico
            console.log('3. Listando todos os admins para diagnóstico...');
            const { data: allAdmins, error: allAdminsError } = await this.supabase
                .from('admin_users')
                .select('user_id, email, role')
                .limit(10);
            
            if (!allAdminsError && allAdmins && allAdmins.length > 0) {
                console.log('📊 Admins no sistema:');
                allAdmins.forEach((admin, index) => {
                    console.log(`   ${index + 1}. ${admin.email} (${admin.role}) - ${admin.user_id}`);
                });
                
                // Verificar se há correspondência parcial de email
                const emailDomain = this.currentUser.email.split('@')[1];
                const matchingAdmins = allAdmins.filter(admin => 
                    admin.email.includes(this.currentUser.email.split('@')[0]) ||
                    admin.email.endsWith(emailDomain)
                );
                
                if (matchingAdmins.length > 0) {
                    console.log('⚠️ Possíveis correspondências encontradas:');
                    matchingAdmins.forEach(admin => {
                        console.log(`   - ${admin.email} (${admin.user_id})`);
                    });
                }
            } else {
                console.log('ℹ️ Nenhum admin encontrado no sistema ou erro:', allAdminsError?.message);
            }
            
            // Verificar se existe pelo menos algum dado na tabela
            const { count } = await this.supabase
                .from('admin_users')
                .select('*', { count: 'exact', head: true });
            
            console.log(`ℹ️ Total de registros na tabela admin_users: ${count || 0}`);
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro crítico ao verificar permissões:', error);
            
            // Tenta verificar se a tabela existe
            try {
                const { error: tableError } = await this.supabase
                    .from('admin_users')
                    .select('id')
                    .limit(1);
                
                if (tableError && tableError.code === '42P01') {
                    console.error('❌ TABELA admin_users NÃO EXISTE!');
                    this.showToast('Erro: Tabela admin_users não existe no banco de dados', 'error');
                }
            } catch (e) {
                console.error('Erro ao verificar tabela:', e);
            }
            
            return false;
        }
    }

    processarDadosAdmin(data) {
        console.log('📋 Processando dados do admin:', data);
        
        this.adminData = data;
        
        // Processamento robusto das permissões
        let permissions = data.permissions;
        
        console.log('🔄 Tipo original de permissions:', typeof permissions);
        console.log('🔄 Valor original:', permissions);
        
        // Caso 1: Já é array (ideal)
        if (Array.isArray(permissions)) {
            console.log('✅ Permissions já é array');
        }
        // Caso 2: É string JSON (como você mostrou)
        else if (typeof permissions === 'string') {
            console.log('🔄 Permissions é string, tentando parsear JSON...');
            
            try {
                // Remove espaços extras
                const trimmed = permissions.trim();
                
                // Se for string JSON como ["item1","item2"]
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    permissions = JSON.parse(trimmed);
                    console.log('✅ JSON parseado com sucesso:', permissions);
                }
                // Se for string simples como "item1,item2,item3"
                else if (trimmed.includes(',')) {
                    permissions = trimmed
                        .split(',')
                        .map(item => item.trim().replace(/['"]/g, '')) // Remove aspas
                        .filter(item => item.length > 0);
                    console.log('✅ String com vírgulas convertida para array:', permissions);
                }
                // Se for string única
                else if (trimmed.length > 0) {
                    permissions = [trimmed];
                    console.log('✅ String única convertida para array:', permissions);
                } else {
                    permissions = ['view_dashboard'];
                    console.log('⚠️ String vazia, usando permissão padrão');
                }
            } catch (parseError) {
                console.error('❌ Erro ao parsear permissions:', parseError);
                permissions = ['view_dashboard'];
            }
        }
        // Caso 3: É null ou undefined
        else if (!permissions) {
            console.log('⚠️ Permissions é null/undefined, usando padrão');
            permissions = ['view_dashboard'];
        }
        // Caso 4: Outro tipo inesperado
        else {
            console.warn('⚠️ Tipo inesperado de permissions:', typeof permissions, permissions);
            permissions = ['view_dashboard'];
        }
        
        // Garantir que é um array válido
        if (!Array.isArray(permissions)) {
            console.error('❌ Permissions não é array após processamento:', permissions);
            permissions = ['view_dashboard'];
        }
        
        // Atualizar objeto adminData
        this.adminData.permissions = permissions;
        
        console.log('✅ Permissões finais:', permissions);
        console.log('✅ É array?', Array.isArray(permissions));
        
        // Salvar no localStorage para acesso rápido
        localStorage.setItem('admin_role', data.role || 'admin');
        localStorage.setItem('admin_permissions', JSON.stringify(permissions));
        localStorage.setItem('admin_email', data.email);
        localStorage.setItem('admin_user_id', data.user_id);
        localStorage.setItem('admin_checked', 'true');
        localStorage.setItem('admin_last_access', new Date().toISOString());
        
        // Log para debug
        console.log('💾 Salvo no localStorage:');
        console.log('  - admin_role:', data.role);
        console.log('  - admin_permissions:', JSON.stringify(permissions));
        console.log('  - admin_user_id:', data.user_id);
    }

    redirectToLogin() {
        console.log('🔄 Redirecionando para login...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    carregarInterface() {
        this.atualizarPerfil();
        this.configurarNavegacao();
        this.aplicarPermissoes();
    }

    atualizarPerfil() {
        console.log('👤 Atualizando perfil admin...');
        
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            adminName.textContent = displayName;
            console.log('✅ Nome atualizado:', displayName);
        }
        
        if (adminEmail) {
            adminEmail.textContent = this.currentUser.email;
            console.log('✅ Email atualizado:', this.currentUser.email);
        }
        
        if (adminAvatar) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            adminAvatar.textContent = initials;
            console.log('✅ Avatar atualizado:', initials);
        }
    }

    aplicarPermissoes() {
        if (!this.adminData) {
            console.log('❌ Sem dados de admin para aplicar permissões');
            return;
        }
        
        console.log('🎯 Aplicando permissões na interface...');
        
        const menuItens = {
            'usuarios': 'manage_users',
            'relatorios': 'view_reports', 
            'configuracoes': 'manage_settings',
            'forum': 'manage_forum',
            'simulados': 'manage_simulados'
        };
        
        Object.entries(menuItens).forEach(([section, permissao]) => {
            const menuItem = document.querySelector(`[data-section="${section}"]`);
            if (menuItem) {
                const temAcesso = this.temPermissao(permissao);
                menuItem.style.display = temAcesso ? '' : 'none';
                console.log(`  ${section}: ${temAcesso ? '✅ Mostrar' : '❌ Ocultar'}`);
            }
        });
    }

    temPermissao(permissaoRequerida) {
        if (!this.adminData || !this.adminData.permissions) {
            console.log('❌ Sem dados de admin ou permissões');
            return false;
        }
        
        const permissions = this.adminData.permissions;
        
        // Garantir que é array
        const permsArray = Array.isArray(permissions) ? permissions : [];
        
        const temPermissao = permsArray.includes(permissaoRequerida);
        
        console.log(`🔍 Verificando permissão "${permissaoRequerida}":`, 
                    temPermissao ? '✅ TEM' : '❌ NÃO TEM',
                    'Permissões disponíveis:', permsArray);
        
        return temPermissao;
    }

    configurarEventos() {
        // Configurar navegação
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.mostrarSecao(section);
            });
        });
        
        // Botão logout
        const logoutBtn = document.querySelector('[onclick*="logout"]');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                this.logout();
            };
        }
        
        // Mostrar dashboard inicialmente
        this.mostrarSecao('dashboard');
    }

    async carregarDadosIniciais() {
        this.showLoading(true);
        
        try {
            // Carregar estatísticas
            await this.carregarEstatisticas();
            
            // Carregar atividade recente
            await this.carregarAtividadeRecente();
            
            // Carregar alertas
            await this.carregarAlertas();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados iniciais', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async carregarEstatisticas() {
        try {
            // Dados simulados para demonstração
            document.getElementById('totalUsuarios').textContent = '157';
            document.getElementById('totalSimulados').textContent = '42';
            document.getElementById('totalPosts').textContent = '289';
            document.getElementById('totalArmazenamento').textContent = '245 MB';
            
            // Atualizar badges
            document.getElementById('badgeUsuarios').textContent = '157';
            document.getElementById('badgeSimulados').textContent = '42';
            document.getElementById('badgeForum').textContent = '289';
            
            // Atualizar sidebar
            document.getElementById('visitasHoje').textContent = '38';
            document.getElementById('uploadsHoje').textContent = '7';
            
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
        }
    }

    async carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        try {
            const atividades = [
                {
                    icon: 'fas fa-sign-in-alt',
                    color: '#3498db',
                    title: 'Login de administrador',
                    user: this.currentUser.email.split('@')[0],
                    time: 'Agora'
                },
                {
                    icon: 'fas fa-upload',
                    color: '#27ae60',
                    title: 'Novo simulado publicado',
                    user: 'Usuário123',
                    time: '2 horas atrás'
                },
                {
                    icon: 'fas fa-user-plus',
                    color: '#9b59b6',
                    title: 'Novo usuário registrado',
                    user: 'novousuario@email.com',
                    time: '4 horas atrás'
                },
                {
                    icon: 'fas fa-comment',
                    color: '#f39c12',
                    title: 'Novo post no fórum',
                    user: 'Maria Silva',
                    time: '1 dia atrás'
                }
            ];
            
            container.innerHTML = atividades.map(ativ => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${ativ.color}">
                        <i class="${ativ.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${ativ.title}</h4>
                        <p>${ativ.user}</p>
                    </div>
                    <div class="activity-time">${ativ.time}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('❌ Erro ao carregar atividade:', error);
            container.innerHTML = '<p class="text-muted">Erro ao carregar atividade</p>';
        }
    }

    async carregarAlertas() {
        const container = document.getElementById('alertList');
        if (!container) return;
        
        try {
            const alertas = [
                {
                    type: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    title: 'Storage atingindo limite',
                    message: '80% do storage utilizado'
                },
                {
                    type: 'danger',
                    icon: 'fas fa-times-circle',
                    title: 'Simulados não verificados',
                    message: '3 simulados aguardando revisão'
                }
            ];
            
            container.innerHTML = alertas.map(alerta => `
                <div class="alert-item ${alerta.type}">
                    <i class="${alerta.icon}"></i>
                    <div class="alert-content">
                        <h4>${alerta.title}</h4>
                        <p>${alerta.message}</p>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('❌ Erro ao carregar alertas:', error);
        }
    }

    mostrarSecao(sectionId) {
        // Esconder todas as seções
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover active de todos os itens do menu
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Ativar item do menu
        const menuItem = document.querySelector(`.admin-menu-item[data-section="${sectionId}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        this.currentSection = sectionId;
        
        // Carregar dados da seção
        this.carregarDadosSecao(sectionId);
    }

    async carregarDadosSecao(sectionId) {
        console.log(`📂 Carregando dados da seção: ${sectionId}`);
        
        switch(sectionId) {
            case 'dashboard':
                await this.carregarEstatisticas();
                break;
            case 'simulados':
                await this.carregarSimuladosTabela();
                break;
            case 'usuarios':
                await this.carregarUsuariosTabela();
                break;
            case 'forum':
                await this.carregarForumTabela();
                break;
        }
    }

    // ========== GERENCIAMENTO DE SIMULADOS ==========
    async carregarSimuladosTabela() {
        this.showLoading(true);
        
        try {
            // Dados simulados para demonstração
            this.simulados = [
                {
                    id: '1',
                    nome: 'ITIL 4 Foundation - Simulado 1',
                    categoria: 'ITIL',
                    user: { full_name: 'João Silva', email: 'joao@email.com' },
                    created_at: new Date().toISOString(),
                    tamanho: 10240,
                    status: 'ativo',
                    visualizacoes: 150
                },
                {
                    id: '2',
                    nome: 'LPIC-1 - Comandos Básicos',
                    categoria: 'Linux',
                    user: { full_name: 'Maria Santos', email: 'maria@email.com' },
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    tamanho: 15360,
                    status: 'ativo',
                    visualizacoes: 89
                }
            ];
            
            // Atualizar tabela
            this.atualizarTabelaSimulados();
            
            // Atualizar paginação
            this.atualizarPaginacao();
            
        } catch (error) {
            console.error('❌ Erro ao carregar simulados:', error);
            this.showToast('Erro ao carregar simulados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    atualizarTabelaSimulados() {
        const tbody = document.getElementById('simuladosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.simulados.forEach((simulado) => {
            const row = document.createElement('tr');
            row.id = `simulado-row-${simulado.id}`;
            
            const statusClass = this.getStatusClass(simulado.status);
            const statusText = this.getStatusText(simulado.status);
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="table-checkbox simulado-checkbox" 
                           data-id="${simulado.id}"
                           onchange="admin.toggleSelecaoSimulado('${simulado.id}')">
                </td>
                <td>
                    <strong>${simulado.nome}</strong>
                    <br><small class="text-muted">ID: ${simulado.id}</small>
                </td>
                <td>
                    <span class="badge badge-secondary">${simulado.categoria}</span>
                </td>
                <td>
                    <div class="user-avatar-sm">
                        ${simulado.user?.full_name?.charAt(0) || simulado.user?.email?.charAt(0) || 'U'}
                    </div>
                    ${simulado.user?.full_name || simulado.user?.email || 'Usuário'}
                </td>
                <td>
                    ${this.formatarData(simulado.created_at)}
                    <br><small>${this.formatarHora(simulado.created_at)}</small>
                </td>
                <td>
                    ${simulado.tamanho ? (simulado.tamanho / 1024).toFixed(2) + ' KB' : 'N/A'}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    ${simulado.visualizacoes || 0}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="admin.verDetalhesSimulado('${simulado.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="admin.editarSimulado('${simulado.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="admin.confirmarExclusaoSimulado('${simulado.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    getStatusClass(status) {
        const classes = {
            'ativo': 'status-ativo',
            'inativo': 'status-inativo',
            'pendente': 'status-pendente'
        };
        return classes[status] || 'status-pendente';
    }

    getStatusText(status) {
        const textos = {
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'pendente': 'Pendente'
        };
        return textos[status] || 'Pendente';
    }

    formatarData(dataString) {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }

    formatarHora(dataString) {
        if (!dataString) return '';
        const data = new Date(dataString);
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    toggleSelecaoSimulado(id) {
        if (this.simuladosSelecionados.has(id)) {
            this.simuladosSelecionados.delete(id);
        } else {
            this.simuladosSelecionados.add(id);
        }
        
        this.atualizarBotaoExclusaoMultipla();
    }

    selecionarTodosSimulados() {
        const checkAll = document.getElementById('selectAllSimulados');
        const checkboxes = document.querySelectorAll('.simulado-checkbox');
        
        if (checkAll.checked) {
            this.simuladosSelecionados.clear();
            this.simulados.forEach(simulado => {
                this.simuladosSelecionados.add(simulado.id);
            });
            
            checkboxes.forEach(cb => cb.checked = true);
        } else {
            this.simuladosSelecionados.clear();
            checkboxes.forEach(cb => cb.checked = false);
        }
        
        this.atualizarBotaoExclusaoMultipla();
    }

    atualizarBotaoExclusaoMultipla() {
        const btn = document.getElementById('btnExcluirMultiplos');
        if (btn) {
            btn.disabled = this.simuladosSelecionados.size === 0;
        }
    }

    atualizarPaginacao() {
        const total = this.simulados.length;
        const showing = document.getElementById('simuladosShowing');
        const totalElement = document.getElementById('simuladosTotal');
        const paginationInfo = document.getElementById('paginationInfo');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        
        if (showing) showing.textContent = total;
        if (totalElement) totalElement.textContent = total;
        if (paginationInfo) paginationInfo.textContent = `Página ${this.paginaAtual}`;
        
        // Desabilitar botões se necessário
        if (btnPrev) btnPrev.disabled = this.paginaAtual <= 1;
        if (btnNext) btnNext.disabled = this.simulados.length < this.itensPorPagina;
    }

    proximaPagina() {
        this.paginaAtual++;
        this.carregarSimuladosTabela();
    }

    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.carregarSimuladosTabela();
        }
    }

    async verDetalhesSimulado(id) {
        try {
            const simulado = this.simulados.find(s => s.id === id);
            
            if (!simulado) {
                this.showToast('Simulado não encontrado', 'error');
                return;
            }
            
            const modal = document.getElementById('modalDetalhesSimulado');
            const content = document.getElementById('detalhesSimuladoContent');
            
            content.innerHTML = `
                <div class="detalhes-simulado">
                    <h4>${simulado.nome}</h4>
                    <p><strong>ID:</strong> ${simulado.id}</p>
                    <p><strong>Categoria:</strong> ${simulado.categoria}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(simulado.status)}">${this.getStatusText(simulado.status)}</span></p>
                    <p><strong>Usuário:</strong> ${simulado.user?.full_name || simulado.user?.email}</p>
                    <p><strong>Criado em:</strong> ${this.formatarData(simulado.created_at)} ${this.formatarHora(simulado.created_at)}</p>
                    <p><strong>Tamanho:</strong> ${simulado.tamanho ? (simulado.tamanho / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
                    <p><strong>Visualizações:</strong> ${simulado.visualizacoes || 0}</p>
                    
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="admin.testarSimulado('${simulado.id}')">
                            <i class="fas fa-play"></i> Testar Simulado
                        </button>
                        <button class="btn btn-warning" onclick="admin.editarSimulado('${simulado.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            this.showToast('Erro ao carregar detalhes', 'error');
        }
    }

    fecharModalDetalhes() {
        const modal = document.getElementById('modalDetalhesSimulado');
        modal.classList.remove('active');
    }

    testarSimulado(id) {
        this.showToast('Funcionalidade em desenvolvimento', 'info');
    }

    editarSimulado(id) {
        this.showToast('Funcionalidade em desenvolvimento', 'info');
    }

    confirmarExclusaoSimulado(id) {
        this.simuladoParaExcluir = id;
        const modal = document.getElementById('modalConfirmarExclusaoAdmin');
        const texto = document.getElementById('confirmacaoTexto');
        
        if (texto) {
            texto.textContent = `Deseja realmente excluir este simulado? Esta ação não pode ser desfeita.`;
        }
        
        modal.classList.add('active');
    }

    fecharModalConfirmacao() {
        const modal = document.getElementById('modalConfirmarExclusaoAdmin');
        modal.classList.remove('active');
        this.simuladoParaExcluir = null;
        
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (checkbox) checkbox.checked = false;
    }

    async executarExclusaoSimulado() {
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (!checkbox || !checkbox.checked) {
            this.showToast('Por favor, confirme a exclusão', 'warning');
            return;
        }
        
        if (!this.simuladoParaExcluir) {
            this.showToast('Nenhum simulado selecionado', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Simular exclusão
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showToast('Simulado excluído com sucesso', 'success');
            
            // Atualizar lista
            await this.carregarSimuladosTabela();
            
            // Fechar modal
            this.fecharModalConfirmacao();
            
        } catch (error) {
            console.error('❌ Erro ao excluir simulado:', error);
            this.showToast('Erro ao excluir simulado', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async excluirMultiplosSimulados() {
        if (this.simuladosSelecionados.size === 0) {
            this.showToast('Selecione simulados para excluir', 'warning');
            return;
        }
        
        if (!confirm(`Deseja excluir ${this.simuladosSelecionados.size} simulado(s)?`)) {
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Simular exclusão
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.showToast(`${this.simuladosSelecionados.size} simulado(s) excluído(s) com sucesso`, 'success');
            
            // Limpar seleção
            this.simuladosSelecionados.clear();
            
            // Atualizar lista
            await this.carregarSimuladosTabela();
            
        } catch (error) {
            console.error('❌ Erro ao excluir múltiplos simulados:', error);
            this.showToast('Erro ao excluir simulados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ========== GERENCIAMENTO DE USUÁRIOS ==========
    async carregarUsuariosTabela() {
        try {
            const container = document.getElementById('usuariosTableBody');
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="p-4">
                                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                                <h5>Funcionalidade em desenvolvimento</h5>
                                <p class="text-muted">Em breve você poderá gerenciar usuários aqui</p>
                                <button class="btn btn-primary" onclick="admin.carregarUsuariosDemo()">
                                    <i class="fas fa-eye"></i> Ver Dados Demonstrativos
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
        }
    }

    async carregarUsuariosDemo() {
        const container = document.getElementById('usuariosTableBody');
        if (!container) return;
        
        const usuariosDemo = [
            { nome: 'João Silva', email: 'joao@email.com', registro: '15/03/2024', status: 'ativo', simulados: 5, ultimoLogin: 'Hoje 10:30' },
            { nome: 'Maria Santos', email: 'maria@email.com', registro: '10/03/2024', status: 'ativo', simulados: 3, ultimoLogin: 'Ontem 14:20' },
            { nome: 'Carlos Oliveira', email: 'carlos@email.com', registro: '05/03/2024', status: 'inativo', simulados: 0, ultimoLogin: '05/03/2024' }
        ];
        
        container.innerHTML = usuariosDemo.map(user => `
            <tr>
                <td>
                    <div class="user-avatar-sm">
                        ${user.nome.charAt(0)}
                    </div>
                </td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td>${user.registro}</td>
                <td><span class="status-badge ${user.status === 'ativo' ? 'status-ativo' : 'status-inativo'}">${user.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                <td>${user.simulados}</td>
                <td>${user.ultimoLogin}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== GERENCIAMENTO DO FÓRUM ==========
    async carregarForumTabela() {
        this.showToast('Seção Fórum em desenvolvimento', 'info');
    }

    // ========== UTILITÁRIOS ==========
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || (() => {
            const div = document.createElement('div');
            div.id = 'toastContainer';
            document.body.appendChild(div);
            return div;
        })();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="close-toast" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    async logout() {
        try {
            this.showLoading(true);
            
            await this.supabase.auth.signOut();
            
            // Limpar dados de admin
            localStorage.removeItem('admin_role');
            localStorage.removeItem('admin_permissions');
            localStorage.removeItem('admin_email');
            localStorage.removeItem('admin_user_id');
            localStorage.removeItem('admin_checked');
            
            this.showToast('Sessão encerrada com sucesso', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            this.showToast('Erro ao encerrar sessão', 'error');
            this.showLoading(false);
        }
    }

    // Métodos para buscar/filtrar
    buscarSimulados() {
        console.log('Buscar simulados - em desenvolvimento');
        this.showToast('Busca em desenvolvimento', 'info');
    }
    
    filtrarSimulados() {
        console.log('Filtrar simulados - em desenvolvimento');
        this.showToast('Filtro em desenvolvimento', 'info');
    }
    
    carregarSimulados() {
        this.carregarSimuladosTabela();
        this.showToast('Lista de simulados atualizada', 'success');
    }
    
    buscarUsuarios() {
        console.log('Buscar usuários - em desenvolvimento');
        this.showToast('Busca de usuários em desenvolvimento', 'info');
    }

    // Método de emergência para bypass (apenas para desenvolvimento)
    async modoEmergencia() {
        console.log('🚨 ATIVANDO MODO EMERGÊNCIA - DESENVOLVIMENTO APENAS');
        
        this.adminData = {
            user_id: this.currentUser.id,
            email: this.currentUser.email,
            role: 'super_admin',
            permissions: ['view_dashboard', 'manage_simulados', 'manage_users', 'manage_forum', 'view_reports', 'manage_settings']
        };
        
        localStorage.setItem('admin_role', 'super_admin');
        localStorage.setItem('admin_permissions', JSON.stringify(this.adminData.permissions));
        localStorage.setItem('admin_email', this.currentUser.email);
        localStorage.setItem('admin_user_id', this.currentUser.id);
        localStorage.setItem('admin_emergency', 'true');
        
        this.showToast('Modo emergência ativado - Acesso concedido', 'warning');
        
        // Recarrega a página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return true;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando AdminPanel...');
    window.admin = new AdminPanel();
    
    // Adicionar botão de emergência no console (apenas desenvolvimento)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('💡 Dica: Para modo emergência, execute no console: admin.modoEmergencia()');
    }
});
