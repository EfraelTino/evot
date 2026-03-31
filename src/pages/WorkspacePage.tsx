import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  UserPlus,
  Trash2,
  Loader2,
  Users,
  Bot,
  MessageSquare,
  Pencil,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateBotForm from "@/components/CreateBotForm";

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface WorkspaceBot {
  id: string;
  name: string;
  site_url: string | null;
  color: string | null;
  logo_url: string | null;
  created_at: string | null;
}

const WorkspacePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [bots, setBots] = useState<WorkspaceBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [botDialogOpen, setBotDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);

  const isOwner = workspace?.owner_id === user?.id;

  const fetchData = async () => {
    const [wsRes, membersRes, botsRes] = await Promise.all([
      supabase.from("workspaces").select("*").eq("id", id!).single(),
      supabase.from("workspace_members").select("*").eq("workspace_id", id!),
      supabase
        .from("bots")
        .select("*")
        .eq("workspace_id", id!)
        .order("created_at", { ascending: false }),
    ]);

    if (wsRes.data) setWorkspace(wsRes.data as Workspace);
    if (membersRes.data) setMembers(membersRes.data as WorkspaceMember[]);
    if (botsRes.data) setBots(botsRes.data as WorkspaceBot[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    // Look up user by email - we need to find user id
    // Since we can't query auth.users, we'll store the email and let the invited user claim it
    // For now, we'll use the email as a placeholder approach
    // In a real app you'd use an edge function or invitation system
    toast({
      title: "Funcionalidad próximamente",
      description:
        "El sistema de invitaciones por email requiere configuración adicional. Por ahora, comparte el ID del workspace con el usuario.",
    });
    setInviting(false);
    setInviteDialogOpen(false);
  };

  const deleteBot = async (botId: string) => {
    const { error } = await supabase.from("bots").delete().eq("id", botId);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBots(bots.filter((b) => b.id !== botId));
      toast({ title: "Bot eliminado" });
    }
    setBotToDelete(null);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMembers(members.filter((m) => m.id !== memberId));
      toast({ title: "Miembro eliminado" });
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
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground mb-2"
        >
          <Link to="/admin/workspaces">← Workspaces</Link>
        </Button>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {workspace?.name}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Bots section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bots
            </h2>
            <Dialog open={botDialogOpen} onOpenChange={setBotDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Nuevo Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear bot en workspace</DialogTitle>
                </DialogHeader>
                <CreateBotForm
                  workspaceId={id}
                  onSuccess={() => {
                    setBotDialogOpen(false);
                    fetchData();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {bots.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  No hay bots en este workspace
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {bots.map((bot) => (
                <Card
                  key={bot.id}
                  className="shadow-card hover:shadow-elevated transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {bot.logo_url ? (
                        <img
                          src={bot.logo_url}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: bot.color || "#7C3AED" }}
                        >
                          <MessageSquare className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {bot.name}
                        </h3>
                        {bot.site_url && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {bot.site_url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/admin/bots/${bot.id}/edit`}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/admin/bots/${bot.id}/messages`}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Historial
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setBotToDelete(bot.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Members section   <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Miembros</h2>
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><UserPlus className="mr-1.5 h-4 w-4" />Invitar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar miembro</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={inviteMember} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Email del usuario</Label>
                      <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="usuario@email.com" />
                    </div>
                    <Button type="submit" className="w-full" disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar invitación
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Propietario</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>

              {members.filter(m => m.user_id !== user?.id).map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.role}</p>
                      <p className="text-xs text-muted-foreground">{member.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMember(member.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>*/}
      </div>
      <AlertDialog
        open={!!botToDelete}
        onOpenChange={(open) => !open && setBotToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Seguro que quieres eliminar este bot?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el bot y todo su
              historial de mensajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => botToDelete && deleteBot(botToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default WorkspacePage;
