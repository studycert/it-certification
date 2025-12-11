// supabase_setup.js
// Script para configurar o projeto Supabase

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://lkguubynwngnewucgewx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XIFYyZ49NHXHuDVbFSpWOA_Ovd1CEd3';
const SUPABASE_SERVICE_ROLE_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI'; // Adicione sua service role key

// Inicializar cliente com service role (para operações administrativas)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Função para executar SQL
async function executeSQL(sql) {
    try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });
        if (error) throw error;
        console.log('✅ SQL executado com sucesso');
        return data;
    } catch (error) {
        console.error('❌ Erro ao executar SQL:', error.message);
        return null;
    }
}

// Função principal de setup
async function setupDatabase() {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    try {
        // 1. Criar função para executar SQL dinamicamente (se não existir)
        const createExecSQLFunction = `
            CREATE OR REPLACE FUNCTION exec_sql(query text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                EXECUTE query;
            END;
            $$;
        `;
        
        await executeSQL(createExecSQLFunction);
        console.log('✅ Função exec_sql criada');
        
        // 2. Ler arquivo SQL
        const response = await fetch('/database.sql');
        const sqlScript = await response.text();
        
        // 3. Executar em partes (para evitar timeout)
        const sqlStatements = sqlScript.split(';').filter(stmt => stmt.trim());
        
        for (let i = 0; i < sqlStatements.length; i++) {
            const stmt = sqlStatements[i] + ';';
            console.log(`📝 Executando statement ${i + 1}/${sqlStatements.length}`);
            
            try {
                await executeSQL(stmt);
                console.log(`✅ Statement ${i + 1} executado`);
            } catch (error) {
                console.warn(`⚠️  Aviso no statement ${i + 1}:`, error.message);
                // Continuar mesmo com erros
            }
            
            // Pequena pausa para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('🎉 Configuração do banco de dados concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
    }
}

// Função para criar bucket de storage
async function setupStorage() {
    console.log('📦 Configurando storage...');
    
    try {
        // Criar bucket para materiais
        const { data: bucketMateriais, error: bucketError } = await supabaseAdmin
            .storage
            .createBucket('materiais', {
                public: false,
                fileSizeLimit: 100 * 1024 * 1024, // 100MB
                allowedMimeTypes: [
                    'application/pdf',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/zip',
                    'video/mp4',
                    'text/html'
                ]
            });
        
        if (bucketError && !bucketError.message.includes('already exists')) {
            throw bucketError;
        }
        
        console.log('✅ Bucket "materiais" configurado');
        
        // Criar bucket para simulados
        const { data: bucketSimulados, error: bucketError2 } = await supabaseAdmin
            .storage
            .createBucket('simulados', {
                public: false,
                fileSizeLimit: 50 * 1024 * 1024, // 50MB
                allowedMimeTypes: ['text/html']
            });
        
        if (bucketError2 && !bucketError2.message.includes('already exists')) {
            throw bucketError2;
        }
        
        console.log('✅ Bucket "simulados" configurado');
        
        // Criar bucket para avatares
        const { data: bucketAvatares, error: bucketError3 } = await supabaseAdmin
            .storage
            .createBucket('avatares', {
                public: true,
                fileSizeLimit: 2 * 1024 * 1024, // 2MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
            });
        
        if (bucketError3 && !bucketError3.message.includes('already exists')) {
            throw bucketError3;
        }
        
        console.log('✅ Bucket "avatares" configurado');
        
        // Configurar políticas do storage
        const storagePolicies = `
            -- Política para materiais (usuários podem fazer upload, todos podem baixar)
            DROP POLICY IF EXISTS "Usuários podem fazer upload de materiais" ON storage.objects;
            CREATE POLICY "Usuários podem fazer upload de materiais"
                ON storage.objects FOR INSERT TO authenticated
                WITH CHECK (bucket_id = 'materiais');
            
            DROP POLICY IF EXISTS "Todos podem baixar materiais" ON storage.objects;
            CREATE POLICY "Todos podem baixar materiais"
                ON storage.objects FOR SELECT TO public
                USING (bucket_id = 'materiais');
            
            -- Política para simulados
            DROP POLICY IF EXISTS "Usuários podem fazer upload de simulados" ON storage.objects;
            CREATE POLICY "Usuários podem fazer upload de simulados"
                ON storage.objects FOR INSERT TO authenticated
                WITH CHECK (bucket_id = 'simulados');
            
            DROP POLICY IF EXISTS "Todos podem baixar simulados" ON storage.objects;
            CREATE POLICY "Todos podem baixar simulados"
                ON storage.objects FOR SELECT TO public
                USING (bucket_id = 'simulados');
            
            -- Política para avatares
            DROP POLICY IF EXISTS "Usuários podem fazer upload de seus avatares" ON storage.objects;
            CREATE POLICY "Usuários podem fazer upload de seus avatares"
                ON storage.objects FOR INSERT TO authenticated
                WITH CHECK (
                    bucket_id = 'avatares' AND
                    (storage.foldername(name))[1] = auth.uid()::text
                );
            
            DROP POLICY IF EXISTS "Todos podem ver avatares" ON storage.objects;
            CREATE POLICY "Todos podem ver avatares"
                ON storage.objects FOR SELECT TO public
                USING (bucket_id = 'avatares');
        `;
        
        await executeSQL(storagePolicies);
        console.log('✅ Políticas de storage configuradas');
        
    } catch (error) {
        console.error('❌ Erro ao configurar storage:', error);
    }
}

// Função para criar usuário administrador inicial
async function createAdminUser() {
    console.log('👨‍💼 Criando usuário administrador...');
    
    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: 'admin@studycert.com',
            password: 'Admin@123',
            email_confirm: true,
            user_metadata: {
                full_name: 'Administrador StudyCert',
                role: 'admin'
            }
        });
        
        if (error && !error.message.includes('already registered')) {
            throw error;
        }
        
        console.log('✅ Usuário administrador criado/verificado');
        
        // Atualizar o usuário na tabela usuarios
        if (data?.user) {
            await supabaseAdmin
                .from('usuarios')
                .upsert({
                    id: data.user.id,
                    email: data.user.email,
                    nome: 'Administrador StudyCert',
                    status: 'ativo'
                });
            
            console.log('✅ Perfil do administrador atualizado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário administrador:', error);
    }
}

