import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "@/components/books/BookCard";

export default function BooksSection() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4);
    
    setBooks(data || []);
    setLoading(false);
  };

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 animate-fade-in-up">
          <div>
            <span className="text-primary text-sm font-medium uppercase tracking-wider">
              Katalog Buku
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif mt-2">
              Publikasi Terbaru
            </h2>
          </div>
          <Button variant="outline" asChild className="transition-smooth hover:scale-105">
            <Link to="/books">
              Lihat Semua
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-3 md:p-4 animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-lg mb-3 md:mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {books.map((book, index) => (
              <div key={book.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)}`}>
                <BookCard book={book} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16 bg-card rounded-2xl border border-border animate-fade-in-up">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold font-serif mb-2">
              Belum Ada Buku
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base px-4">
              Katalog buku kami sedang dalam proses persiapan. Segera hadir dengan 
              koleksi buku berkualitas dari penulis-penulis terbaik Indonesia.
            </p>
            <Button asChild>
              <Link to="/contact">Hubungi Kami</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
