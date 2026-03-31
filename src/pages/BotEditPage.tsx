import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Copy, Loader2, Check, MessageCircle, Bot, Headphones, LifeBuoy, MessageSquare, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidSiteUrl } from "@/lib/utils";

const BUTTON_ICONS = [
  { id: "bot", label: "Bot", Icon: Bot },
  { id: "message-circle", label: "Chat", Icon: MessageCircle },
  { id: "headphones", label: "Soporte", Icon: Headphones },
  { id: "life-buoy", label: "Ayuda", Icon: LifeBuoy },
  { id: "message-square", label: "Mensaje", Icon: MessageSquare },
  { id: "zap", label: "Rápido", Icon: Zap },
];

const BotEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    site_url: "",
    color: "#7C3AED",
    welcome_msg: "",
    prompt: "",
    logo_url: "",
    button_icon: "bot",
    position: "right",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchBot = async () => {
      const { data, error } = await supabase
        .from("bots")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data) {
        setForm({
          name: data.name || "",
          site_url: data.site_url || "",
          color: data.color || "#7C3AED",
          welcome_msg: data.welcome_msg || "",
          prompt: data.prompt || "",
          logo_url: data.logo_url || "",
          button_icon: data.button_icon || "bot",
          position: data.position || "right",
        });
      }
      setLoading(false);
    };
    fetchBot();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidSiteUrl(form.site_url)) {
      setUrlError("Usa el formato exacto: https://tudominio.com");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("bots")
      .update({
        name: form.name,
        site_url: form.site_url || null,
        color: form.color,
        welcome_msg: form.welcome_msg,
        prompt: form.prompt,
        logo_url: form.logo_url || null,
        button_icon: form.button_icon,
        position: form.position,
      })
      .eq("id", id!);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bot actualizado", description: "Los cambios se guardaron correctamente." });
    }
    setSaving(false);
  };

  const snippet = `<script src="${window.location.origin}/bot.js?id=${id}"></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground mb-2">
          <Link to="/admin/bots">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Editar Bot
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>
                Configuración general
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del bot</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_url">URL del sitio</Label>
                  <Input
                    id="site_url"
                    value={form.site_url}
                    onChange={(e) => { setForm({ ...form, site_url: e.target.value }); setUrlError(""); }}
                    placeholder="https://misitio.com"
                    required
                  />
                  {urlError && <p className="text-xs text-destructive">{urlError}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color">Color del widget</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome_msg">Mensaje de bienvenida</Label>
                  <Input
                    id="welcome_msg"
                    value={form.welcome_msg}
                    onChange={(e) => setForm({ ...form, welcome_msg: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del logo (se muestra en el header del chat)</Label>
                  <Input
                    id="logo_url"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://misitio.com/logo.png"
                  />
                  {form.logo_url && (
                    <div className="mt-2">
                      <img src={form.logo_url} alt="Logo preview" className="h-10 w-10 rounded-lg object-cover border border-border" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ícono del botón</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {BUTTON_ICONS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        onClick={() => setForm({ ...form, button_icon: id })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                          form.button_icon === id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Posición del widget</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, position: "left" })}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.position === "left"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      ← Izquierda
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, position: "right" })}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.position === "right"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Derecha →
                    </button>
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>
                Prompt del sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder="Eres un asistente virtual amable que ayuda a los usuarios con..."
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="gradient-primary text-primary-foreground"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </form>

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>
                Snippet de instalación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Copia este código y pégalo antes del cierre de <code className="bg-muted px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code> en tu sitio web:
              </p>
              <div className="relative">
                <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto">
                  {snippet}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1"
                  onClick={copySnippet}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="h-12 flex items-center px-4 gap-2"
                  style={{ backgroundColor: form.color }}
                >
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="h-7 w-7 rounded-md object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center">
                      <span className="text-xs" style={{ color: '#fff' }}>🤖</span>
                    </div>
                  )}
                  <span className="text-sm font-medium" style={{ color: '#fff' }}>
                    {form.name || "Mi Bot"}
                  </span>
                </div>
                <div className="bg-card p-4 space-y-3">
                  <div className="chat-bubble-assistant text-sm">
                    {form.welcome_msg || "Hola, ¿en qué puedo ayudarte?"}
                  </div>
                  <div className="chat-bubble-user text-sm">
                    ¡Hola!
                  </div>
                </div>
                <div className="border-t border-border p-3 bg-card">
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-muted-foreground">
                      Escribe un mensaje...
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: form.color }}
                    >
                      <span className="text-xs" style={{ color: '#fff' }}>▶</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BotEditPage;
