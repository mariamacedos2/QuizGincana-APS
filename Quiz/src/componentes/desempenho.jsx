import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "../supabaseClient";
import styles from "../styles/desempenho.module.css";
import { Link } from "react-router-dom";

export default function Desempenho() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDesempenho() {
      try {
        const quizId = localStorage.getItem("quizId");

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        console.log("Quiz ID:", quizId);
        console.log("User ID:", userId);

        if (!quizId || !userId) {
          setLoading(false);
          return;
        }

        // PEGAR PERGUNTAS DO QUIZ
        const { data: perguntas } = await supabase
          .from("perguntas")
          .select("*")
          .eq("quiz_id", quizId);

        console.log("Perguntas:", perguntas);

        // PEGAR RESPOSTAS DESSE QUIZ PARA ESSE USUÁRIO
        const { data: respostas } = await supabase
          .from("respostas")
          .select("*")
          .eq("quiz_id", quizId)
          .eq("user_id", userId);

        console.log("Respostas:", respostas);

        const categorias = {};

        perguntas?.forEach((p) => {
          if (!categorias[p.categoria]) {
            categorias[p.categoria] = { total: 0, acertos: 0 };
          }
          categorias[p.categoria].total++;
        });

        const respostasUnicas = {};

        respostas?.forEach((r) => {
          // guarda apenas uma resposta por pergunta
          if (!respostasUnicas[r.pergunta_id]) {
            respostasUnicas[r.pergunta_id] = r;
          }
        });

        Object.values(respostasUnicas).forEach((r) => {
          const pergunta = perguntas.find((p) => p.id === r.pergunta_id);
          if (pergunta && r.acertou) {
            categorias[pergunta.categoria].acertos++;
          }
        });


        const resultado = Object.entries(categorias).map(([nome, info]) => ({
          nome,
          porcentagem:
            info.total > 0
              ? Math.round((info.acertos / info.total) * 100)
              : 0,
        }));

        console.log("Resultado Final:", resultado);

        setDados(resultado);
      } catch (error) {
        console.error("Erro ao carregar desempenho:", error);
      }

      setLoading(false);
    }

    carregarDesempenho();
  }, []);

  const cores = ["#9a0077", "#ff4ec5", "#ffb4ee", "#bd00ff"];

  if (loading) return <h2>Carregando desempenho...</h2>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link to="/ranking">
          <button className={styles.btnVoltar}>
            <i className="fa-solid fa-right-from-bracket fa-flip-both fa-sm"></i>
          </button>
        </Link>

        <h1 className={styles.titulo}>Seu desempenho no quiz</h1>

        <div className={styles.graficoWrapper}>
          <PieChart width={500} height={400}>
            <Pie
              data={dados}
              dataKey="porcentagem"
              nameKey="nome"
              cx="50%"
              cy="50%"
              outerRadius={130}
              label={({ value }) => `${value}%`}
            >
              {dados.map((_, i) => (
                <Cell key={i} fill={cores[i % cores.length]} />
              ))}
            </Pie>

            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
