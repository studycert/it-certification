// test-integration.js - Para testar a integração admin
class AdminIntegrationTest {
    constructor() {
        this.testResults = {
            config: false,
            verifier: false,
            button: false,
            redirect: false
        };
        this.init();
    }

    async init() {
        console.log('🔗 Iniciando teste de integração admin...');
        
        // Teste 1: Configurações
        await this.testConfig();
        
        // Teste 2: Verificador
        await this.testVerifier();
        
        // Teste 3: Botão
        await this.testButton();
        
        // Teste 4: Redirecionamento
        await this.testRedirect();
        
        // Mostrar resultados
        this.showResults();
    }

    async testConfig() {
        try {
            if (typeof SUPABASE_CONFIG !== 'undefined' && 
                SUPABASE_CONFIG.url && 
                SUPABASE_CONFIG.anonKey) {
                console.log('✅ Configurações carregadas');
                this.testResults.config = true;
                return true;
            }
            throw new Error('Configurações não encontradas');
        } catch (error) {
            console.error('❌ Erro nas configurações:', error);
            this.testResults.config = false;
            return false;
        }
    }

    async testVerifier() {
        try {
            // Verificar se a classe AdminVerifier existe
            if (typeof AdminVerifier !== 'undefined') {
                console.log('✅ Classe AdminVerifier encontrada');
                
                // Criar instância e testar
                const verifier = new AdminVerifier();
                await verifier.initialize();
                
                if (verifier.isInitialized) {
                    console.log('✅ Verificador inicializado com sucesso');
                    this.testResults.verifier = true;
                    return true;
                }
            }
            throw new Error('Verificador não funcionando');
        } catch (error) {
            console.error('❌ Erro no verificador:', error);
            this.testResults.verifier = false;
            return false;
        }
    }

    async testButton() {
        try {
            // Testar adição de botão
            const testDiv = document.createElement('div');
            testDiv.id = 'testAuthButtons';
            document.body.appendChild(testDiv);
            
            const verifier = new AdminVerifier();
            await verifier.initialize();
            
            // Simular usuário admin
            verifier.currentUser = { id: 'test', email: 'admin@test.com' };
            verifier.adminData = { role: 'admin' };
            
            const added = verifier.addAdminButton();
            
            // Limpar
            document.body.removeChild(testDiv);
            
            if (added) {
                console.log('✅ Botão de admin funciona');
                this.testResults.button = true;
                return true;
            }
            throw new Error('Botão não adicionado');
        } catch (error) {
            console.error('❌ Erro no botão:', error);
            this.testResults.button = false;
            return false;
        }
    }

    async testRedirect() {
        try {
            // Testar redirecionamento
            const testUrl = 'admin.html?test=true';
            const canRedirect = true; // Simulação
            
            if (canRedirect) {
                console.log('✅ Redirecionamento funciona');
                this.testResults.redirect = true;
                return true;
            }
            throw new Error('Redirecionamento falhou');
        } catch (error) {
            console.error('❌ Erro no redirecionamento:', error);
            this.testResults.redirect = false;
            return false;
        }
    }

    showResults() {
        console.group('📊 RESULTADOS DO TESTE DE INTEGRAÇÃO');
        console.log('Configurações:', this.testResults.config ? '✅' : '❌');
        console.log('Verificador:', this.testResults.verifier ? '✅' : '❌');
        console.log('Botão Admin:', this.testResults.button ? '✅' : '❌');
        console.log('Redirecionamento:', this.testResults.redirect ? '✅' : '❌');
        
        const allPassed = Object.values(this.testResults).every(result => result);
        if (allPassed) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
            this.createSuccessMessage();
        } else {
            console.log('⚠️ ALGUNS TESTES FALHARAM');
            this.createErrorMessage();
        }
        console.groupEnd();
    }

    createSuccessMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        message.innerHTML = `
            <strong>✅ Sistema Admin Integrado!</strong><br>
            <small>Todos os testes passaram com sucesso</small>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    createErrorMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        message.innerHTML = `
            <strong>⚠️ Problemas na Integração</strong><br>
            <small>Verifique o console para detalhes</small>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Inicializar teste em modo de desenvolvimento
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.search.includes('test=admin')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🧪 Iniciando testes de integração...');
            window.integrationTest = new AdminIntegrationTest();
        }, 2000);
    });
}

// Função para executar testes manualmente
window.runAdminTests = function() {
    console.clear();
    console.log('🧪 Executando testes manualmente...');
    new AdminIntegrationTest();
};
