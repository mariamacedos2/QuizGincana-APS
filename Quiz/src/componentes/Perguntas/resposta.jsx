import { useLocation, useNavigate } from "react-router-dom";
import styles from "./resposta.module.css";
import { supabase } from "../../supabaseClient";
import { useEffect, useState } from "react";

export default function Resposta() {
  const location = useLocation();
  const navigate = useNavigate();

  const indicePergunta = location.state?.indicePergunta;
  const indiceEscolhido = location.state?.indiceEscolhido;

  const [question, setQuestion] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [totalPerguntas, setTotalPerguntas] = useState(0);

  // Carregar quiz salvo no localStorage
  useEffect(() => {
    const quiz = JSON.parse(localStorage.getItem("quizAtual") || "{}");
    setQuizInfo(quiz);
  }, []);

  // Carregar pergunta do Supabase
  useEffect(() => {
    async function carregarPergunta() {
      if (indicePergunta === undefined) return;

      const quizAtual = JSON.parse(localStorage.getItem("quizAtual") || "{}");
      const quizId = quizAtual?.id;
      if (!quizId) return;

      const { data, error } = await supabase
        .from("perguntas")
        .select("*")
        .eq("quiz_id", quizId)
        .order("id", { ascending: true });

      if (!error && data) {
        setQuestion(data[indicePergunta]);
        setTotalPerguntas(data.length);
      }
    }

    carregarPergunta();
  }, [indicePergunta]);

  if (!question) return <h2>Carregando resposta...</h2>;

  const alternativas = [
    question.alternativa_a,
    question.alternativa_b,
    question.alternativa_c,
    question.alternativa_d,
  ];

  const acertou = indiceEscolhido === Number(question.resposta_correta);

  // SALVAR RESPOSTA NO BANCO
  async function salvarResposta() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const quizId = quizInfo?.id;
    if (!quizId) return;

    await supabase.from("respostas").insert({
      user_id: userId,
      quiz_id: quizId,
      pergunta_id: question.id,
      acertou: acertou,
    });
  }

  //  SALVAR PONTUAÇÃO
  async function salvarPontuacao() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const quizId = quizInfo?.id;
    if (!quizId) return;

    const pontosDaPergunta = acertou ? Number(question.pontos) : 0;

    // Buscar username do perfil
    const { data: perfil } = await supabase
      .from("perfis")
      .select("username")
      .eq("id", userId)
      .single();

    const username = perfil?.username || null;

    // Verifica se já existe pontuação anterior
    const { data: existente } = await supabase
      .from("pontuacoes")
      .select("*")
      .eq("user_id", userId)
      .eq("quiz_id", quizId);

    if (existente?.length > 0) {
      // Atualiza com nova soma + username
      await supabase
        .from("pontuacoes")
        .update({
          pontos_totais: existente[0].pontos_totais + pontosDaPergunta,
          username: username,
        })
        .eq("id", existente[0].id);
    } else {
      // Cria pontuação nova
      await supabase.from("pontuacoes").insert({
        user_id: userId,
        quiz_id: quizId,
        pontos_totais: pontosDaPergunta,
        username: username,
      });
    }
  }

  // IR PARA A PRÓXIMA QUESTÃO OU RANKING
 
  async function proximaQuestao() {
    await salvarResposta();
    await salvarPontuacao();

    // Última pergunta → Ranking
    if (indicePergunta + 1 >= totalPerguntas) {
      const quizId = quizInfo?.id;
      const salaId = quizInfo?.sala;

      localStorage.setItem("quizId", quizId);

      navigate("/ranking", {
        state: { quizId, salaId }
      });
      return;
    }

    // Próxima pergunta
    navigate("/salajogando", {
      state: { indice: indicePergunta + 1 },
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
        <h1 className={styles.tituloSala}>{quizInfo?.nome_sala}</h1>
        <h2 className={styles.materia}>{question.categoria}</h2>

        <div className={styles.questaoBox}>
          <span className={styles.numero}>
            {String(indicePergunta + 1).padStart(2, "0")} —
          </span>
          <span className={styles.pontos}>{question.pontos} pontos</span>

          <p className={styles.enunciado}>{question.pergunta}</p>

          <ul className={styles.listaAlternativas}>
            {alternativas.map((alt, i) => (
              <li
                key={i}
                className={
                  i === Number(question.resposta_correta)
                    ? styles.alternativaCorreta
                    : i === indiceEscolhido
                    ? styles.alternativaErrada
                    : ""
                }
              >
                <strong>{["A", "B", "C", "D"][i]})</strong> {alt}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.colunaDireita}>
        <div className={styles.caixa}>
          <h3 className={styles.tituloResposta}>Alternativa Certa</h3>

          <div className={styles.blocoCinza}>
            <div className={styles.grid}>
              {["A", "B", "C", "D"].map((letra, i) => (
                <button
                  key={i}
                  className={
                    i === Number(question.resposta_correta)
                      ? styles.btnCerto
                      : i === indiceEscolhido
                      ? styles.btnErrado
                      : styles.btnNeutro
                  }
                >
                  {letra}
                </button>
              ))}
            </div>
          </div>

          <p className={styles.msg}>
            {acertou
              ? "Você acertou!"
              : `A resposta correta é a letra ${
                  ["A", "B", "C", "D"][Number(question.resposta_correta)]
                }`}
          </p>

          <button onClick={proximaQuestao} className={styles.btnProxima}>
            Próxima Questão
          </button>
        </div>
      </div>
    </div>
  );
}
