// app.js
import { StudyCertAPI } from './api.js';
import { AuthService } from './auth.js';
import { checkDatabaseConnection } from './supabase_setup.js';

class StudyCertApp {
  constructor() {
    this.init();
  }

  async init() {
    console.log('🚀 Iniciando StudyCert App...');
    
    // Verificar conexão
    const connection = await checkDatabaseConnection();
    if (!connection.connected) {
      this.showError('Não foi possível conectar ao banco de dados');
      return;
    }

    // Verificar autenticação
    const user = await AuthService.getCurrentUser();
    if (user) {
      this.user = user;
      this.userProfile = await AuthService.getUserProfile();
      this.loadAuthenticatedContent();
    } else {
      this.loadPublicContent();
    }

    // Carregar dados iniciais
    this.loadInitialData();
  }

  async loadInitialData() {
    try {
      // Carregar certificações
      const { data: certificacoes, error: certError } = await StudyCertAPI.getCertificacoes();
      if (!certError) {
        this.renderCertificacoes(certificacoes);
      }

      // Carregar materiais populares
      const { data: materiais, error: matError } = await StudyCertAPI.getMateriais({
        limit: 6
      });
      if (!matError) {
        this.renderMateriais(materiais);
      }

      // Carregar categorias do fórum
      const { data: forumPosts, error: forumError } = await StudyCertAPI.getForumPosts();
      if (!forumError) {
        this.renderForumPosts(forumPosts);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  renderCertificacoes(certificacoes) {
    const container = document.getElementById('certificacoes-container');
    if (!container) return;

    container.innerHTML = certificacoes.map(cert => `
      <div class="cert-card">
        <div class="cert-icon">
          <i class="${cert.icon_name || 'fas fa-certificate'}"></i>
        </div>
        <div class="cert-info">
          <h3>${cert.nome}</h3>
          <p class="cert-fornecedor">${cert.fornecedor}</p>
          <p class="cert-nivel">Nível: ${cert.nivel}</p>
          <p class="cert-dificuldade">Dificuldade: ${this.getDificuldadeLabel(cert.dificuldade)}</p>
          <button class="btn btn-outline" onclick="app.verCertificacao('${cert.id}')">
            Ver detalhes
          </button>
        </div>
      </div>
    `).join('');
  }

  renderMateriais(materiais) {
    const container = document.getElementById('materiais-container');
    if (!container) return;

    container.innerHTML = materiais.map(material => `
      <div class="material-card">
        <div class="material-type ${material.tipo}">
          <i class="${this.getMaterialIcon(material.tipo)}"></i>
        </div>
        <div class="material-info">
          <h4>${material.titulo}</h4>
          <p class="material-category">${material.categoria}</p>
          <div class="material-stats">
            <span><i class="fas fa-eye"></i> ${material.visualizacoes}</span>
            <span><i class="fas fa-download"></i> ${material.downloads}</span>
            <span><i class="fas fa-heart"></i> ${material.curtidas}</span>
          </div>
          <button class="btn btn-sm" onclick="app.verMaterial('${material.id}')">
            Ver material
          </button>
        </div>
      </div>
    `).join('');
  }

  getMaterialIcon(tipo) {
    const icons = {
      'pdf': 'fas fa-file-pdf',
      'ppt': 'fas fa-file-powerpoint',
      'doc': 'fas fa-file-word',
      'video': 'fas fa-video',
      'zip': 'fas fa-file-archive',
      'link': 'fas fa-link'
    };
    return icons[tipo] || 'fas fa-file';
  }

  getDificuldadeLabel(dificuldade) {
    const labels = {
      'facil': 'Fácil',
      'intermediario': 'Intermediário',
      'dificil': 'Difícil',
      'avancado': 'Avançado'
    };
    return labels[dificuldade] || dificuldade;
  }

  async verMaterial(id) {
    const { data: material, error } = await StudyCertAPI.getMaterialById(id);
    if (error) {
      this.showError('Erro ao carregar material');
      return;
    }

    // Mostrar modal ou redirecionar
    this.showMaterialModal(material);
  }

  showMaterialModal(material) {
    // Implementar modal
    console.log('Mostrando material:', material);
  }

  showError(message) {
    // Implementar exibição de erro
    console.error('Erro:', message);
  }

  loadAuthenticatedContent() {
    // Carregar conteúdo para usuários logados
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.anon-only').forEach(el => {
      el.style.display = 'none';
    });

    // Atualizar perfil
    if (this.userProfile) {
      const profileEl = document.getElementById('user-profile');
      if (profileEl) {
        profileEl.innerHTML = `
          <img src="${this.userProfile.foto_url || 'default-avatar.png'}" 
               alt="${this.userProfile.nome}" class="avatar">
          <span>${this.userProfile.nome}</span>
        `;
      }
    }
  }

  loadPublicContent() {
    // Carregar conteúdo público
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.anon-only').forEach(el => {
      el.style.display = 'block';
    });
  }
}

// Inicializar app
window.app = new StudyCertApp();
