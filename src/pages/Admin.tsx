import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  LogOut,
  Image,
  X,
  Clock,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ldpLogo from "@/assets/ldp-logo.png";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import ArticlesManager from "@/components/admin/ArticlesManager";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  label: string;
}

interface Milestone {
  id: string;
  year: string;
  event: string;
  sort_order: number;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  is_published: boolean;
}


export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Settings state
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ year: "", event: "" });
  
  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
  });

  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    isbn: "",
    year_published: "",
    category: "",
    pages: "",
    price: "",
    cover_image_url: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
        navigate("/auth");
      }
    });
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    setIsAdmin(data === true);
    setLoading(false);

    if (data === true) {
      fetchBooks();
      fetchSiteSettings();
      fetchMilestones();
      fetchEvents();
    }
  };

  const fetchBooks = async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    setBooks(data || []);
  };

  const fetchSiteSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .like("key", "stat_%")
      .order("key");
    setSiteSettings(data || []);
  };

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .order("sort_order", { ascending: true });
    setMilestones(data || []);
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
    setEvents(data || []);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("book-covers")
      .upload(fileName, file);

    if (error) {
      toast.error("Gagal mengupload gambar");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("book-covers").getPublicUrl(fileName);

    setFormData({ ...formData, cover_image_url: publicUrl });
    setUploading(false);
    toast.success("Gambar berhasil diupload");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookData = {
      title: formData.title,
      author: formData.author,
      description: formData.description || null,
      isbn: formData.isbn || null,
      year_published: formData.year_published
        ? parseInt(formData.year_published)
        : null,
      category: formData.category || null,
      pages: formData.pages ? parseInt(formData.pages) : null,
      price: formData.price ? parseFloat(formData.price) : null,
      cover_image_url: formData.cover_image_url || null,
      created_by: user?.id,
    };

    if (editingBook) {
      const { error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", editingBook.id);

      if (error) {
        toast.error("Gagal mengupdate buku");
        return;
      }
      toast.success("Buku berhasil diupdate");
    } else {
      const { error } = await supabase.from("books").insert([bookData]);

      if (error) {
        toast.error("Gagal menambahkan buku");
        return;
      }
      toast.success("Buku berhasil ditambahkan");
    }

    resetForm();
    setIsDialogOpen(false);
    fetchBooks();
  };

  const handleEdit = (book: any) => {
    setEditingBook(book);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      isbn: book.isbn || "",
      year_published: book.year_published?.toString() || "",
      category: book.category || "",
      pages: book.pages?.toString() || "",
      price: book.price?.toString() || "",
      cover_image_url: book.cover_image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini?")) return;

    const { error } = await supabase.from("books").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus buku");
      return;
    }

    toast.success("Buku berhasil dihapus");
    fetchBooks();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      description: "",
      isbn: "",
      year_published: "",
      category: "",
      pages: "",
      price: "",
      cover_image_url: "",
    });
    setEditingBook(null);
  };

  // Settings handlers
  const handleUpdateSetting = async (id: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengupdate pengaturan");
      return;
    }
    toast.success("Pengaturan berhasil diupdate");
    fetchSiteSettings();
  };

  // Milestone handlers
  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMilestone) {
      const { error } = await supabase
        .from("milestones")
        .update({
          year: milestoneForm.year,
          event: milestoneForm.event,
        })
        .eq("id", editingMilestone.id);

      if (error) {
        toast.error("Gagal mengupdate milestone");
        return;
      }
      toast.success("Milestone berhasil diupdate");
    } else {
      const maxOrder = milestones.length > 0 
        ? Math.max(...milestones.map(m => m.sort_order)) + 1 
        : 1;
      
      const { error } = await supabase.from("milestones").insert([{
        year: milestoneForm.year,
        event: milestoneForm.event,
        sort_order: maxOrder,
      }]);

      if (error) {
        toast.error("Gagal menambahkan milestone");
        return;
      }
      toast.success("Milestone berhasil ditambahkan");
    }

    setMilestoneForm({ year: "", event: "" });
    setEditingMilestone(null);
    setIsMilestoneDialogOpen(false);
    fetchMilestones();
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({ year: milestone.year, event: milestone.event });
    setIsMilestoneDialogOpen(true);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus milestone ini?")) return;

    const { error } = await supabase.from("milestones").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus milestone");
      return;
    }

    toast.success("Milestone berhasil dihapus");
    fetchMilestones();
  };

  // Event handlers
  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setUploadingEventImage(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (error) {
      toast.error("Gagal mengupload gambar");
      setUploadingEventImage(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("event-images").getPublicUrl(fileName);

    setEventForm({ ...eventForm, image_url: publicUrl });
    setUploadingEventImage(false);
    toast.success("Gambar berhasil diupload");
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title: eventForm.title,
      description: eventForm.description || null,
      event_date: eventForm.event_date,
      location: eventForm.location || null,
      image_url: eventForm.image_url || null,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Gagal mengupdate event");
        return;
      }
      toast.success("Event berhasil diupdate");
    } else {
      const { error } = await supabase.from("events").insert([eventData]);

      if (error) {
        toast.error("Gagal menambahkan event");
        return;
      }
      toast.success("Event berhasil ditambahkan");
    }

    setEventForm({ title: "", description: "", event_date: "", location: "", image_url: "" });
    setEditingEvent(null);
    setIsEventDialogOpen(false);
    fetchEvents();
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      location: event.location || "",
      image_url: event.image_url || "",
    });
    setIsEventDialogOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus event ini?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus event");
      return;
    }

    toast.success("Event berhasil dihapus");
    fetchEvents();
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-6">
            Anda tidak memiliki akses admin. Hubungi administrator untuk mendapatkan akses.
          </p>
          <Button onClick={() => navigate("/")} className="gradient-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden">
                  <img src={ldpLogo} alt="LDP Publisher" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-bold font-serif text-sm md:text-base">{COMPANY_INFO.name}</span>
                  <p className="text-xs text-muted-foreground hidden sm:block">Admin Panel</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="w-4 h-4 hidden sm:inline" />
              <span>Buku</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="w-4 h-4 hidden sm:inline" />
              <span>Artikel</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4 hidden sm:inline" />
              <span>Statistik</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-2">
              <Clock className="w-4 h-4 hidden sm:inline" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4 hidden sm:inline" />
              <span>Events</span>
            </TabsTrigger>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif">Kelola Buku</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Tambah, edit, atau hapus buku yang sudah diterbitkan
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gradient-primary shadow-elegant w-full sm:w-auto"
                    onClick={resetForm}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Buku
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      {editingBook ? "Edit Buku" : "Tambah Buku Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Cover Image */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Cover Buku
                      </label>
                      <div className="flex items-start gap-4">
                        {formData.cover_image_url ? (
                          <div className="relative w-24 h-32 md:w-32 md:h-44 rounded-lg overflow-hidden border border-border">
                            <img
                              src={formData.cover_image_url}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, cover_image_url: "" })
                              }
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-24 h-32 md:w-32 md:h-44 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploading}
                            />
                            {uploading ? (
                              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <Image className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">
                                  Upload Cover
                                </span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Judul Buku *
                        </label>
                        <Input
                          required
                          placeholder="Judul buku"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Penulis *
                        </label>
                        <Input
                          required
                          placeholder="Nama penulis"
                          value={formData.author}
                          onChange={(e) =>
                            setFormData({ ...formData, author: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Deskripsi
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Deskripsi singkat buku"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          ISBN
                        </label>
                        <Input
                          placeholder="978-xxx-xxx-xxx-x"
                          value={formData.isbn}
                          onChange={(e) =>
                            setFormData({ ...formData, isbn: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Kategori
                        </label>
                        <Input
                          placeholder="Fiksi, Non-fiksi, dst."
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Tahun
                        </label>
                        <Input
                          type="number"
                          placeholder="2024"
                          value={formData.year_published}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              year_published: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Halaman
                        </label>
                        <Input
                          type="number"
                          placeholder="200"
                          value={formData.pages}
                          onChange={(e) =>
                            setFormData({ ...formData, pages: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Harga (Rp)
                        </label>
                        <Input
                          type="number"
                          placeholder="150000"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button type="submit" className="flex-1 gradient-primary">
                        {editingBook ? "Update Buku" : "Simpan Buku"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Books List */}
            {books.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="bg-card rounded-xl border border-border overflow-hidden group transition-smooth hover:shadow-elegant"
                  >
                    <div className="aspect-[3/4] relative bg-muted">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-primary/30" />
                        </div>
                      )}
                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleEdit(book)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(book.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-semibold font-serif line-clamp-2 mb-1 text-sm md:text-base">
                        {book.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{book.author}</p>
                      {book.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {book.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16 bg-card rounded-2xl border border-border">
                <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg md:text-xl font-semibold font-serif mb-2">
                  Belum Ada Buku
                </h2>
                <p className="text-muted-foreground mb-6 text-sm md:text-base">
                  Mulai tambahkan buku yang sudah diterbitkan
                </p>
                <Button
                  className="gradient-primary"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Buku Pertama
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <ArticlesManager />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif">Kelola Statistik</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Edit statistik yang ditampilkan di halaman beranda
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              {siteSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="p-4 md:p-6 bg-card rounded-xl border border-border"
                >
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {setting.label}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      defaultValue={setting.value}
                      className="text-lg font-bold"
                      onBlur={(e) => {
                        if (e.target.value !== setting.value) {
                          handleUpdateSetting(setting.id, e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {siteSettings.length === 0 && (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada pengaturan statistik</p>
              </div>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif">Kelola Timeline</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Edit perjalanan perusahaan di halaman Tentang Kami
                </p>
              </div>
              <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gradient-primary shadow-elegant w-full sm:w-auto"
                    onClick={() => {
                      setEditingMilestone(null);
                      setMilestoneForm({ year: "", event: "" });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4">
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      {editingMilestone ? "Edit Milestone" : "Tambah Milestone Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMilestoneSubmit} className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tahun *
                      </label>
                      <Input
                        required
                        placeholder="2024"
                        value={milestoneForm.year}
                        onChange={(e) =>
                          setMilestoneForm({ ...milestoneForm, year: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Event *
                      </label>
                      <Textarea
                        required
                        rows={3}
                        placeholder="Deskripsi milestone..."
                        value={milestoneForm.event}
                        onChange={(e) =>
                          setMilestoneForm({ ...milestoneForm, event: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMilestoneDialogOpen(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button type="submit" className="flex-1 gradient-primary">
                        {editingMilestone ? "Update" : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border group transition-smooth hover:shadow-elegant"
                  >
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                      {milestone.year.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-primary font-medium">
                        {milestone.year}
                      </span>
                      <p className="text-foreground font-medium truncate">
                        {milestone.event}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditMilestone(milestone)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold font-serif mb-2">
                  Belum Ada Milestone
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Tambahkan perjalanan perusahaan
                </p>
                <Button
                  className="gradient-primary"
                  onClick={() => {
                    setEditingMilestone(null);
                    setMilestoneForm({ year: "", event: "" });
                    setIsMilestoneDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Milestone Pertama
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif">Kelola Events</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Tambah, edit, atau hapus event dan kegiatan
                </p>
              </div>
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gradient-primary shadow-elegant w-full sm:w-auto"
                    onClick={() => {
                      setEditingEvent(null);
                      setEventForm({ title: "", description: "", event_date: "", location: "", image_url: "" });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      {editingEvent ? "Edit Event" : "Tambah Event Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEventSubmit} className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Judul Event *
                      </label>
                      <Input
                        required
                        placeholder="Nama event"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tanggal *
                      </label>
                      <Input
                        required
                        type="date"
                        value={eventForm.event_date}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, event_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Lokasi
                      </label>
                      <Input
                        placeholder="Lokasi event"
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, location: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Deskripsi
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Deskripsi event..."
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Gambar Event (opsional)
                      </label>
                      <div className="space-y-3">
                        {eventForm.image_url && (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                            <img
                              src={eventForm.image_url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 w-8 h-8"
                              onClick={() => setEventForm({ ...eventForm, image_url: "" })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleEventImageUpload}
                              disabled={uploadingEventImage}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              disabled={uploadingEventImage}
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                input?.click();
                              }}
                            >
                              {uploadingEventImage ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Image className="w-4 h-4 mr-2" />
                                  Pilih dari Galeri
                                </>
                              )}
                            </Button>
                          </label>
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={handleEventImageUpload}
                              disabled={uploadingEventImage}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              disabled={uploadingEventImage}
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                input?.click();
                              }}
                            >
                              <Image className="w-4 h-4 mr-2" />
                              Kamera
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEventDialogOpen(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button type="submit" className="flex-1 gradient-primary">
                        {editingEvent ? "Update" : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {events.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-card rounded-xl border border-border overflow-hidden group transition-smooth hover:shadow-elegant"
                  >
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.event_date), "d MMMM yyyy", { locale: idLocale })}
                      </div>
                      <h3 className="font-semibold font-serif line-clamp-2 mb-1">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          📍 {event.location}
                        </p>
                      )}
                      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold font-serif mb-2">
                  Belum Ada Event
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Tambahkan event dan kegiatan
                </p>
                <Button
                  className="gradient-primary"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventForm({ title: "", description: "", event_date: "", location: "", image_url: "" });
                    setIsEventDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Event Pertama
                </Button>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}