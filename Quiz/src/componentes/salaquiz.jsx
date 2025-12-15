import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/salaquiz.module.css";
import { supabase } from "../supabaseClient"

function SalaQuiz() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [nomeJogador, setNomeJogador] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoUsername, setNovoUsername] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [sucessoEdicao, setSucessoEdicao] = useState("");


  const [categorias, setCategorias] = useState([
    { nome: "Matemática", qtd: 3 },
    { nome: "Ciências", qtd: 4 },
    { nome: "História", qtd: 2 },
    { nome: "Geografia", qtd: 5 },
    { nome: "Português", qtd: 6 },
  ]);

  const totalPerguntas = categorias.reduce((acc, c) => acc + c.qtd, 0);

  const alterarQtd = (index, delta) => {
    setCategorias((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, qtd: Math.max(0, cat.qtd + delta) } : cat
      )
    );
  };

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

  // Atualiza localStorage se quiser
  const quizSalvo = JSON.parse(localStorage.getItem("quizAtual"));
  localStorage.setItem("quizAtual", JSON.stringify(quizSalvo));

  setTimeout(() => setMostrarModal(false), 1500);
}


  // CARREGA O QUIZ SALVO NO LOCAL STORAGE
  useEffect(() => {
    const quizSalvo = localStorage.getItem("quizAtual");

    if (!quizSalvo) {
      alert("Erro: Nenhum quiz carregado!");
      navigate("/inicio");
      return;
    }

    const obj = JSON.parse(quizSalvo);
    setQuiz(obj);

    // Salva o quizId para a página de perguntas
    localStorage.setItem("quizId", obj.id);

    async function buscarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Se você salvou username no signup:
        setNomeJogador(user.user_metadata.username || user.email);
      }
   }

   buscarUsuario();

  }, []);

  if (!quiz) {
    return <h2>Carregando dados da sala...</h2>;
  }

  return (
    <div className={styles.Container}>

      {/* LADO ESQUERDO */}
      <div className={styles.salaquizLeft}>
        <div className={styles.salaquizBox}>

          <Link to="/inicio">
            <button className={styles.btnVoltar}>
              <i className="fa-solid fa-right-from-bracket fa-flip-both fa-sm"></i>
            </button>
          </Link>

          <h1>{quiz.nome_sala}</h1>

          <label>Código da sala:</label>
          <div className={styles.infoItem}>
            <div className={styles.codigo}>
              <i className="fas fa-lock icon"></i> {quiz.codigo_acesso}
            </div>
          </div>

          <label>Jogador:</label>
          <div className={styles.infoItem}>
            <i className="fa-solid fa-circle-user fa-2xl"></i>
            <div 
                className={styles.jogador}
                onClick={() => {
                  setNovoUsername(nomeJogador);
                  setMostrarModal(true);
                }}
                style={{ cursor: "pointer" }}
              >
                {nomeJogador || "Carregando..."}
              </div>

          </div>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className={styles.salaquizRight}>
        <div className={styles.boxdireita}>

          <p className={styles.instrucao}>
            Antes de iniciar, selecione a quantidade de perguntas por categoria:
          </p>

          <div className={styles.categoriasLista}>
            {categorias.map((cat, index) => (
              <div key={index} className={styles.categoriaItem}>
                <span>{cat.nome}</span>
                <div className={styles.controles}>
                  <button onClick={() => alterarQtd(index, -1)}>-</button>
                  <span>{cat.qtd}</span>
                  <button onClick={() => alterarQtd(index, +1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.total}>
            (Selecione <b>20</b> perguntas) — Atual: {totalPerguntas}
          </p>

          <button
            className={`${styles.btnIniciar} ${totalPerguntas < 20 ? styles.btnDesabilitado : ""}`}
            disabled={totalPerguntas < 20}
            onClick={() => {
              if (totalPerguntas < 20) {
                alert("Você precisa selecionar pelo menos 20 perguntas!");
                return;
              }
              navigate("/salajogando", {
                state: { indice: 0 }
              });

            }}
          >
            Iniciar Quiz
          </button>

        </div>
      </div>

      {mostrarModal && (
  <div className={styles.modalFundo}>
    <div className={styles.modalBox}>
      <h2 className={styles.tituloModal}>Editar Perfil<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg></h2>


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
        <button onClick={() => setMostrarModal(false)} className={styles.btnCancelar}>
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

export default SalaQuiz;
