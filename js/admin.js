// Admin Panel Application - VERSÃO SIMPLIFICADA E FUNCIONAL
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.adminData = null;
        this.currentSection = 'dashboard';
        this.simulados = [];
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando Painel Admin');
        
        try {
            // Permitir acesso sem verificação
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
        const userRoleBadge = document.getElementById('userRoleBadge');
        
        if (adminName) adminName.textContent = 'Administrador';
        if (adminEmail) adminEmail.textContent = 'admin@example.com';
        if (userRoleBadge) userRoleBadge.textContent = 'Super Admin';
        if (adminAvatar) {
            adminAvatar.textContent = 'AD';
            adminAvatar.style.background = 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)';
        }
    }

    async carregarDadosIniciais() {
        // Carregar estatísticas
        this.carregarEstatisticas();
        
        // Carregar atividades
        this.carregarAtividadeRecente();
    }

    carregarEstatisticas() {
        // Dados de exemplo
        setTimeout(() => {
            document.getElementById('totalUsuarios').textContent = '42';
            document.getElementById('totalSimulados').textContent = '18';
            document.getElementById('totalPosts').textContent = '56';
            document.getElementById('totalArmazenamento').textContent = '156 MB';
            
            // Badges
            document.getElementById('badgeUsuarios').textContent = '42';
            document.getElementById('badgeSimulados').textContent = '18';
            document.getElementById('badgeForum').textContent = '56';
            
            // Sidebar
            document.getElementById('visitasHoje').textContent = '24';
            document.getElementById('uploadsHoje').textContent = '3';
        }, 500);
    }

    carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        setTimeout(() => {
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
        }, 800);
    }

    configurarEventos() {
        // Botão logout
        document.querySelectorAll('[onclick*="logout"]').forEach(btn => {
            btn.onclick = () => this.logout();
        });
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
