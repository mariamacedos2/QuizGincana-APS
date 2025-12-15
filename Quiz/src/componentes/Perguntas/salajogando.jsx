import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import styles from "./salajogando.module.css";
import { supabase } from "../../supabaseClient";

export default function SalaJogando() {
  const navigate = useNavigate();
  const location = useLocation();

  const indice = location.state?.indice ?? 0;

  const [perguntas, setPerguntas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [visiveis, setVisiveis] = useState([0, 1, 2, 3]);
  const [limite5050, setLimite5050] = useState(0);
  const [usos5050, setUsos5050] = useState(0); // total usado no quiz

  const quizAtual = JSON.parse(localStorage.getItem("quizAtual") || "{}");
  const quizId = quizAtual?.id;

  const [userId, setUserId] = useState(null);

  // Carregar perguntas e usuário
  useEffect(() => {
    async function carregarDados() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setUserId(uid);

      if (!quizId) {
        alert("Erro: quizId não encontrado.");
        setCarregando(false);
        return;
      }

      // Carregar perguntas
      const { data: perguntasData, error: perguntasError } = await supabase
        .from("perguntas")
        .select("*")
        .eq("quiz_id", quizId)
        .order("id", { ascending: true });

      if (!perguntasError && perguntasData) {
        setPerguntas(perguntasData);

        // 10% das perguntas, mínimo 1
        setLimite5050(Math.max(1, Math.floor(perguntasData.length * 0.1)));
      }

      // Carregar uso do 50/50 do usuário neste quiz
      const { data: usoData, error: usoError } = await supabase
        .from("uso_5050")
        .select("usos")
        .eq("user_id", uid)
        .eq("quiz_id", quizId)
        .single();

      if (!usoError && usoData) {
        setUsos5050(usoData.usos);
      } else {
        setUsos5050(0);
      }

      setCarregando(false);
    }

    carregarDados();
  }, [quizId]);

  useEffect(() => {
    setVisiveis([0, 1, 2, 3]); // resetar alternativas visíveis
  }, [indice]);

  if (carregando) return <h2>Carregando perguntas...</h2>;
  if (!perguntas[indice]) return null;

  const question = perguntas[indice];
  const alternativas = [
    question.alternativa_a,
    question.alternativa_b,
    question.alternativa_c,
    question.alternativa_d
  ];

  // Função 50/50 — global por quiz
  async function ativar5050() {
    if (usos5050 >= limite5050) {
      alert("Você atingiu o limite de usos do 50/50 neste quiz!");
      return;
    }

    const correta = Number(question.resposta_correta);
    let erradas = [0, 1, 2, 3].filter((i) => i !== correta);
    let ocultar = erradas.sort(() => Math.random() - 0.5).slice(0, 2);
    let novasVisiveis = [0, 1, 2, 3].filter((i) => !ocultar.includes(i));

    setVisiveis(novasVisiveis);
    setUsos5050(usos5050 + 1);

    // Salvar no Supabase
    const { data, error } = await supabase
      .from("uso_5050")
      .upsert({
        user_id: userId,
        quiz_id: quizId,
        usos: usos5050 + 1
      })
      .eq("user_id", userId)
      .eq("quiz_id", quizId);

    if (error) console.error("Erro ao atualizar uso 50/50:", error);
  }

  // Selecionar resposta
  function selecionarResposta(indiceEscolhido) {
    navigate("/resposta", {
      state: {
        indicePergunta: indice,
        indiceEscolhido,
        correta: Number(question.resposta_correta),
        pontos: Number(question.pontos)
      }
    });
  }

  return (
    <div className={styles.container}>



      <div className={styles.colunaEsquerda}>
        <button
        className={styles.btnVoltar}
        onClick={() => navigate("/inicio")}
      >
        <i className="fa-solid fa-right-from-bracket fa-flip-both fa-sm"></i>
      </button>
        <h1>{quizAtual?.nome_sala}</h1>
        <h2>{question.categoria}</h2>
        <p className={styles.enunciado}>{question.pergunta}</p>

        <ul>
          {alternativas.map((t, i) =>
            visiveis.includes(i) ? (
              <li key={i}>
                <strong>{["A", "B", "C", "D"][i]})</strong> {t}
              </li>
            ) : null
          )}
        </ul>
      </div>

      <div className={styles.colunaDireita}>
        <div className={styles.caixa}>
          <h3 className={styles.tituloResposta}>Escolha sua resposta</h3>

          <button
            onClick={ativar5050}
            className={styles.btn5050}
            disabled={usos5050 >= limite5050}
          >
            50/50 ({limite5050 - usos5050} restantes)
          </button>

          <div className={styles.blocoCinza}>
            <div className={styles.grid}>
              {alternativas.map((_, i) =>
                visiveis.includes(i) ? (
                  <button
                    key={i}
                    onClick={() => selecionarResposta(i)}
                    className={styles.btngeral}
                  >
                    {["A", "B", "C", "D"][i]}
                  </button>
                ) : (
                  <button key={i} disabled className={styles.btngeralOculto}>
                    —
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
