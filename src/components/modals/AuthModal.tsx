import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type AbaAuth = 'login' | 'signup'

export function AuthModal() {
  const { modalAuthAberto, fecharModalAuth, atualizarUsuario } = useAuth()
  const [aba, setAba] = useState<AbaAuth>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!email || !senha) {
      setErro('Preencha email e senha.')
      return
    }

    setCarregando(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (error) {
        setErro(error.message || 'Erro ao fazer login.')
        return
      }

      if (data.user) {
        // Buscar o perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, tenant_id')
          .eq('id', data.user.id)
          .single()

        const usuario = {
          id: data.user.id,
          email: data.user.email || email,
          nome: profile?.nome || email.split('@')[0],
          tenant_id: profile?.tenant_id,
        }

        atualizarUsuario(usuario)
        toast.success('Login realizado com sucesso!')
      }
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao fazer login.'
      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!email || !senha || !nome) {
      setErro('Preencha todos os campos.')
      return
    }

    if (senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      })

      if (authError) {
        setErro(authError.message || 'Erro ao criar conta.')
        return
      }

      if (!authData.user) {
        setErro('Erro ao criar conta. Tente novamente.')
        return
      }

      const userId = authData.user.id

      // 2. Criar tenant
      const tenantNome = nome
      const dominio = email.split('@')[1]

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nome: tenantNome,
          dominio,
          criado_em: new Date().toISOString(),
        })
        .select()
        .single()

      if (tenantError) {
        setErro('Erro ao criar empresa/tenant.')
        return
      }

      const tenantId = tenantData.id

      // 3. Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          nome,
          tenant_id: tenantId,
          criado_em: new Date().toISOString(),
        })

      if (profileError) {
        setErro('Erro ao criar perfil do usuário.')
        return
      }

      // Atualizar estado local
      const usuario = {
        id: userId,
        email,
        nome,
        tenant_id: tenantId,
      }

      atualizarUsuario(usuario)
      toast.success('Conta criada com sucesso!')
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao fazer cadastro.'
      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Dialog open={modalAuthAberto} onOpenChange={fecharModalAuth}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center mb-4 text-lg font-semibold">
            Bem-vindo ao AgroGest
          </DialogTitle>
          <DialogTitle className="text-center text-sm font-medium text-muted-foreground">
            {aba === 'login' ? '🔐 Entrar na sua conta' : '✨ Criar nova conta'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Abas */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => {
                setAba('login')
                setEmail('')
                setSenha('')
                setNome('')
                setErro(null)
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                aba === 'login'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setAba('signup')
                setEmail('')
                setSenha('')
                setNome('')
                setErro(null)
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                aba === 'signup'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cadastro
            </button>
          </div>

          {/* Formulário Login */}
          {aba === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {erro && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErro(null)
                  }}
                  disabled={carregando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-senha">Senha</Label>
                <Input
                  id="login-senha"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro(null)
                  }}
                  disabled={carregando}
                />
              </div>

              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          )}

          {/* Formulário Signup */}
          {aba === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {erro && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-nome">Nome completo</Label>
                <Input
                  id="signup-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    setErro(null)
                  }}
                  disabled={carregando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErro(null)
                  }}
                  disabled={carregando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-senha">Senha</Label>
                <Input
                  id="signup-senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro(null)
                  }}
                  disabled={carregando}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Ao se cadastrar, você terá acesso aos seus dados na nuvem com sincronização automática.
              </div>

              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? 'Cadastrando...' : 'Criar conta'}
              </Button>
            </form>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
