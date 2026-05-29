import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, BookOpen, Play } from "lucide-react";

export default async function AcademyArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await (db as any).academyArticle.findUnique({ where: { id, published: true } });
  if (!item) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/academy" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Academy
      </Link>

      <Card>
        {/* Thumbnail / video */}
        {item.thumbnail ? (
          <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-slate-100">
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            {item.videoUrl && (
              <a
                href={item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-7 w-7 text-slate-900 ml-1" />
                </div>
              </a>
            )}
          </div>
        ) : item.videoUrl ? (
          <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-slate-900">
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors"
            >
              <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Play className="h-7 w-7 text-white ml-1" />
              </div>
              <span className="text-sm text-white/70">Watch video</span>
            </a>
          </div>
        ) : null}

        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">{item.category}</Badge>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-snug">{item.title}</h1>
          <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>

          {item.content ? (
            <div className="pt-4 border-t border-slate-100">
              <div
                className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed
                  [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-slate-900 [&>h2]:mt-6 [&>h2]:mb-2
                  [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-slate-900 [&>h3]:mt-4 [&>h3]:mb-1
                  [&>p]:mb-3 [&>ul]:mb-3 [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ul]:list-disc
                  [&>ol]:mb-3 [&>ol]:pl-5 [&>ol>li]:mb-1 [&>ol]:list-decimal
                  [&>strong]:font-semibold [&>strong]:text-slate-900
                  [&>blockquote]:border-l-4 [&>blockquote]:border-slate-200 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-500"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">Article content coming soon.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
