import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/meusquizzes.module.css";
import { supabase } from "../supabaseClient";

function MeusQuizzes() {
  const [meusQuizzes, setMeusQuizzes] = useState([]);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      // Quizzes criados pelo usuário
      const { data: quizzesCriados } = await supabase
        .from("quizzes")
        .select("id, nome_sala, codigo_acesso")
        .eq("user_id", userId);

      setMeusQuizzes(quizzesCriados || []);

      // Histórico de quizzes jogados
      const { data: historicoData } = await supabase
        .from("pontuacoes")
        .select("quiz_id")
        .eq("user_id", userId);

      if (historicoData?.length) {
        const quizIds = historicoData.map((item) => item.quiz_id);

        const { data: quizzesHistorico } = await supabase
          .from("quizzes")
          .select("id, nome_sala, codigo_acesso")
          .in("id", quizIds);

        const historicoFinal = historicoData.map((item) => ({
          quiz_id: item.quiz_id,
          quiz: quizzesHistorico.find((q) => q.id === item.quiz_id),
        }));

        setHistorico(historicoFinal);
      } else {
        setHistorico([]);
      }
    }

    carregarDados();
  }, []);

  function abrirRanking(quizId) {
    localStorage.setItem("quizId", quizId);
    window.location.href = "/ranking/" + quizId;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <Link to="/inicio">
          <button className={styles.btnVoltar}>
            <i className="fa-solid fa-right-from-bracket fa-flip-both"></i>
          </button>
        </Link>

        {/* MEUS QUIZZES */}
        <h2 className={styles.titulo}>Meus Quizzes</h2>

        <div className={styles.cardsRow}>
          {meusQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={styles.quizcaixa}
              onClick={() => abrirRanking(quiz.id)}
            >
              <div className={styles.quizContent}>
                <h3 className={styles.quizTitulo}>{quiz.nome_sala}</h3>
                <span className={styles.quizCodigo}>
                  Código: {quiz.codigo_acesso}
                </span>
              </div>
            </div>
          ))}

          {/* Criar novo quiz */}
          <Link to="/criarquiz" className={styles.quizLink}>
            <div className={styles.quizcaixa}>
              <div className={styles.quizContent}>
                <h3 className={styles.plus}>+</h3>
              </div>
            </div>
          </Link>
        </div>

        {/* HISTÓRICO */}
        <h2 className={styles.titulo}>Meu Histórico</h2>

        <div className={styles.cardsRow}>
          {historico.map((item, index) => (
            <div
              key={index}
              className={styles.quizcaixa}
              onClick={() => abrirRanking(item.quiz_id)}
            >
              <div className={styles.quizContent}>
                <h3 className={styles.quizTitulo}>
                  {item.quiz?.nome_sala}
                </h3>
                <span className={styles.quizCodigo}>
                  Código: {item.quiz?.codigo_acesso}
                </span>
              </div>
            </div>
          ))}

          {historico.length === 0 && (
            <p style={{ fontSize: "18px", marginTop: "10px" }}>
              Você ainda não jogou nenhum quiz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeusQuizzes;
