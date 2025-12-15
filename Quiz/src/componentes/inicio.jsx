import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../styles/inicio.module.css";
import { supabase } from "../supabaseClient";

function Inicio() {
  const navigate = useNavigate();
  const [codigoDigitado, setCodigoDigitado] = useState("");

  /* Modal Editar Perfil */
  const [nomeJogador, setNomeJogador] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoUsername, setNovoUsername] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [erroEdicao, setErroEdicao] = useState("");
  const [sucessoEdicao, setSucessoEdicao] = useState("");
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);

  // Pega usuário logado
  useEffect(() => {
    async function buscarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNomeJogador(user.user_metadata.username || user.email);
      }
    }
    buscarUsuario();
  }, []);

  // Salvar edições do moda 
  async function salvarEdicoes() {
    setErroEdicao("");
    setSucessoEdicao("");

    if (!novoUsername && !novaSenha) {
      setErroEdicao("Preencha pelo menos um campo.");
      return;
    }

    setCarregandoEdicao(true);

    const updates = {};
    if (novoUsername) updates.data = { username: novoUsername };
    if (novaSenha) updates.password = novaSenha;

    const { error } = await supabase.auth.updateUser(updates);

    setCarregandoEdicao(false);

    if (error) {
      setErroEdicao(error.message);
      return;
    }

    setSucessoEdicao("Dados atualizados com sucesso!");
    setNomeJogador(novoUsername || nomeJogador);

    setTimeout(() => setMostrarModal(false), 1200);
  }

  // Entrar no quiz
  const entrarNoQuiz = async () => {
    if (!codigoDigitado.trim()) {
      alert("Digite um código!");
      return;
    }

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("codigo_acesso", codigoDigitado.toUpperCase())
      .maybeSingle();

    if (error || !quiz) {
      alert("Código inválido!");
      return;
    }

    localStorage.setItem("quizAtual", JSON.stringify(quiz));
    localStorage.setItem("quizId", quiz.id);

    navigate("/salajogando");
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>


        <div className={styles.topoDireita}>

          <i className="fa-solid fa-circle-user fa-2x"></i>

          {/* Jogador */}
          <div
            className={styles.jogador}
            onClick={() => {
              setNovoUsername(nomeJogador);
              setMostrarModal(true);
            }}
          >
            <span className={styles.jogadorNomeMini}>
              {nomeJogador || "Carregando..."}
            </span>
          </div>

          {/* Botão voltar */}
          <Link to="/">
            <button className={styles.btnVoltarMini}>
              <i className="fa-solid fa-right-from-bracket fa-flip-both"></i>
            </button>
          </Link>

        </div>

        <div className={styles.titleContainer}>
          <h1>Doce Desafio</h1>
        </div>


        {/* INPUT DO CÓDIGO */}
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <i className={`fas fa-lock ${styles.icon}`}></i>
            <input
              type="text"
              placeholder="Digite o código do quiz"
              value={codigoDigitado}
              onChange={(e) => setCodigoDigitado(e.target.value)}
              maxLength={6}
              required
            />
          </div>
        </div>

        <button className={styles.btnEntrar} onClick={entrarNoQuiz}>
          Entrar <i className="fas fa-sign-in-alt"></i>
        </button>

        <button className={styles.btnQuiz} onClick={() => navigate("/meusquizzes")}>
          Meus Quizzes
        </button>

        <button className={styles.btnQuiz} onClick={() => navigate("/criarquiz")}>
          Criar Quiz <i className="fa-solid fa-plus fa-flip-horizontal fa-xs"></i>
        </button>

        <p className={styles.cadastroText}>Crie quizzes interativos e cativantes</p>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className={styles.modalFundo}>
          <div className={styles.modalBox}>
            
            <h2 className={styles.tituloModal}>Editar Perfil <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg></h2>

            <label>Novo usuário:</label>
            <input
              type="text"
              value={novoUsername}
              onChange={(e) => setNovoUsername(e.target.value)}
              placeholder="Digite o novo nome de usuário"
            />

            <label>Nova senha:</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha"
            />

            {erroEdicao && <p className={styles.erro}>{erroEdicao}</p>}
            {sucessoEdicao && <p className={styles.sucesso}>{sucessoEdicao}</p>}

            <div className={styles.modalBotoes}>
              <button
                onClick={() => setMostrarModal(false)}
                className={styles.btnCancelar}
              >
                Cancelar
              </button>

              <button
                onClick={salvarEdicoes}
                disabled={carregandoEdicao}
                className={styles.btnSalvar}
              >
                {carregandoEdicao ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inicio;
