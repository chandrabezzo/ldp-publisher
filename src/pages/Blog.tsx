import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/hooks/useArticles";

export default function Blog() {
  const { data: articles, isLoading } = useArticles();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles?.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(articles?.map((a) => a.category).filter(Boolean))];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
              Blog & Artikel
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Temukan insight, tips, dan berita terkini seputar dunia penerbitan dan literasi Indonesia
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSearchQuery("")}
              >
                Semua
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSearchQuery(category || "")}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <Link to={`/blog/${article.slug}`}>
                    <div className="aspect-video overflow-hidden bg-muted">
                      {article.cover_image_url ? (
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <span className="text-4xl font-serif text-primary/30">
                            {article.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-6">
                    {article.category && (
                      <Badge variant="secondary" className="mb-3">
                        {article.category}
                      </Badge>
                    )}

                    <Link to={`/blog/${article.slug}`}>
                      <h2 className="text-xl font-semibold font-serif mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                    </Link>

                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {article.author}
                        </span>
                        {article.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(article.published_at), "d MMM yyyy", {
                              locale: localeId,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/blog/${article.slug}`}
                      className="inline-flex items-center gap-1 mt-4 text-primary font-medium text-sm hover:gap-2 transition-all"
                    >
                      Baca selengkapnya
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {searchQuery
                  ? "Tidak ada artikel yang sesuai dengan pencarian Anda"
                  : "Belum ada artikel yang dipublikasikan"}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
