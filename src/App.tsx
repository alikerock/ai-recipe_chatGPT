import { useState } from "react";
import "./App.css";

type RecipeResult = {
  title: string;
  recipe: string;
  image_url?: string;
};

type ErrorResponse = {
  status?: number;
  error?: string;
  detail?: unknown;
};

function App() {
  const [title, setTitle] = useState<string>("");
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleGenerate(): Promise<void> {
    try {
      setLoading(true);
      setResult(null);

      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined;

      if (!baseUrl || !pubKey) {
        alert("환경변수(VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY)가 설정되지 않았습니다.");
        return;
      }

      const url = `${baseUrl}/functions/v1/recipe`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // functions가 JWT 검증을 끄지 않았다면 세션 토큰을 넣어야 한다.
          // 일단 pubKey 키로 테스트 가능(—no-verify-jwt 배포 시)
          Authorization: `Bearer ${pubKey}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const text = await res.text();

        try {
          const err = JSON.parse(text) as ErrorResponse;

          const insufficientQuota =
            (err.status === 429) ||
            (err.error === "openai_recipe_failed" &&
              String(err.detail ?? "").includes("insufficient_quota"));

          if (insufficientQuota) {
            alert("OpenAI 크레딧이 부족합니다. Billing에서 크레딧을 충전한 뒤 다시 시도해 주세요.");
          } else {
            alert(`HTTP ${res.status} ${text}`);
          }
        } catch {
          alert(`HTTP ${res.status} ${text}`);
        }
        return;
      }

      const data = (await res.json()) as RecipeResult;
      setResult(data);
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "요청 실패";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>🍳 AI 요리사</h1>

      <input
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        placeholder="요리 이름 입력"
      />

      <button onClick={handleGenerate} disabled={loading || !title.trim()}>
        {loading ? "생성중..." : "레시피 만들기"}
      </button>

      {result && (
        <div>
          <h2>{result.title}</h2>
          <p>{result.recipe}</p>

          {result.image_url && (
            <img src={result.image_url} alt={result.title} width={300} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
