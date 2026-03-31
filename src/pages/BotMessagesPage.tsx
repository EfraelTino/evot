import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Loader2, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  bot_id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string | null;
}

const BotMessagesPage = () => {
  const { id } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [botName, setBotName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      // Get bot name
      const { data: botData } = await supabase
        .from("bots")
        .select("name")
        .eq("id", id!)
        .single();

      if (botData) setBotName(botData.name);

      // Get unique sessions
      const { data, error } = await supabase
        .from("messages")
        .select("session_id, created_at")
        .eq("bot_id", id!)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        const uniqueSessions = [...new Set(data?.map((m) => m.session_id) || [])];
        setSessions(uniqueSessions);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [id]);

  const loadMessages = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("bot_id", id!)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages(data || []);
    }
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
          Historial — {botName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sessions.length} conversación{sessions.length !== 1 ? "es" : ""}
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
              <MessageSquare className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Sin conversaciones
            </h3>
            <p className="text-muted-foreground text-sm">
              Aún no hay mensajes para este bot
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Session list */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Sesiones</h2>
            {sessions.map((sessionId) => (
              <button
                key={sessionId}
                onClick={() => loadMessages(sessionId)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                  selectedSession === sessionId
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs truncate">
                    {sessionId.substring(0, 16)}...
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[80%]">
                          {msg.role === "assistant" && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                          )}
                          <div
                            className={
                              msg.role === "user"
                                ? "chat-bubble-user"
                                : "chat-bubble-assistant"
                            }
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[10px] opacity-60 mt-1">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleString("es-ES")
                                : ""}
                            </p>
                          </div>
                          {msg.role === "user" && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                Selecciona una sesión para ver los mensajes
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BotMessagesPage;
