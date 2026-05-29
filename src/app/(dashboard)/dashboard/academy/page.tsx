import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Play } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Academy" };

export default async function AcademyPage() {
  const items = await db.academyArticle.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
  });

  const categories = [...new Set(items.map((i) => i.category))];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Academy Coming Soon</h2>
        <p className="text-slate-500 max-w-sm">Trading courses, market analysis, and strategy guides will be available here shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trading Academy</h1>
        <p className="text-slate-500 mt-1">Free educational resources to help you trade smarter</p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 capitalize">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.filter((i) => i.category === cat).map((item) => (
              <Link key={item.id} href={`/dashboard/academy/${item.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <div className="relative aspect-video bg-slate-100 rounded-t-xl overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  {item.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-slate-900 ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
