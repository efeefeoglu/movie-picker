import { getCategories } from "@/lib/db";
import CategoryPicker from "./category-picker";
import HeroPicker from "./hero-picker";

export const dynamic = "force-dynamic";

export default async function Home() {
  let categories: { category: string; count: number }[] = [];
  let categoriesWithSecondary: { category: string; count: number }[] = [];
  let configured = true;
  try {
    [categories, categoriesWithSecondary] = await Promise.all([getCategories(), getCategories(true)]);
  } catch { configured = false; }

  return (
    <main>
      <section className="hero">
        <HeroPicker configured={configured} />
      </section>
      <section className="collection">
        <div className="section-head">
          <div><div className="eyebrow">More ways to pick</div><h2>Have a genre in mind?</h2></div>
          <p>Open the genre picker for four more choices.</p>
        </div>
        {!configured ? (
          <div className="empty"><b>Connect your Neon database</b><p>Add <code>DATABASE_URL</code> to start building your collection.</p></div>
        ) : categoriesWithSecondary.length ? <CategoryPicker categories={categories} categoriesWithSecondary={categoriesWithSecondary} /> : (
          <div className="empty"><b>Your screening room is empty.</b><p>Add an IMDb film and your genres will appear here.</p><a href="/add">Add your first film →</a></div>
        )}
      </section>
    </main>
  );
}
