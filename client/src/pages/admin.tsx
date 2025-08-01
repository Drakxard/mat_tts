import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Home, Plus, Download, Trash2, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";

interface Stats {
  totalPhrases: number;
  currentIndex: number;
  dailyRequests: number;
}

interface Phrase {
  id: string;
  content: string;
  createdAt: string;
}

export default function Admin() {
  const [bulkText, setBulkText] = useState("");
  const [phraseCount, setPhraseCount] = useState(0);
  const { toast } = useToast();

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch phrases
  const { data: phrases, isLoading: phrasesLoading } = useQuery<Phrase[]>({
    queryKey: ["/api/admin/phrases"],
  });

  // Bulk add phrases mutation
  const addBulkMutation = useMutation({
    mutationFn: async (phrasesText: string) => {
      const response = await apiRequest("POST", "/api/admin/phrases/bulk", {
        phrases: phrasesText,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message,
      });
      setBulkText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete all phrases mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/admin/phrases");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete single phrase mutation
  const deletePhraseeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/phrases/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Frase eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update phrase count when bulk text changes
  useEffect(() => {
    const phrases = bulkText
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    setPhraseCount(phrases.length);
  }, [bulkText]);

  const handleAddBulkPhrases = (e: React.FormEvent) => {
    e.preventDefault();
    if (phraseCount === 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa al menos una frase",
        variant: "destructive",
      });
      return;
    }
    addBulkMutation.mutate(bulkText);
  };

  const handleExport = (format: "txt" | "csv") => {
    const url = `/api/admin/export?format=${format}`;
    window.open(url, "_blank");
    toast({
      title: "Éxito",
      description: `Frases exportadas en formato ${format.toUpperCase()}`,
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    toast({
      title: "Éxito",
      description: "Lista actualizada",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-white hover:text-blue-400 transition-colors flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Administración</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-gray-400">Gestiona las frases del sistema</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="text-blue-500 text-2xl mr-3">💬</div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Frases</p>
                    <p className="text-2xl font-bold text-white">
                      {statsLoading ? "..." : stats?.totalPhrases || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="text-green-500 text-2xl mr-3">👁️</div>
                  <div>
                    <p className="text-gray-400 text-sm">Frase Actual</p>
                    <p className="text-2xl font-bold text-white">
                      {statsLoading ? "..." : (stats?.currentIndex ?? 0) + 1}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="text-purple-500 text-2xl mr-3">📊</div>
                  <div>
                    <p className="text-gray-400 text-sm">Requests Hoy</p>
                    <p className="text-2xl font-bold text-white">
                      {statsLoading ? "..." : stats?.dailyRequests || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bulk Add Phrases */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Plus className="w-5 h-5 mr-3 text-blue-500" />
                  Agregar Frases en Masa
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Agrega múltiples frases separadas por punto y coma (;)
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBulkPhrases} className="space-y-4">
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={6}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Frase 1; Frase 2; Frase 3; ..."
                  />
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">{phraseCount}</span> frases detectadas
                    </p>
                    <Button 
                      type="submit"
                      disabled={addBulkMutation.isPending || phraseCount === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {addBulkMutation.isPending ? (
                        "Agregando..."
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Frases
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Export/Delete Section */}
            <div className="space-y-6">
              {/* Export Phrases */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Download className="w-5 h-5 mr-3 text-green-500" />
                    Exportar Frases
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    Descarga todas las frases en formato de texto
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => handleExport("txt")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar como TXT
                  </Button>
                  <Button 
                    onClick={() => handleExport("csv")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar como CSV
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-red-900/20 border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                    Zona de Peligro
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    Esta acción no se puede deshacer
                  </p>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Todas las Frases
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center">
                          <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                          Confirmar Eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          ¿Estás seguro de que quieres eliminar todas las frases? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteAllMutation.mutate()}
                          disabled={deleteAllMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteAllMutation.isPending ? "Eliminando..." : "Eliminar Todo"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Phrases */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-white">
                  <div className="text-blue-500 text-xl mr-3">📝</div>
                  Frases Recientes
                </CardTitle>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {phrasesLoading ? (
                <div className="text-center py-8 text-gray-400">Cargando frases...</div>
              ) : phrases && phrases.length > 0 ? (
                <div className="space-y-3">
                  {phrases.slice(0, 10).map((phrase, index) => (
                    <div 
                      key={phrase.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                          {index + 1}
                        </span>
                        <p className="text-white flex-1">{phrase.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePhraseeMutation.mutate(phrase.id)}
                        disabled={deletePhraseeMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {phrases.length > 10 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-blue-400">
                        Mostrando 10 de {phrases.length} frases
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No hay frases disponibles. Agrega algunas frases para comenzar.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
