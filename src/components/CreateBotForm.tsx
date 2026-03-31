import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidSiteUrl } from "@/lib/utils";

const WEBHOOK_URL =
  "https://enewebhook.yaagendo.com/webhook/60f9502b-bcb7-4788-aa4c-9906f14451d3";

interface CreateBotFormProps {
  workspaceId?: string;
  onSuccess: () => void;
}

const CreateBotForm = ({ workspaceId, onSuccess }: CreateBotFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      supabase
        .from("workspaces")
        .select("id, name")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setWorkspaces(data);
        });
    }
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const wsId = workspaceId || selectedWorkspaceId;
    if (!wsId) {
      toast({ title: "Selecciona un workspace", variant: "destructive" });
      return;
    }

    if (!isValidSiteUrl(siteUrl)) {
      setUrlError("Usa el formato exacto: https://tudominio.com");
      return;
    }

    setCreating(true);

    const { error } = await supabase.from("bots").insert({
      name,
      site_url: siteUrl,
      user_id: user.id,
      workspace_id: wsId,
      webhook_url: WEBHOOK_URL,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bot creado", description: "Tu nuevo bot está listo." });
      setName("");
      setSiteUrl("");
      setSelectedWorkspaceId("");
      onSuccess();
    }

    setCreating(false);
  };

  const canSubmit = !!name && !!siteUrl && (!!workspaceId || !!selectedWorkspaceId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      {!workspaceId && (
        <div className="space-y-2">
          <Label>Workspace</Label>
          <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="create-bot-name">Nombre del bot</Label>
        <Input
          id="create-bot-name"
          placeholder="Mi Asistente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="create-bot-url">URL del sitio</Label>
        <Input
          id="create-bot-url"
          placeholder="https://misitio.com"
          value={siteUrl}
          onChange={(e) => { setSiteUrl(e.target.value); setUrlError(""); }}
          required
        />
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary text-primary-foreground"
        disabled={creating || !canSubmit}
      >
        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear Bot
      </Button>
    </form>
  );
};

export default CreateBotForm;
