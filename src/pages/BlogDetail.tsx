import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, User, ArrowLeft, Share2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticle } from "@/hooks/useArticles";
import { toast } from "sonner";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticle(slug || "");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt || "",
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin!");
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artikel tidak ditemukan</h1>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Blog
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="max-w-4xl mx-auto mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Blog
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : article ? (
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <header className="mb-8">
                {article.category && (
                  <Badge variant="secondary" className="mb-4">
                    {article.category}
                  </Badge>
                )}

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-6 leading-tight">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {article.author}
                  </span>
                  {article.published_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(article.published_at), "d MMMM yyyy", {
                        locale: localeId,
                      })}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="ml-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan
                  </Button>
                </div>
              </header>

              {/* Cover Image */}
              {article.cover_image_url && (
                <div className="aspect-video rounded-xl overflow-hidden mb-10 bg-muted">
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div
                className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:text-muted-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Footer */}
              <footer className="mt-12 pt-8 border-t">
                <div className="flex items-center justify-between">
                  <Button variant="outline" asChild>
                    <Link to="/blog">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Lihat Artikel Lainnya
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Artikel
                  </Button>
                </div>
              </footer>
            </div>
          ) : null}
        </div>
      </article>
    </Layout>
  );
}
