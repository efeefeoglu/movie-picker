import { getCategories } from "@/lib/db";
import CategoryPicker from "./category-picker";

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
        <div className="eyebrow">Tonight&apos;s feature presentation</div>
        <h1>Your next favorite<br />film is <em>waiting.</em></h1>
        <p>Choose a mood. We&apos;ll pull four films from your personal collection—no endless scrolling required.</p>
        <div className="scroll-cue">Explore your genres <span>↓</span></div>
      </section>
      <section className="collection">
        <div className="section-head">
          <div><div className="eyebrow">The collection</div><h2>What are you in the mood for?</h2></div>
          <p>Pick a genre and leave the rest to chance.</p>
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
