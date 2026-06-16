import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  buscarPerfil,
  cadastrarUsuario,
  fazerLogin,
  obterUsuarioSalvo,
  sair as sairDaApi,
  atualizarUsuarioSalvo,
} from "@/services/authService";
import {
  alterarSenha,
  atualizarPerfil,
} from "@/services/usuarioService";
import type { Category, Goal, PublicUser, Transaction } from "@/types/finance";

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface FinoraContextValue {
  currentUser: PublicUser | null;
  userCategories: Category[];
  userTransactions: Transaction[];
  userGoals: Goal[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ActionResult>;
  signup: (fullName: string, email: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  updateProfile: (fullName: string, email: string) => Promise<ActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ActionResult>;
  addTransaction: (transaction: Omit<Transaction, "id" | "userId" | "createdAt">) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id" | "userId" | "createdAt">) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Pick<Category, "name" | "type" | "icon">) => void;
  updateCategory: (id: string, values: Pick<Category, "name" | "icon">) => ActionResult;
  deleteCategory: (id: string) => ActionResult;
  addGoal: (goal: Omit<Goal, "id" | "userId" | "createdAt">) => void;
  updateGoal: (id: string, goal: Omit<Goal, "id" | "userId" | "createdAt">) => void;
  deleteGoal: (id: string) => void;
}

function usuarioSalvoParaPublicUser(): PublicUser | null {
  const usuarioSalvo = obterUsuarioSalvo();

  if (!usuarioSalvo) {
    return null;
  }

  return {
    id: String(usuarioSalvo.id),
    fullName: usuarioSalvo.nome,
    email: usuarioSalvo.email,
    createdAt: new Date().toISOString(),
  };
}

const FinoraContext = createContext<FinoraContextValue | null>(null);

export function FinoraProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(() => usuarioSalvoParaPublicUser());

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    buscarPerfil()
      .then((perfil) => {
        const usuarioAtualizado = {
          id: perfil.id,
          nome: perfil.nome,
          email: perfil.email,
        };

        atualizarUsuarioSalvo(usuarioAtualizado);

        setCurrentUser({
          id: String(perfil.id),
          fullName: perfil.nome,
          email: perfil.email,
          createdAt: perfil.criadoEm,
        });
      })
      .catch(() => {
        // Mantém a sessão local durante o desenvolvimento caso a API esteja indisponível.
      });
  }, []);

  async function login(email: string, password: string): Promise<ActionResult> {
    try {
      const response = await fazerLogin({
        email,
        senha: password,
      });

      setCurrentUser({
        id: String(response.id),
        fullName: response.nome,
        email: response.email,
        createdAt: new Date().toISOString(),
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao fazer login.",
      };
    }
  }

  async function signup(fullName: string, email: string, password: string): Promise<ActionResult> {
    try {
      await cadastrarUsuario({
        nome: fullName,
        email,
        senha: password,
      });

      const response = await fazerLogin({
        email,
        senha: password,
      });

      setCurrentUser({
        id: String(response.id),
        fullName: response.nome,
        email: response.email,
        createdAt: new Date().toISOString(),
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao criar conta.",
      };
    }
  }

  function logout() {
    sairDaApi();
    setCurrentUser(null);
  }

  async function updateProfile(fullName: string, email: string): Promise<ActionResult> {
    try {
      const perfil = await atualizarPerfil({
        nome: fullName,
        email,
      });

      atualizarUsuarioSalvo({
        id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
      });

      setCurrentUser({
        id: String(perfil.id),
        fullName: perfil.nome,
        email: perfil.email,
        createdAt: perfil.criadoEm,
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao atualizar perfil.",
      };
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
    try {
      await alterarSenha({
        senhaAtual: currentPassword,
        novaSenha: newPassword,
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao alterar senha.",
      };
    }
  }

  function addTransaction() {
    console.warn("addTransaction local foi desativado. Use transacaoService.ts.");
  }

  function updateTransaction() {
    console.warn("updateTransaction local foi desativado. Use transacaoService.ts.");
  }

  function deleteTransaction() {
    console.warn("deleteTransaction local foi desativado. Use transacaoService.ts.");
  }

  function addCategory() {
    console.warn("addCategory local foi desativado. Use categoriaService.ts.");
  }

  function updateCategory(): ActionResult {
    return { ok: false, message: "Edição local de categorias foi desativada." };
  }

  function deleteCategory(): ActionResult {
    return { ok: false, message: "Exclusão local de categorias foi desativada." };
  }

  function addGoal() {
    console.warn("addGoal local foi desativado. Use metaService.ts.");
  }

  function updateGoal() {
    console.warn("updateGoal local foi desativado. Use metaService.ts.");
  }

  function deleteGoal() {
    console.warn("deleteGoal local foi desativado. Use metaService.ts.");
  }

  return (
    <FinoraContext.Provider
      value={{
        currentUser,
        userCategories: [],
        userTransactions: [],
        userGoals: [],
        isAuthenticated: Boolean(currentUser),
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </FinoraContext.Provider>
  );
}

export function useFinora() {
  const context = useContext(FinoraContext);
  if (!context) throw new Error("useFinora deve ser usado dentro de FinoraProvider.");
  return context;
}
