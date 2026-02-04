import Layout from "@/components/layout/Layout";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <span className="text-primary text-sm font-medium uppercase tracking-wider">
              Events
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif mt-4 mb-6">
              Kegiatan <span className="text-gradient">LDP Publisher</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Ikuti berbagai acara menarik yang kami selenggarakan untuk para penulis dan pecinta literasi.
            </p>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Belum Ada Events</h3>
              <p className="text-muted-foreground">
                Nantikan kegiatan menarik dari kami.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <div 
                  key={event.id} 
                  className={`bg-card rounded-2xl border border-border overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-1 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                >
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-primary/50" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold font-serif mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {format(new Date(event.event_date), "d MMMM yyyy", { locale: id })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
