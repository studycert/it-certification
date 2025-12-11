// auth.js
import { supabase } from './supabase_setup.js';

export class AuthService {
  // Cadastro de usuário
  static async signUp(email, password, userData) {
    try {
      // 1. Criar usuário no auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: userData.nome,
            nivel_experiencia: userData.nivel_experiencia || 'iniciante'
          }
        }
      });

      if (authError) throw authError;

      // 2. Criar perfil na tabela usuarios
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            nome: userData.nome,
            data_nascimento: userData.data_nascimento,
            pais: userData.pais,
            cidade: userData.cidade,
            nivel_experiencia: userData.nivel_experiencia || 'iniciante',
            status: 'ativo'
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Tentar deletar o usuário auth se falhar
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    }
  }

  // Login
  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { success: false, error: error.message };

    // Atualizar last_login
    await supabase
      .from('usuarios')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    return { success: true, user: data.user };
  }

  // Logout
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { success: !error, error };
  }

  // Obter usuário atual
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Obter perfil completo
  static async getUserProfile(userId = null) {
    const user = userId || (await this.getCurrentUser())?.id;
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return data;
  }
}
