// api.js
import { supabase } from './supabase_setup.js';
import { SUPABASE_CONFIG } from './config.js';

export class StudyCertAPI {
  // ==================== MATERIAIS ====================
  static async getMateriais(filters = {}) {
    let query = supabase
      .from('materiais')
      .select(`
        *,
        usuario:usuarios(nome, foto_url)
      `)
      .eq('status', 'aprovado');

    // Aplicar filtros
    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo);
    }
    if (filters.nivel_dificuldade) {
      query = query.eq('nivel_dificuldade', filters.nivel_dificuldade);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    if (filters.usuario_id) {
      query = query.eq('usuario_id', filters.usuario_id);
    }

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || SUPABASE_CONFIG.ITEMS_PER_PAGE.MATERIAIS;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    return { data, error, total: count, page, limit };
  }

  static async getMaterialById(id) {
    const { data, error } = await supabase
      .from('materiais')
      .select(`
        *,
        usuario:usuarios(*),
        comentarios:comentarios_materiais(*, usuario:usuarios(nome, foto_url))
      `)
      .eq('id', id)
      .eq('status', 'aprovado')
      .single();

    // Incrementar visualizações
    if (data) {
      await supabase.rpc('increment_visualizacoes', { material_id: id });
    }

    return { data, error };
  }

  static async createMaterial(materialData, file = null) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { error: 'Usuário não autenticado' };
    }

    let storagePath = null;
    
    // Upload do arquivo se existir
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${SUPABASE_CONFIG.STORAGE_BUCKET}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_CONFIG.STORAGE_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        return { error: uploadError.message };
      }

      storagePath = filePath;
    }

    // Inserir no banco
    const { data, error } = await supabase
      .from('materiais')
      .insert({
        ...materialData,
        usuario_id: user.data.user.id,
        storage_path: storagePath,
        nome_arquivo: file ? file.name : null,
        tamanho_mb: file ? (file.size / (1024 * 1024)).toFixed(2) : null,
        status: 'pendente'
      })
      .select()
      .single();

    return { data, error };
  }

  // ==================== CERTIFICAÇÕES ====================
  static async getCertificacoes(filters = {}) {
    let query = supabase
      .from('certificacoes')
      .select('*')
      .eq('ativo', true);

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }
    if (filters.nivel) {
      query = query.eq('nivel', filters.nivel);
    }
    if (filters.dificuldade) {
      query = query.eq('dificuldade', filters.dificuldade);
    }

    query = query.order('popularidade', { ascending: false })
      .order('nome', { ascending: true });

    const { data, error } = await query;
    return { data, error };
  }

  // ==================== SIMULADOS ====================
  static async getSimulados(filters = {}) {
    let query = supabase
      .from('simulados')
      .select(`
        *,
        certificacao:certificacoes(nome, fornecedor),
        usuario:usuarios(nome)
      `)
      .eq('status', 'aprovado');

    if (filters.certificacao_id) {
      query = query.eq('certificacao_id', filters.certificacao_id);
    }

    const page = filters.page || 1;
    const limit = filters.limit || SUPABASE_CONFIG.ITEMS_PER_PAGE.SIMULADOS;
    const from = (page - 1) * limit;

    query = query.range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;
    return { data, error, total: count };
  }

  // ==================== FÓRUM ====================
  static async getForumPosts(categoriaId = null) {
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        categoria:forum_categorias(nome, icone),
        usuario:usuarios(nome, foto_url, nivel_experiencia),
        respostas:forum_respostas(count)
      `);

    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    query = query.order('fixado', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(SUPABASE_CONFIG.ITEMS_PER_PAGE.FORUM_POSTS);

    const { data, error } = await query;
    return { data, error };
  }

  // ==================== PROGRESSO DO USUÁRIO ====================
  static async getProgressoUsuario() {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('progresso_usuario')
      .select(`
        *,
        certificacao:certificacoes(*)
      `)
      .eq('usuario_id', user.data.user.id);

    return { data, error };
  }

  static async updateProgresso(certificacaoId, progresso) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { error: 'Não autenticado' };

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('progresso_usuario')
      .select('id')
      .eq('usuario_id', user.data.user.id)
      .eq('certificacao_id', certificacaoId)
      .single();

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('progresso_usuario')
        .update(progresso)
        .eq('id', existing.id)
        .select()
        .single();

      return { data, error };
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('progresso_usuario')
        .insert({
          usuario_id: user.data.user.id,
          certificacao_id: certificacaoId,
          ...progresso
        })
        .select()
        .single();

      return { data, error };
    }
  }
}
