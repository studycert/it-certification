// api.js - API functions for StudyCert
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://lkguubynwngnewucgewx.supabase.co',
    'sb_publishable_XIFYyZ49NHXHuDVbFSpWOA_Ovd1CEd3'
);

export class StudyCertAPI {
    // ==================== USUÁRIOS ====================
    static async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    static async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    }

    static async updateUserProfile(userId, updates) {
        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', userId);
        
        if (error) throw error;
        return data;
    }

    // ==================== MATERIAIS ====================
    static async getMaterials(category = null, limit = 10, offset = 0) {
        let query = supabase
            .from('materiais')
            .select(`
                *,
                usuarios:nome
            `)
            .eq('status', 'aprovado')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (category) {
            query = query.eq('categoria', category);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    static async uploadMaterial(file, metadata) {
        // 1. Upload do arquivo para storage
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('materiais')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
            .from('materiais')
            .getPublicUrl(fileName);
        
        // 3. Salvar metadados no banco
        const { data: dbData, error: dbError } = await supabase
            .from('materiais')
            .insert({
                titulo: metadata.titulo,
                descricao: metadata.descricao,
                tipo: metadata.tipo,
                tamanho_mb: (file.size / (1024 * 1024)).toFixed(2),
                nome_arquivo: file.name,
                caminho_arquivo: urlData.publicUrl,
                usuario_id: metadata.usuario_id,
                categoria: metadata.categoria,
                tags: metadata.tags || [],
                nivel_dificuldade: metadata.nivel_dificuldade || 'intermediario',
                idioma: metadata.idioma || 'portugues',
                status: 'pendente'
            })
            .select()
            .single();
        
        if (dbError) throw dbError;
        
        return dbData;
    }

    static async incrementMaterialViews(materialId) {
        const { data, error } = await supabase.rpc('increment_views', {
            material_id: materialId
        });
        
        if (error) throw error;
        return data;
    }

    // ==================== SIMULADOS ====================
    static async getSimulados(certificacaoId = null, limit = 10, offset = 0) {
        let query = supabase
            .from('simulados')
            .select(`
                *,
                certificacoes:nome,
                usuarios:nome
            `)
            .eq('status', 'aprovado')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (certificacaoId) {
            query = query.eq('certificacao_id', certificacaoId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    static async uploadSimulado(file, metadata) {
        // 1. Upload do arquivo para storage
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('simulados')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Obter URL pública
        const { data: urlData } = supabase.storage
            .from('simulados')
            .getPublicUrl(fileName);
        
        // 3. Salvar metadados
        const { data: dbData, error: dbError } = await supabase
            .from('simulados')
            .insert({
                nome: metadata.nome,
                descricao: metadata.descricao,
                certificacao_id: metadata.certificacao_id,
                total_questoes: metadata.total_questoes,
                tempo_estimado_minutos: metadata.tempo_estimado_minutos,
                nivel_dificuldade: metadata.nivel_dificuldade || 'intermediario',
                arquivo_url: urlData.publicUrl,
                usuario_id: metadata.usuario_id,
                tags: metadata.tags || [],
                status: 'pendente'
            })
            .select()
            .single();
        
        if (dbError) throw dbError;
        
        return dbData;
    }

    // ==================== FORUM ====================
    static async getForumPosts(categoryId = null, limit = 20, offset = 0) {
        let query = supabase
            .from('forum_posts')
            .select(`
                *,
                forum_categorias:nome,
                usuarios:nome
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (categoryId) {
            query = query.eq('categoria_id', categoryId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    static async createForumPost(postData) {
        const { data, error } = await supabase
            .from('forum_posts')
            .insert({
                titulo: postData.titulo,
                conteudo: postData.conteudo,
                categoria_id: postData.categoria_id,
                usuario_id: postData.usuario_id,
                tags: postData.tags || []
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async getPostReplies(postId) {
        const { data, error } = await supabase
            .from('forum_respostas')
            .select(`
                *,
                usuarios:nome
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    // ==================== PROGRESSO ====================
    static async getUserProgress(userId) {
        const { data, error } = await supabase
            .from('progresso_usuario')
            .select(`
                *,
                certificacoes:nome
            `)
            .eq('usuario_id', userId);
        
        if (error) throw error;
        return data;
    }

    static async updateProgress(userId, certificacaoId, progressData) {
        const { data, error } = await supabase
            .from('progresso_usuario')
            .upsert({
                usuario_id: userId,
                certificacao_id: certificacaoId,
                ...progressData
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // ==================== CERTIFICAÇÕES ====================
    static async getCertificacoes(limit = 50) {
        const { data, error } = await supabase
            .from('certificacoes')
            .select('*')
            .eq('ativo', true)
            .order('popularidade', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data;
    }

    static async getCertificacaoById(id) {
        const { data, error } = await supabase
            .from('certificacoes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    // ==================== ESTATÍSTICAS ====================
    static async getStats() {
        // Obter várias estatísticas em paralelo
        const [
            totalUsers,
            totalMaterials,
            totalSimulados,
            totalPosts
        ] = await Promise.all([
            supabase.from('usuarios').select('count', { count: 'exact' }),
            supabase.from('materiais').select('count', { count: 'exact' }).eq('status', 'aprovado'),
            supabase.from('simulados').select('count', { count: 'exact' }).eq('status', 'aprovado'),
            supabase.from('forum_posts').select('count', { count: 'exact' })
        ]);
        
        return {
            totalUsers: totalUsers.count || 0,
            totalMaterials: totalMaterials.count || 0,
            totalSimulados: totalSimulados.count || 0,
            totalPosts: totalPosts.count || 0
        };
    }

    // ==================== AUTENTICAÇÃO ====================
    static async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Criar/atualizar perfil do usuário
        if (data.user) {
            await this.createUserProfile(data.user);
        }
        
        return data;
    }

    static async signUp(email, password, userData) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userData.nome,
                    ...userData
                }
            }
        });
        
        if (error) throw error;
        
        // Criar perfil do usuário
        if (data.user) {
            await this.createUserProfile(data.user, userData);
        }
        
        return data;
    }

    static async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    static async createUserProfile(user, additionalData = {}) {
        const { data, error } = await supabase
            .from('usuarios')
            .upsert({
                id: user.id,
                email: user.email,
                nome: user.user_metadata?.full_name || additionalData.nome || user.email.split('@')[0],
                data_nascimento: additionalData.data_nascimento,
                telefone: additionalData.telefone,
                pais: additionalData.pais,
                cidade: additionalData.cidade,
                nivel_experiencia: additionalData.nivel_experiencia || 'iniciante'
            });
        
        if (error) throw error;
        return data;
    }

    // ==================== HELPER FUNCTIONS ====================
    static async uploadFile(bucket, file, path = null) {
        const fileName = path || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Retornar URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return {
            path: fileName,
            url: urlData.publicUrl
        };
    }

    static async downloadFile(bucket, path) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);
        
        if (error) throw error;
        return data;
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================
    static subscribeToForum(callback) {
        return supabase
            .channel('forum-posts')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'forum_posts' }, 
                callback
            )
            .subscribe();
    }

    static subscribeToMaterials(callback) {
        return supabase
            .channel('materiais')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'materiais' }, 
                callback
            )
            .subscribe();
    }
}

// Exportar para uso global
window.StudyCertAPI = StudyCertAPI;

// Exportar para módulos ES6
export default StudyCertAPI;