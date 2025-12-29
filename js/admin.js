// Admin Panel Application - VERSÃO SIMPLIFICADA
class AdminPanel {
    constructor() {
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
        console.log('🎯 Inicializando Painel Admin (Modo Desenvolvimento)');
        
        try {
            // ⭐⭐ PERMITIR ACESSO SEM VERIFICAÇÃO ⭐⭐
            this.allowAccessWithoutVerification();
            
            // Carregar interface
            this.carregarInterface();
            
            // Carregar dados
            await this.carregarDadosIniciais();
            
            // Configurar eventos
            this.configurarEventos();
            
            console.log('✅ Painel Admin carregado com sucesso!');
            
        } catch (err) {
            console.error('❌ Erro:', err);
            this.showToast('Erro ao carregar painel', 'error');
        }
    }

    allowAccessWithoutVerification() {
        console.log('🔓 Modo desenvolvimento: Acesso livre permitido');
        
        // Criar usuário de desenvolvimento
        this.currentUser = {
            id: 'dev-' + Date.now(),
            email: 'admin@example.com',
            user_metadata: { full_name: 'Administrador' }
        };
        
        // Configurar dados de admin
        this.adminData = {
            role: 'super_admin',
            permissions: ['view_dashboard', 'manage_simulados', 'manage_users', 'manage_forum', 'view_reports', 'manage_settings']
        };
        
        // Salvar no localStorage
        localStorage.setItem('admin_role', 'super_admin');
        localStorage.setItem('admin_permissions', JSON.stringify(this.adminData.permissions));
        localStorage.setItem('authenticated', 'true');
        
        console.log('✅ Acesso configurado para:', this.currentUser.email);
    }

    carregarInterface() {
        // Atualizar perfil
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        const adminGreeting = document.getElementById('adminGreeting');
        
        if (adminName) adminName.textContent = 'Administrador';
        if (adminGreeting) adminGreeting.textContent = 'Administrador';
        if (adminEmail) adminEmail.textContent = 'admin@example.com';
        if (adminAvatar) adminAvatar.textContent = 'AD';
        
        // Configurar navegação
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.mostrarSecao(section);
            });
        });
    }

    async carregarDadosIniciais() {
        // Carregar estatísticas
        this.carregarEstatisticas();
        
        // Carregar atividades
        this.carregarAtividadeRecente();
        
        // Carregar alertas
        this.carregarAlertas();
    }

    carregarEstatisticas() {
        // Dados de exemplo
        const stats = {
            usuarios: 42,
            simulados: 18,
            posts: 56,
            armazenamento: '156 MB'
        };
        
        // Atualizar UI
        document.getElementById('totalUsuarios').textContent = stats.usuarios;
        document.getElementById('totalSimulados').textContent = stats.simulados;
        document.getElementById('totalPosts').textContent = stats.posts;
        document.getElementById('totalArmazenamento').textContent = stats.armazenamento;
        
        // Badges
        document.getElementById('badgeUsuarios').textContent = stats.usuarios;
        document.getElementById('badgeSimulados').textContent = stats.simulados;
        document.getElementById('badgeForum').textContent = stats.posts;
        
        // Sidebar
        document.getElementById('visitasHoje').textContent = 24;
        document.getElementById('uploadsHoje').textContent = 3;
    }

    carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        const atividades = [
            { icon: 'fa-sign-in-alt', color: '#3498db', title: 'Login de administrador', user: 'Admin', time: 'Agora' },
            { icon: 'fa-upload', color: '#27ae60', title: 'Simulado publicado', user: 'João Silva', time: '2h atrás' },
            { icon: 'fa-user-plus', color: '#9b59b6', title: 'Novo usuário', user: 'maria@email.com', time: '4h atrás' },
            { icon: 'fa-comment', color: '#f39c12', title: 'Novo post', user: 'Carlos Santos', time: '1 dia atrás' }
        ];
        
        container.innerHTML = atividades.map(a => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${a.color}">
                    <i class="fas ${a.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${a.title}</h4>
                    <p>${a.user}</p>
                </div>
                <div class="activity-time">${a.time}</div>
            </div>
        `).join('');
    }

    carregarAlertas() {
        const container = document.getElementById('alertList');
        if (!container) return;
        
        container.innerHTML = `
            <div class="alert-placeholder">
                <i class="fas fa-check-circle"></i>
                <p>Tudo funcionando normalmente</p>
            </div>
        `;
    }

    mostrarSecao(sectionId) {
        // Esconder todas as seções
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        
        // Remover active do menu
        document.querySelectorAll('.admin-menu-item').forEach(item => item.classList.remove('active'));
        
        // Mostrar seção
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
        
        // Ativar menu
        const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (menuItem) menuItem.classList.add('active');
        
        this.currentSection = sectionId;
    }

    configurarEventos() {
        // Botão logout
        document.querySelectorAll('[onclick*="logout"]').forEach(btn => {
            btn.onclick = () => this.logout();
        });
        
        // Botões da tabela de simulados
        document.getElementById('selectAllSimulados')?.addEventListener('change', (e) => {
            this.selecionarTodosSimulados(e.target.checked);
        });
        
        // Paginação
        document.getElementById('btnPrev')?.addEventListener('click', () => this.paginaAnterior());
        document.getElementById('btnNext')?.addEventListener('click', () => this.proximaPagina());
    }

    // Métodos de exemplo para simulados
    selecionarTodosSimulados(checked) {
        const checkboxes = document.querySelectorAll('.simulado-checkbox');
        checkboxes.forEach(cb => cb.checked = checked);
        
        const btn = document.getElementById('btnExcluirMultiplos');
        if (btn) btn.disabled = !checked;
    }

    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.atualizarPaginacao();
        }
    }

    proximaPagina() {
        this.paginaAtual++;
        this.atualizarPaginacao();
    }

    atualizarPaginacao() {
        const info = document.getElementById('paginationInfo');
        if (info) info.textContent = `Página ${this.paginaAtual}`;
        
        const btnPrev = document.getElementById('btnPrev');
        if (btnPrev) btnPrev.disabled = this.paginaAtual <= 1;
    }

    logout() {
        this.showToast('Saindo do painel admin...', 'info');
        setTimeout(() => {
            // Limpar localStorage
            localStorage.removeItem('admin_role');
            localStorage.removeItem('admin_permissions');
            localStorage.removeItem('authenticated');
            
            // Redirecionar para index
            window.location.href = 'index.html';
        }, 1000);
    }

    showToast(message, type = 'info') {
        console.log(`Toast [${type}]: ${message}`);
        
        // Implementação simples de toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : 
                         type === 'error' ? '#e74c3c' : 
                         type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 99999;
            animation: slideInRight 0.3s ease;
        `;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span style="margin-left: 10px;">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Painel Admin...');
    window.admin = new AdminPanel();
});