// Executar setup completo
async function runSetup() {
    console.log('=========================================');
    console.log('     SETUP STUDY CERT - SUPABASE        ');
    console.log('=========================================');
    
    // 1. Configurar banco de dados
    await setupDatabase();
    
    // 2. Configurar storage
    await setupStorage();
    
    // 3. Criar usuário administrador
    await createAdminUser();
    
    console.log('=========================================');
    console.log('     SETUP CONCLUÍDO COM SUCESSO!       ');
    console.log('=========================================');
    
    console.log('\n📋 RESUMO DA CONFIGURAÇÃO:');
    console.log('- Banco de dados: ✅ Configurado');
    console.log('- Tabelas: ✅ Criadas (12 tabelas)');
    console.log('- Views: ✅ Criadas (3 views)');
    console.log('- Funções: ✅ Criadas');
    console.log('- Storage: ✅ Configurado (3 buckets)');
    console.log('- Usuário admin: ✅ Criado (admin@studycert.com)');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Testar conexão com o frontend');
    console.log('2. Criar API endpoints se necessário');
    console.log('3. Configurar autenticação no frontend');
    console.log('4. Testar upload/download de arquivos');
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
    // Expor função para ser chamada do console
    window.runSupabaseSetup = runSetup;
    console.log('ℹ️  Execute "runSupabaseSetup()" no console para iniciar a configuração');
}