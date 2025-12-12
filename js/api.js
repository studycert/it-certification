// js/api.js - API Helper
class StudyCertAPI {
    constructor() {
        this.supabase = null;
        this.initialize();
    }

    initialize() {
        try {
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            console.log('✅ API inicializada');
        } catch (error) {
            console.error('❌ Erro ao inicializar API:', error);
        }
    }

    async uploadSimulado(file, nome, descricao, certificacaoId) {
        try {
            if (!this.supabase) throw new Error('API não inicializada');
            
            // Upload do arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('simulados')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            // Obter URL do arquivo
            const { data: urlData } = this.supabase.storage
                .from('simulados')
                .getPublicUrl(fileName);
            
            // Salvar no banco de dados
            const { data: simuladoData, error: dbError } = await this.supabase
                .from('simulados')
                .insert({
                    nome: nome,
                    descricao: descricao,
                    certificacao_id: certificacaoId,
                    total_questoes: 0,
                    arquivo_url: urlData.publicUrl,
                    usuario_id: (await this.supabase.auth.getSession()).data.session?.user?.id,
                    status: 'pendente'
                });
            
            if (dbError) throw dbError;
            
            return { success: true, data: simuladoData };
            
        } catch (error) {
            console.error('❌ Erro ao fazer upload:', error);
            return { success: false, error: error.message };
        }
    }

    async getCertificacoes() {
        try {
            const { data, error } = await this.supabase
                .from('certificacoes')
                .select('*')
                .eq('ativo', true)
                .order('nome');
            
            if (error) throw error;
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Erro ao buscar certificações:', error);
            return { success: false, error: error.message };
        }
    }

    async getMateriais(categoria = null) {
        try {
            let query = this.supabase
                .from('materiais')
                .select('*')
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false });
            
            if (categoria) {
                query = query.eq('categoria', categoria);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Erro ao buscar materiais:', error);
            return { success: false, error: error.message };
        }
    }
}

export default StudyCertAPI;
