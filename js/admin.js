// Admin Panel Application
class AdminPanel {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.simulados = [];
        this.usuarios = [];
        this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalItems: 0
        };
        this.selectedSimulados = new Set();
        this.simuladoParaExcluir = null;
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando Painel Admin');
        
        try {
            // Inicializar Supabase
            if (typeof supabase !== 'undefined' && SUPABASE_CONFIG) {
                this.supabase = supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            storage: window.localStorage,
                            storageKey: 'studycert-admin-auth'
                        }
                    }
                );
                
                // Verificar sessão
                const { data, error } = await this.supabase.auth.getSession();
                if (error) {
                    console.error('❌ Erro na sessão:', error);
                    this.redirectToLogin();
                    return;
                }
                
                if (!data.session) {
                    this.redirectToLogin();
                    return;
                }
                
                this.currentUser = data.session.user;
                
                // Verificar se é admin (você pode implementar lógica mais complexa)
                await this.verificarPermissoesAdmin();
                
                // Carregar interface
                this.carregarInterface();
                
                // Carregar dados iniciais
                await this.carregarDadosIniciais();
                
                // Configurar eventos
                this.configurarEventos();
                
                console.log('✅ Painel Admin inicializado com sucesso');
                
            } else {
                throw new Error('Configuração do Supabase não encontrada');
            }
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showToast('Erro ao inicializar o painel', 'error');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        // Redirecionar para a página principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    async verificarPermissoesAdmin() {
    try {
        console.log('🔍 Verificando se usuário é admin...');
        console.log('👤 ID do usuário:', this.currentUser.id);
        console.log('📧 Email:', this.currentUser.email);
        
        // TESTE 1: Verificar usando a função RPC do Supabase
        const { data: isAdmin, error } = await this.supabase
            .rpc('is_admin', { user_id: this.currentUser.id });
        
        console.log('📊 Resultado da função is_admin:', isAdmin);
        
        if (error) {
            console.warn('⚠️ Erro na função RPC, tentando método alternativo...', error);
            
            // TESTE 2: Consultar diretamente a tabela admin_usuarios
            const { data: adminData, error: queryError } = await this.supabase
                .from('admin_usuarios')
                .select('*')
                .eq('id', this.currentUser.id);
            
            console.log('📋 Dados da tabela admin_usuarios:', adminData);
            
            if (queryError) {
                console.error('❌ Erro na consulta direta:', queryError);
            }
            
            // Se encontrou na tabela, é admin
            if (adminData && adminData.length > 0) {
                console.log('✅ Usuário é admin (encontrado na tabela)');
                return; // Usuário é admin, pode continuar
            }
            
        } else if (isAdmin === true) {
            console.log('✅ Usuário é admin (função retornou true)');
            return; // Usuário é admin, pode continuar
        }
        
        // TESTE 3: Verificação temporária pelo email (APENAS PARA DEBUG)
        // REMOVA ESTE BLOCO DEPOIS DE CONFIGURAR CORRETAMENTE
        const adminEmailsDebug = [
            'admin@studycert.com', 
            'suporte@studycert.com',
            'andre.martins05@gmail.com' // ADICIONE SEU EMAIL AQUI TEMPORARIAMENTE
        ];
        
        if (adminEmailsDebug.includes(this.currentUser.email)) {
            console.warn('⚠️ Acesso permitido por email (MODO DEBUG)');
            return; // Permite acesso temporariamente
        }
        
        // Se chegou aqui, não é admin
        console.log('❌ Usuário NÃO é admin - Acesso negado');
        this.showToast('Acesso não autorizado. Você não possui permissões de administrador.', 'error');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        throw new Error('Acesso não autorizado - usuário não é administrador');
        
    } catch (err) {
        console.error('❌ Erro na verificação de admin:', err);
        this.showToast('Erro ao verificar permissões. Redirecionando...', 'error');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        throw err;
    }
}

    carregarInterface() {
        // Atualizar informações do perfil
        this.atualizarPerfil();
        
        // Configurar navegação
        this.configurarNavegacao();
    }

    atualizarPerfil() {
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName) {
            adminName.textContent = this.currentUser.user_metadata?.full_name || 
                                   this.currentUser.email.split('@')[0];
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

    configurarNavegacao() {
        // Configurar clique nos itens do menu
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.mostrarSecao(section);
            });
        });
        
        // Mostrar dashboard inicialmente
        this.mostrarSecao('dashboard');
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
        
        // Carregar dados específicos da seção
        switch(sectionId) {
            case 'simulados':
                this.carregarSimulados();
                break;
            case 'usuarios':
                this.carregarUsuarios();
                break;
            case 'dashboard':
                this.carregarDashboard();
                break;
        }
    }

    async carregarDadosIniciais() {
        // Carregar estatísticas
        await this.carregarEstatisticas();
        
        // Carregar atividades recentes
        await this.carregarAtividades();
        
        // Carregar alertas
        await this.carregarAlertas();
    }

    async carregarEstatisticas() {
        try {
            // Total de usuários
            const { count: totalUsuarios } = await this.supabase
                .from('usuario_perfil')
                .select('*', { count: 'exact', head: true });
            
            document.getElementById('totalUsuarios').textContent = totalUsuarios || 0;
            document.getElementById('badgeUsuarios').textContent = totalUsuarios || 0;
            
            // Total de simulados
            const { count: totalSimulados } = await this.supabase
                .from('simulados')
                .select('*', { count: 'exact', head: true });
            
            document.getElementById('totalSimulados').textContent = totalSimulados || 0;
            document.getElementById('badgeSimulados').textContent = totalSimulados || 0;
            
            // Total de posts (exemplo)
            document.getElementById('totalPosts').textContent = '0';
            document.getElementById('badgeForum').textContent = '0';
            
            // Armazenamento usado (exemplo)
            const armazenamento = Math.floor((totalSimulados || 0) * 0.5); // 0.5MB por simulado
            document.getElementById('totalArmazenamento').textContent = `${armazenamento} MB`;
            
            // Visitas e uploads de hoje (exemplo)
            document.getElementById('visitasHoje').textContent = Math.floor(Math.random() * 100);
            document.getElementById('uploadsHoje').textContent = Math.floor(Math.random() * 10);
            
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
        }
    }

    async carregarAtividades() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            // Buscar atividades recentes (últimos 5 simulados)
            const { data: simulados, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    usuario_perfil:nome_completo
                `)
                .order('data_upload', { ascending: false })
                .limit(5);
            
            if (error) throw error;
            
            let html = '';
            
            simulados.forEach(simulado => {
                const nomeUsuario = simulado.usuario_perfil?.nome_completo || 'Usuário';
                const data = new Date(simulado.data_upload).toLocaleDateString('pt-BR');
                const hora = new Date(simulado.data_upload).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                html += `
                    <div class="activity-item">
                        <div class="activity-icon" style="background: #3498db;">
                            <i class="fas fa-upload"></i>
                        </div>
                        <div class="activity-content">
                            <h4>Novo simulado enviado</h4>
                            <p>${simulado.nome} por ${nomeUsuario}</p>
                            <div class="activity-time">${data} às ${hora}</div>
                        </div>
                    </div>
                `;
            });
            
            activityList.innerHTML = html || '<p style="color: #999; text-align: center;">Nenhuma atividade recente</p>';
            
        } catch (error) {
            console.error('❌ Erro ao carregar atividades:', error);
            document.getElementById('activityList').innerHTML = 
                '<p style="color: #999; text-align: center;">Erro ao carregar atividades</p>';
        }
    }

    async carregarAlertas() {
        try {
            const alertList = document.getElementById('alertList');
            if (!alertList) return;
            
            // Buscar simulados com problemas (exemplo: muito grandes ou com URLs inválidas)
            const { data: simulados, error } = await this.supabase
                .from('simulados')
                .select('*')
                .limit(5);
            
            if (error) throw error;
            
            let html = '';
            let alertCount = 0;
            
            // Verificar simulados muito grandes (>5MB)
            simulados.forEach(simulado => {
                if (simulado.arquivo_tamanho_kb > 5120) { // 5MB
                    alertCount++;
                    html += `
                        <div class="alert-item warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="alert-content">
                                <h4>Simulado muito grande</h4>
                                <p>${simulado.nome} (${simulado.arquivo_tamanho_kb} KB)</p>
                            </div>
                        </div>
                    `;
                }
            });
            
            // Adicionar alerta se não houver nenhum
            if (alertCount === 0) {
                html = `
                    <div class="alert-item info">
                        <i class="fas fa-info-circle"></i>
                        <div class="alert-content">
                            <h4>Tudo sob controle</h4>
                            <p>Nenhum problema encontrado no momento.</p>
                        </div>
                    </div>
                `;
            }
            
            alertList.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Erro ao carregar alertas:', error);
            document.getElementById('alertList').innerHTML = 
                '<p style="color: #999; text-align: center;">Erro ao carregar alertas</p>';
        }
    }

    async carregarDashboard() {
        await this.carregarEstatisticas();
        await this.carregarAtividades();
        await this.carregarAlertas();
    }

    // ==================== GERENCIAR SIMULADOS ====================
    async carregarSimulados() {
        this.showLoading(true);
        
        try {
            // Calcular offset para paginação
            const offset = (this.pagination.currentPage - 1) * this.pagination.pageSize;
            
            // Buscar simulados com paginação
            const { data: simulados, error, count } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    usuario_perfil:nome_completo
                `, { count: 'exact' })
                .order('data_upload', { ascending: false })
                .range(offset, offset + this.pagination.pageSize - 1);
            
            if (error) throw error;
            
            this.simulados = simulados || [];
            this.pagination.totalItems = count || 0;
            
            // Renderizar tabela
            this.renderizarTabelaSimulados();
            
            // Atualizar paginação
            this.atualizarPaginacao();
            
        } catch (error) {
            console.error('❌ Erro ao carregar simulados:', error);
            this.showToast('Erro ao carregar simulados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderizarTabelaSimulados() {
        const tbody = document.getElementById('simuladosTableBody');
        if (!tbody) return;
        
        if (this.simulados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Nenhum simulado encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        this.simulados.forEach(simulado => {
            const isSelected = this.selectedSimulados.has(simulado.id);
            const dataFormatada = new Date(simulado.data_upload).toLocaleDateString('pt-BR');
            const nomeUsuario = simulado.usuario_perfil?.nome_completo || 
                               simulado.usuario_id?.substring(0, 8) || 'Anônimo';
            const tamanhoFormatado = simulado.arquivo_tamanho_kb ? 
                `${simulado.arquivo_tamanho_kb} KB` : 'N/A';
            
            // Status
            let statusClass = 'status-ativo';
            let statusText = 'Ativo';
            
            if (simulado.status === 'inativo') {
                statusClass = 'status-inativo';
                statusText = 'Inativo';
            } else if (simulado.status === 'pendente') {
                statusClass = 'status-pendente';
                statusText = 'Pendente';
            }
            
            html += `
                <tr class="${isSelected ? 'selected' : ''}" data-id="${simulado.id}">
                    <td>
                        <input type="checkbox" class="table-checkbox" 
                               data-id="${simulado.id}"
                               onchange="admin.toggleSelecionarSimulado('${simulado.id}')"
                               ${isSelected ? 'checked' : ''}>
                    </td>
                    <td>
                        <strong>${this.escapeHtml(simulado.nome)}</strong><br>
                        <small style="color: #666;">${this.escapeHtml(simulado.descricao || 'Sem descrição')}</small>
                    </td>
                    <td>
                        <span class="cert-level" style="font-size: 0.85rem;">${simulado.categoria || 'Geral'}</span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="user-avatar-sm">${nomeUsuario.substring(0, 2)}</div>
                            <span>${nomeUsuario}</span>
                        </div>
                    </td>
                    <td>${dataFormatada}</td>
                    <td>${tamanhoFormatado}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>${simulado.visualizacoes || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <a href="${simulado.arquivo_url}" target="_blank" class="btn btn-primary btn-table">
                                <i class="fas fa-eye"></i>
                            </a>
                            <button class="btn btn-warning btn-table" onclick="admin.verDetalhesSimulado('${simulado.id}')">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button class="btn btn-danger btn-table" onclick="admin.confirmarExclusaoSimulado('${simulado.id}', '${this.escapeHtml(simulado.nome)}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Atualizar contadores
        document.getElementById('simuladosShowing').textContent = this.simulados.length;
        document.getElementById('simuladosTotal').textContent = this.pagination.totalItems;
    }

    toggleSelecionarSimulado(id) {
        if (this.selectedSimulados.has(id)) {
            this.selectedSimulados.delete(id);
        } else {
            this.selectedSimulados.add(id);
        }
        
        // Atualizar interface
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('selected');
        }
        
        // Atualizar botão de excluir múltiplos
        this.atualizarBotaoExcluirMultiplos();
    }

    selecionarTodosSimulados() {
        const selectAll = document.getElementById('selectAllSimulados');
        const checkboxes = document.querySelectorAll('.table-checkbox');
        
        if (selectAll.checked) {
            // Selecionar todos
            this.simulados.forEach(simulado => {
                this.selectedSimulados.add(simulado.id);
            });
            checkboxes.forEach(cb => cb.checked = true);
            document.querySelectorAll('tr[data-id]').forEach(row => row.classList.add('selected'));
        } else {
            // Desmarcar todos
            this.selectedSimulados.clear();
            checkboxes.forEach(cb => cb.checked = false);
            document.querySelectorAll('tr[data-id]').forEach(row => row.classList.remove('selected'));
        }
        
        this.atualizarBotaoExcluirMultiplos();
    }

    atualizarBotaoExcluirMultiplos() {
        const btnExcluir = document.getElementById('btnExcluirMultiplos');
        if (btnExcluir) {
            btnExcluir.disabled = this.selectedSimulados.size === 0;
            btnExcluir.innerHTML = `<i class="fas fa-trash"></i> Excluir (${this.selectedSimulados.size})`;
        }
    }

    async verDetalhesSimulado(id) {
        try {
            // Buscar detalhes do simulado
            const { data: simulado, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    usuario_perfil:nome_completo,
                    usuario_perfil:email
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            // Buscar informações do arquivo no storage
            let arquivoInfo = 'Informações do arquivo não disponíveis';
            if (simulado.arquivo_url) {
                const urlParts = simulado.arquivo_url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                arquivoInfo = `
                    <strong>Arquivo:</strong> ${fileName}<br>
                    <strong>Tamanho:</strong> ${simulado.arquivo_tamanho_kb} KB<br>
                    <strong>URL:</strong> <a href="${simulado.arquivo_url}" target="_blank">${simulado.arquivo_url}</a>
                `;
            }
            
            // Formatar datas
            const dataUpload = new Date(simulado.data_upload).toLocaleString('pt-BR');
            const dataAtualizacao = simulado.data_atualizacao ? 
                new Date(simulado.data_atualizacao).toLocaleString('pt-BR') : 'Não atualizado';
            
            // Criar conteúdo do modal
            const content = document.getElementById('detalhesSimuladoContent');
            content.innerHTML = `
                <div class="simulado-detalhes">
                    <h4 style="margin-bottom: 15px; color: #2c3e50;">${this.escapeHtml(simulado.nome)}</h4>
                    
                    <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div class="detail-item">
                            <label>Categoria</label>
                            <p><span class="cert-level">${simulado.categoria || 'Geral'}</span></p>
                        </div>
                        <div class="detail-item">
                            <label>Status</label>
                            <p><span class="status-badge ${simulado.status === 'ativo' ? 'status-ativo' : 'status-inativo'}">${simulado.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></p>
                        </div>
                        <div class="detail-item">
                            <label>Público</label>
                            <p>${simulado.publico ? 'Sim' : 'Não'}</p>
                        </div>
                        <div class="detail-item">
                            <label>Visualizações</label>
                            <p>${simulado.visualizacoes || 0}</p>
                        </div>
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 20px;">
                        <label>Descrição</label>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            ${this.escapeHtml(simulado.descricao || 'Sem descrição')}
                        </div>
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 20px;">
                        <label>Informações do Arquivo</label>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            ${arquivoInfo}
                        </div>
                    </div>
                    
                    <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div class="detail-item">
                            <label>Usuário</label>
                            <p>${this.escapeHtml(simulado.usuario_perfil?.nome_completo || 'Desconhecido')}</p>
                        </div>
                        <div class="detail-item">
                            <label>Email</label>
                            <p>${simulado.usuario_perfil?.email || 'Não disponível'}</p>
                        </div>
                        <div class="detail-item">
                            <label>Data de Upload</label>
                            <p>${dataUpload}</p>
                        </div>
                        <div class="detail-item">
                            <label>Última Atualização</label>
                            <p>${dataAtualizacao}</p>
                        </div>
                    </div>
                    
                    <div class="modal-actions" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end;">
                        <a href="${simulado.arquivo_url}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i> Abrir Simulado
                        </a>
                        <button class="btn btn-danger" onclick="admin.confirmarExclusaoSimulado('${simulado.id}', '${this.escapeHtml(simulado.nome)}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
            
            // Mostrar modal
            document.getElementById('modalDetalhesSimulado').style.display = 'flex';
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            this.showToast('Erro ao carregar detalhes do simulado', 'error');
        }
    }

    fecharModalDetalhes() {
        document.getElementById('modalDetalhesSimulado').style.display = 'none';
    }

    confirmarExclusaoSimulado(id, nome) {
        this.simuladoParaExcluir = { id, nome };
        
        const texto = document.getElementById('confirmacaoTexto');
        if (texto) {
            texto.textContent = `Tem certeza que deseja excluir o simulado "${nome}"? Esta ação não pode ser desfeita.`;
        }
        
        // Resetar checkbox
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (checkbox) checkbox.checked = false;
        
        // Mostrar modal
        document.getElementById('modalConfirmarExclusaoAdmin').style.display = 'flex';
    }

    fecharModalConfirmacao() {
        document.getElementById('modalConfirmarExclusaoAdmin').style.display = 'none';
        this.simuladoParaExcluir = null;
    }

    async executarExclusaoSimulado() {
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (!checkbox || !checkbox.checked) {
            this.showToast('Confirme a exclusão marcando a caixa de confirmação', 'warning');
            return;
        }
        
        if (!this.simuladoParaExcluir) {
            this.showToast('Nenhum simulado selecionado para exclusão', 'error');
            return;
        }
        
        const { id, nome } = this.simuladoParaExcluir;
        const btnExecutar = document.getElementById('btnExecutarExclusao');
        
        try {
            // Desabilitar botão e mostrar loading
            btnExecutar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
            btnExecutar.disabled = true;
            
            console.log(`🗑️ Excluindo simulado ${id}: ${nome}`);
            
            // 1. Buscar simulado para obter informações do arquivo
            const { data: simulado, error: fetchError } = await this.supabase
                .from('simulados')
                .select('*')
                .eq('id', id)
                .single();
            
            if (fetchError) throw fetchError;
            
            // 2. Excluir arquivo do storage (se existir)
            if (simulado.arquivo_url) {
                try {
                    const urlParts = simulado.arquivo_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const filePath = `${simulado.usuario_id}/${fileName}`;
                    
                    const { error: storageError } = await this.supabase.storage
                        .from('simulados')
                        .remove([filePath]);
                    
                    if (storageError) {
                        console.warn(`⚠️ Não foi possível excluir arquivo:`, storageError);
                    } else {
                        console.log(`✅ Arquivo ${filePath} excluído do storage`);
                    }
                } catch (storageErr) {
                    console.warn(`⚠️ Erro ao excluir arquivo:`, storageErr);
                }
            }
            
            // 3. Excluir registro do banco de dados
            const { error: deleteError } = await this.supabase
                .from('simulados')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            
            console.log(`✅ Simulado ${id} excluído com sucesso`);
            
            // Fechar modais
            this.fecharModalConfirmacao();
            this.fecharModalDetalhes();
            
            // Mostrar notificação
            this.showToast(`Simulado "${nome}" excluído com sucesso`, 'success');
            
            // Recarregar lista
            setTimeout(() => {
                this.carregarSimulados();
                btnExecutar.innerHTML = '<i class="fas fa-trash"></i> Excluir Permanentemente';
                btnExecutar.disabled = false;
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro ao excluir simulado:', error);
            this.showToast(`Erro ao excluir simulado: ${error.message}`, 'error');
            
            // Restaurar botão
            btnExecutar.innerHTML = '<i class="fas fa-trash"></i> Excluir Permanentemente';
            btnExecutar.disabled = false;
        }
    }

    async excluirMultiplosSimulados() {
        if (this.selectedSimulados.size === 0) {
            this.showToast('Selecione pelo menos um simulado para excluir', 'warning');
            return;
        }
        
        const nomes = Array.from(this.selectedSimulados).map(id => {
            const simulado = this.simulados.find(s => s.id === id);
            return simulado?.nome || `Simulado ${id}`;
        });
        
        // Criar mensagem de confirmação
        const texto = document.getElementById('confirmacaoTexto');
        if (texto) {
            if (this.selectedSimulados.size === 1) {
                texto.textContent = `Tem certeza que deseja excluir o simulado "${nomes[0]}"?`;
            } else {
                texto.textContent = `Tem certeza que deseja excluir ${this.selectedSimulados.size} simulados selecionados? Esta ação não pode ser desfeita.`;
            }
        }
        
        // Resetar checkbox
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (checkbox) checkbox.checked = false;
        
        // Mostrar modal
        document.getElementById('modalConfirmarExclusaoAdmin').style.display = 'flex';
        
        // Armazenar função de exclusão múltipla
        this.exclusaoMultipla = true;
    }

    async executarExclusaoMultipla() {
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (!checkbox || !checkbox.checked) {
            this.showToast('Confirme a exclusão marcando a caixa de confirmação', 'warning');
            return;
        }
        
        if (this.selectedSimulados.size === 0) {
            this.showToast('Nenhum simulado selecionado para exclusão', 'error');
            return;
        }
        
        const btnExecutar = document.getElementById('btnExecutarExclusao');
        const ids = Array.from(this.selectedSimulados);
        
        try {
            // Desabilitar botão e mostrar loading
            btnExecutar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
            btnExecutar.disabled = true;
            
            console.log(`🗑️ Excluindo ${ids.length} simulados`);
            
            let sucessos = 0;
            let erros = 0;
            
            // Excluir cada simulado
            for (const id of ids) {
                try {
                    // Buscar simulado
                    const { data: simulado, error: fetchError } = await this.supabase
                        .from('simulados')
                        .select('*')
                        .eq('id', id)
                        .single();
                    
                    if (fetchError) {
                        console.error(`❌ Erro ao buscar simulado ${id}:`, fetchError);
                        erros++;
                        continue;
                    }
                    
                    // Excluir arquivo do storage
                    if (simulado.arquivo_url) {
                        try {
                            const urlParts = simulado.arquivo_url.split('/');
                            const fileName = urlParts[urlParts.length - 1];
                            const filePath = `${simulado.usuario_id}/${fileName}`;
                            
                            await this.supabase.storage
                                .from('simulados')
                                .remove([filePath]);
                        } catch (storageErr) {
                            console.warn(`⚠️ Erro ao excluir arquivo ${id}:`, storageErr);
                        }
                    }
                    
                    // Excluir registro
                    const { error: deleteError } = await this.supabase
                        .from('simulados')
                        .delete()
                        .eq('id', id);
                    
                    if (deleteError) {
                        console.error(`❌ Erro ao excluir registro ${id}:`, deleteError);
                        erros++;
                    } else {
                        sucessos++;
                        console.log(`✅ Simulado ${id} excluído`);
                    }
                    
                } catch (err) {
                    console.error(`❌ Erro ao processar simulado ${id}:`, err);
                    erros++;
                }
            }
            
            // Fechar modal
            this.fecharModalConfirmacao();
            this.exclusaoMultipla = false;
            
            // Mostrar resultado
            if (sucessos > 0) {
                this.showToast(`${sucessos} simulado(s) excluído(s) com sucesso`, 'success');
            }
            if (erros > 0) {
                this.showToast(`${erros} simulado(s) não puderam ser excluídos`, 'error');
            }
            
            // Limpar seleção
            this.selectedSimulados.clear();
            
            // Recarregar lista
            setTimeout(() => {
                this.carregarSimulados();
                btnExecutar.innerHTML = '<i class="fas fa-trash"></i> Excluir Permanentemente';
                btnExecutar.disabled = false;
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro geral na exclusão múltipla:', error);
            this.showToast('Erro ao excluir simulados', 'error');
            
            // Restaurar botão
            btnExecutar.innerHTML = '<i class="fas fa-trash"></i> Excluir Permanentemente';
            btnExecutar.disabled = false;
        }
    }

    buscarSimulados() {
        const searchTerm = document.getElementById('searchSimulados').value.toLowerCase();
        const rows = document.querySelectorAll('#simuladosTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    filtrarSimulados() {
        const status = document.getElementById('filterStatus').value;
        const categoria = document.getElementById('filterCategoria').value;
        
        // Aqui você implementaria a filtragem no backend
        // Por enquanto, vamos apenas recarregar
        this.carregarSimulados();
    }

    // ==================== PAGINAÇÃO ====================
    atualizarPaginacao() {
        const totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
        
        // Atualizar informações
        document.getElementById('paginationInfo').textContent = 
            `Página ${this.pagination.currentPage} de ${totalPages}`;
        
        // Habilitar/desabilitar botões
        document.getElementById('btnPrev').disabled = this.pagination.currentPage === 1;
        document.getElementById('btnNext').disabled = this.pagination.currentPage === totalPages;
    }

    proximaPagina() {
        const totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
        if (this.pagination.currentPage < totalPages) {
            this.pagination.currentPage++;
            this.carregarSimulados();
        }
    }

    paginaAnterior() {
        if (this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
            this.carregarSimulados();
        }
    }

    // ==================== GERENCIAR USUÁRIOS ====================
    async carregarUsuarios() {
        try {
            // Buscar usuários (apenas exemplo - na prática você teria uma tabela de usuários)
            const { data: usuarios, error } = await this.supabase
                .from('usuario_perfil')
                .select('*')
                .order('data_criacao', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            this.usuarios = usuarios || [];
            this.renderizarTabelaUsuarios();
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            this.showToast('Erro ao carregar usuários', 'error');
        }
    }

    renderizarTabelaUsuarios() {
        const tbody = document.getElementById('usuariosTableBody');
        if (!tbody) return;
        
        if (this.usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Nenhum usuário encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        this.usuarios.forEach(usuario => {
            const dataRegistro = new Date(usuario.data_criacao).toLocaleDateString('pt-BR');
            const nome = usuario.nome_completo || 'Usuário Sem Nome';
            const inicial = nome.substring(0, 2).toUpperCase();
            
            html += `
                <tr>
                    <td>
                        <div class="user-avatar-sm">${inicial}</div>
                    </td>
                    <td>
                        <strong>${this.escapeHtml(nome)}</strong><br>
                        <small style="color: #666;">ID: ${usuario.id.substring(0, 8)}...</small>
                    </td>
                    <td>
                        <span style="color: #3498db;">${usuario.email || 'Não informado'}</span>
                    </td>
                    <td>${dataRegistro}</td>
                    <td>
                        <span class="status-badge status-ativo">Ativo</span>
                    </td>
                    <td>
                        <span class="badge" style="background: #e8f4fd; color: #2980b9; padding: 4px 8px; border-radius: 12px;">
                            ${usuario.total_simulados || 0}
                        </span>
                    </td>
                    <td>
                        ${usuario.ultimo_login ? new Date(usuario.ultimo_login).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td>
                        <button class="btn btn-primary btn-table" onclick="admin.verPerfilUsuario('${usuario.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    buscarUsuarios() {
        const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
        const rows = document.querySelectorAll('#usuariosTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    verPerfilUsuario(userId) {
        // Implementar visualização de perfil do usuário
        this.showToast('Funcionalidade em desenvolvimento', 'info');
    }

    // ==================== UTILITÁRIOS ====================
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remover após 5 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    configurarEventos() {
        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.fecharModalDetalhes();
                this.fecharModalConfirmacao();
            }
        });
        
        // Fechar modais ao clicar fora
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    if (modal.id === 'modalDetalhesSimulado') {
                        this.fecharModalDetalhes();
                    } else if (modal.id === 'modalConfirmarExclusaoAdmin') {
                        this.fecharModalConfirmacao();
                    }
                }
            });
        });
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.showToast('Sessão encerrada. Redirecionando...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            this.showToast('Erro ao fazer logout', 'error');
        }
    }
}

// Inicializar painel admin quando o DOM estiver pronto
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminPanel();
    window.admin = admin; // Tornar global
});

// Funções globais
window.executarExclusaoSimulado = () => {
    if (admin.exclusaoMultipla) {
        admin.executarExclusaoMultipla();
    } else {
        admin.executarExclusaoSimulado();
    }
};
