import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

const WorkspaceListPage = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setWorkspaces((data || []) as Workspace[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const { error } = await supabase.from("workspaces").insert({
      name: newName,
      owner_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Workspace creado" });
      setNewName("");
      setDialogOpen(false);
      fetchWorkspaces();
    }
    setCreating(false);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Workspaces
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Organiza tus bots en espacios de trabajo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={createWorkspace} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Mi Empresa" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Workspace
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
              <FolderOpen className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Sin workspaces</h3>
            <p className="text-muted-foreground text-sm mb-4">Crea tu primer workspace para organizar tus bots</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/admin/workspaces/${ws.id}`}>
              <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{ws.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {ws.owner_id === user?.id ? "Propietario" : "Miembro"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Creado {new Date(ws.created_at).toLocaleDateString("es-ES")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default WorkspaceListPage;
