'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  ToggleLeft, 
  ToggleRight,
  Tags,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface Category {
  id: number;
  name: string;
  isActive: boolean;
  postsCount: number;
  createdAt: string;
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
  });

  // Charger les catégories
  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories?includeInactive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }

      const data = await response.json();
      setCategories(data.categories);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token]);

  // Créer ou modifier une catégorie
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:3001/api/categories/${editingCategory.id}`
        : 'http://localhost:3001/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      toast.success(editingCategory ? 'Catégorie mise à jour !' : 'Catégorie créée !');
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
      });
      setEditingCategory(null);
      setShowForm(false);
      
      // Recharger les catégories
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Modifier une catégorie
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
    });
    setShowForm(true);
  };

  // Activer/Désactiver une catégorie
  const toggleCategoryStatus = async (id: number) => {
    if (!token) {
      toast.error('Session expirée');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/categories/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du changement de statut');
      }

      const data = await response.json();
      toast.success(data.message || 'Statut modifié !');
      await loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu-clair mx-auto mb-4"></div>
          <p className="text-texte-principal/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center gap-3">
            <Tags className="w-8 h-8 text-bleu-clair" />
            Gestion des Catégories
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Gérez les catégories de la communauté
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '' });
            setShowForm(!showForm);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Annuler' : 'Nouvelle Catégorie'}
        </Button>
      </div>

      {/* Formulaire de création/modification */}
      {showForm && (
        <Card className="border-2 border-green-500/30">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </CardTitle>
            <CardDescription className="text-white/80">
              Saisissez simplement le nom de la catégorie
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Santé, Nutrition, Sport..."
                  required
                  autoFocus
                />
                <p className="text-sm text-texte-principal/60 mt-1">
                  Un nom simple et clair pour la catégorie
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: '' });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Tags className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
              <p className="text-texte-principal/60">Aucune catégorie créée</p>
              <p className="text-sm text-texte-principal/40 mt-2">
                Créez votre première catégorie pour commencer
              </p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card
              key={category.id}
              className={`hover:shadow-lg transition-shadow ${
                !category.isActive ? 'opacity-60 border-red-300' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Badge
                    variant={category.isActive ? 'default' : 'destructive'}
                    className={category.isActive ? 'bg-green-600' : ''}
                  >
                    {category.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-texte-principal/60 mb-4">
                  <span>ID: {category.id}</span>
                  <span>{category.postsCount} post(s)</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(category)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    onClick={() => toggleCategoryStatus(category.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {category.isActive ? (
                      <ToggleRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 mr-1" />
                    )}
                    {category.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>

                {!category.isActive && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Cette catégorie ne sera pas visible lors de la création de posts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
          },
        }}
      />
    </motion.div>
  );
}

