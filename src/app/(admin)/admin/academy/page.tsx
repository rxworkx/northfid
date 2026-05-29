import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminAcademyClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

export default async function AdminAcademyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const category = sp.category ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [articles, total, categories] = await Promise.all([
    db.academyArticle.findMany({
      where, orderBy: { orderIndex: "asc" },
      skip: (page - 1) * limit, take: limit,
      select: { id: true, title: true, description: true, category: true, published: true, orderIndex: true, thumbnail: true, createdAt: true },
    }),
    db.academyArticle.count({ where }),
    db.academyArticle.groupBy({ by: ["category"], _count: true }),
  ]);

  return (
    <>
      <AdminTopbar title="Academy" subtitle={`${total} articles`} />
      <AdminAcademyClient articles={articles as any} total={total} page={page} pages={Math.ceil(total / limit)} search={search} category={category}
        categories={categories.map((c) => ({ value: c.category, count: c._count }))} />
    </>
  );
}
