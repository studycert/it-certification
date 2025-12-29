[file name]: admin.js
[file content begin]
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
                this.redirectToLogin();
                return;
            }
            
            if (!session) {
                console.log('❌ Sem sessão ativa');
                this.redirectToLogin();
                return;
            }
            
            this.currentUser = session.user;
            console.log('✅ Usuário logado:', this.currentUser.email);
            
            // Verificar permissões
            const isAdmin = await this.verificarPermissaoAdmin();
            
            if (!isAdmin) {
                console.log('❌ Usuário não é administrador');
                this.showToast('Acesso não autorizado. Redirecionando...', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
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
            console.error('❌ Erro na inicialização:', err);
            this.showToast('Erro ao carregar painel', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    async verificarPermissaoAdmin() {
        try {
            // Verificar se o usuário está na tabela admin_users
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
            
            if (error) {
                console.log('Usuário não encontrado na tabela admin:', error.message);
                return false;
            }
            
            if (data) {
                this.adminData = data;
                
                // Armazenar permissões no localStorage para acesso rápido
                localStorage.setItem('admin_role', data.role);
                localStorage.setItem('admin_permissions', JSON.stringify(data.permissions));
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            return false;
        }
    }

    redirectToLogin() {
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
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            adminName.textContent = displayName;
        }
        
        if (adminEmail) {
            adminEmail.textContent = this.currentUser.email;
        }
        
        if (adminAvatar) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            adminAvatar.textContent = initials;
        }
    }

    aplicarPermissoes() {
        const permissions = this.adminData?.permissions || [];
        
        // Aplicar permissões nos menus
        const menuItens = {
            'usuarios': 'manage_users',
            'relatorios': 'view_reports',
            'configuracoes': 'manage_settings',
            'forum': 'manage_forum'
        };
        
        Object.entries(menuItens).forEach(([section, permission]) => {
            const menuItem = document.querySelector(`[data-section="${section}"]`);
            if (menuItem && !permissions.includes(permission)) {
                menuItem.style.display = 'none';
            }
        });
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
            logoutBtn.onclick = () => this.logout();
        }
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
        } finally {
            this.showLoading(false);
        }
    }

    async carregarEstatisticas() {
        try {
            const [
                usuariosCount,
                simuladosCount,
                postsCount,
                storageData
            ] = await Promise.all([
                this.contarUsuarios(),
                this.contarSimulados(),
                this.contarPostsForum(),
                this.calcularArmazenamento()
            ]);
            
            // Atualizar dashboard
            document.getElementById('totalUsuarios').textContent = usuariosCount;
            document.getElementById('totalSimulados').textContent = simuladosCount;
            document.getElementById('totalPosts').textContent = postsCount;
            document.getElementById('totalArmazenamento').textContent = storageData.size + ' MB';
            
            // Atualizar badges
            document.getElementById('badgeUsuarios').textContent = usuariosCount;
            document.getElementById('badgeSimulados').textContent = simuladosCount;
            document.getElementById('badgeForum').textContent = postsCount;
            
            // Atualizar sidebar
            document.getElementById('visitasHoje').textContent = await this.contarVisitasHoje();
            document.getElementById('uploadsHoje').textContent = await this.contarUploadsHoje();
            
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
        }
    }

    async contarUsuarios() {
        try {
            const { count, error } = await this.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });
            
            return error ? 0 : count;
        } catch (error) {
            return 0;
        }
    }

    async contarSimulados() {
        try {
            const { count, error } = await this.supabase
                .from('simulados')
                .select('*', { count: 'exact', head: true });
            
            return error ? 0 : count;
        } catch (error) {
            return 0;
        }
    }

    async contarPostsForum() {
        try {
            const { count, error } = await this.supabase
                .from('forum_posts')
                .select('*', { count: 'exact', head: true });
            
            return error ? 0 : count;
        } catch (error) {
            return 0;
        }
    }

    async calcularArmazenamento() {
        // Esta é uma implementação simplificada
        // Em produção, você deve consultar o storage do Supabase
        return {
            size: Math.floor(Math.random() * 500) + 100,
            used: Math.floor(Math.random() * 60) + 20
        };
    }

    async contarVisitasHoje() {
        // Implementar lógica de contagem de visitas
        return Math.floor(Math.random() * 50) + 10;
    }

    async contarUploadsHoje() {
        try {
            const hoje = new Date();
            const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            
            const { count, error } = await this.supabase
                .from('simulados')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', inicioDia.toISOString());
            
            return error ? 0 : count;
        } catch (error) {
            return 0;
        }
    }

    async carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        try {
            // Buscar logs de admin ou criar atividades padrão
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
            // Buscar simulados do Supabase
            const { data, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    user:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .range((this.paginaAtual - 1) * this.itensPorPagina, this.paginaAtual * this.itensPorPagina - 1);
            
            if (error) throw error;
            
            this.simulados = data || [];
            
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
        
        this.simulados.forEach((simulado, index) => {
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
                    <strong>${simulado.nome || 'Sem nome'}</strong>
                    <br><small class="text-muted">${simulado.id.substring(0, 8)}...</small>
                </td>
                <td>
                    <span class="badge badge-secondary">${simulado.categoria || 'Geral'}</span>
                </td>
                <td>
                    <div class="user-avatar-sm">
                        ${simulado.user?.full_name?.charAt(0) || simulado.user?.email?.charAt(0) || 'U'}
                    </div>
                    ${simulado.user?.full_name || simulado.user?.email || 'Usuário desconhecido'}
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
            const { data, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    user:profiles(full_name, email)
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            const modal = document.getElementById('modalDetalhesSimulado');
            const content = document.getElementById('detalhesSimuladoContent');
            
            content.innerHTML = `
                <div class="detalhes-simulado">
                    <h4>${data.nome || 'Sem nome'}</h4>
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Categoria:</strong> ${data.categoria || 'Geral'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(data.status)}">${this.getStatusText(data.status)}</span></p>
                    <p><strong>Usuário:</strong> ${data.user?.full_name || data.user?.email}</p>
                    <p><strong>Criado em:</strong> ${this.formatarData(data.created_at)} ${this.formatarHora(data.created_at)}</p>
                    <p><strong>Tamanho:</strong> ${data.tamanho ? (data.tamanho / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
                    <p><strong>Visualizações:</strong> ${data.visualizacoes || 0}</p>
                    
                    ${data.descricao ? `<div class="descricao-box"><strong>Descrição:</strong><p>${data.descricao}</p></div>` : ''}
                    
                    ${data.url ? `<div class="mt-3"><a href="${data.url}" target="_blank" class="btn btn-primary"><i class="fas fa-external-link-alt"></i> Acessar Simulado</a></div>` : ''}
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
            // Excluir do Supabase
            const { error } = await this.supabase
                .from('simulados')
                .delete()
                .eq('id', this.simuladoParaExcluir);
            
            if (error) throw error;
            
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
            const ids = Array.from(this.simuladosSelecionados);
            
            const { error } = await this.supabase
                .from('simulados')
                .delete()
                .in('id', ids);
            
            if (error) throw error;
            
            this.showToast(`${ids.length} simulado(s) excluído(s) com sucesso`, 'success');
            
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
            // Implementar busca de usuários
            const container = document.getElementById('usuariosTableBody');
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <p>Funcionalidade em desenvolvimento</p>
                            <p>Em breve você poderá gerenciar usuários aqui</p>
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
        }
    }

    // ========== UTILITÁRIOS ==========
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
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

    // Métodos para buscar/filtrar (placeholders)
    buscarSimulados() {
        console.log('Buscar simulados');
    }
    
    filtrarSimulados() {
        console.log('Filtrar simulados');
    }
    
    carregarSimulados() {
        this.carregarSimuladosTabela();
    }
    
    buscarUsuarios() {
        console.log('Buscar usuários');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});
[file content end]
