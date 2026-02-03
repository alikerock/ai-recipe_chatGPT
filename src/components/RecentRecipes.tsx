import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

type RecipeRow = {
  id: number | string;
  title: string;
  recipe: string | null;
  image_url: string | null;
  created_at: string; // Supabase는 보통 ISO 문자열로 내려옴
};

export default function RecentRecipes() {
  const [items, setItems] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const { data, error } = await supabase
          .from("recipes")
          .select("id, title, recipe, image_url, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // data는 (RecipeRow[] | null)로 올 수 있으므로 안전 처리
        setItems((data ?? []) as RecipeRow[]);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "load_failed";
        setErr(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card">최근 레시피 불러오는 중…</div>;
  if (err) return <div className="card error">에러: {err}</div>;
  if (items.length === 0) return <div className="card">아직 레시피가 없습니다.</div>;

  return (
    <div className="recent-grid">
      {items.map((it) => (
        <article key={String(it.id)} className="recent-card">
          {it.image_url && (
            <img
              src={it.image_url}
              alt={it.title}
              className="thumb"
              loading="lazy"
            />
          )}

          <div className="body">
            <h3 className="title">{it.title}</h3>

            <p className="snippet">
              {(it.recipe ?? "").replace(/\s+/g, " ").slice(0, 120)}
              {(it.recipe ?? "").length > 120 ? "…" : ""}
            </p>

            <time className="time">
              {new Date(it.created_at).toLocaleString("ko-KR")}
            </time>
          </div>
        </article>
      ))}
    </div>
  );
}
