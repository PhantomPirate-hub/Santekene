'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Heart,
  MessageCircle,
  Search,
  Filter,
  X,
  Send,
  Trash2,
  Edit,
  HeartPulse,
  Sparkles,
  Apple,
  Dumbbell,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';

interface Author {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
}

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  comments?: Comment[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({});
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Formulaire de création de post
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
  });

  // Charger les catégories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Charger les posts
  useEffect(() => {
    fetchPosts();
  }, [searchQuery, selectedCategory, activeTab, sortBy, pagination.page]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '';
      if (activeTab === 'my') {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/community/my-posts`;
      } else {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(searchQuery && { search: searchQuery }),
          ...(selectedCategory && { category: selectedCategory }),
        });
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts?${params}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'my') {
          setPosts(data);
        } else {
          setPosts(data.posts);
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPost.title || !newPost.content || !newPost.category) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        alert('Post créé avec succès !');
        setIsCreateModalOpen(false);
        setNewPost({ title: '', content: '', category: '' });
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la création du post');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur serveur');
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPost) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content,
          category: editingPost.category,
        }),
      });

      if (res.ok) {
        alert('Post modifié avec succès !');
        setIsEditModalOpen(false);
        setEditingPost(null);
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la modification du post');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur serveur');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('Post supprimé avec succès !');
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression du post');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur serveur');
    }
  };

  const handleToggleLike = async (postId: number) => {
    try {
      console.log('🔄 Toggle like pour post:', postId);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Réponse like:', data);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLikedByCurrentUser: data.isLiked,
                  likesCount: data.isLiked ? post.likesCount + 1 : post.likesCount - 1,
                }
              : post
          )
        );
      } else {
        const errorData = await res.json();
        console.error('❌ Erreur like:', errorData);
        alert(errorData.error || 'Erreur lors du like');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      alert('Erreur lors du like');
    }
  };

  const fetchPostComments = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Mettre à jour le post avec ses commentaires
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, comments: data.comments }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = commentTexts[postId]?.trim();
    if (!content) {
      alert('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      console.log('💬 Ajout commentaire pour post:', postId, 'Contenu:', content);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Commentaire ajouté:', data);
        setCommentTexts({ ...commentTexts, [postId]: '' });
        
        // Recharger les commentaires du post
        await fetchPostComments(postId);
        
        // Incrémenter le compteur
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          )
        );
      } else {
        const data = await res.json();
        console.error('❌ Erreur commentaire:', data);
        alert(data.error || 'Erreur lors de l\'ajout du commentaire');
      }
    } catch (error) {
      console.error('❌ Erreur réseau commentaire:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Recharger les commentaires du post
        await fetchPostComments(postId);
        
        // Décrémenter le compteur
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, commentsCount: post.commentsCount - 1 }
              : post
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression du commentaire');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      HeartPulse,
      Sparkles,
      Apple,
      Dumbbell,
      MessageSquare,
      HelpCircle,
    };
    const Icon = icons[iconName] || HeartPulse;
    return <Icon className="w-4 h-4" />;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      PATIENT: 'bg-blue-100 text-blue-800',
      MEDECIN: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      SUPERADMIN: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Trier les posts côté client
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likesCount - a.likesCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HeartbeatLoader />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-vert-kene" />
          <h1 className="text-3xl font-bold text-nuit-confiance">Communauté Santé Kènè</h1>
        </div>
        <p className="text-nuit-confiance/70">
          Partagez, échangez et apprenez avec notre communauté santé
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-nuit-confiance">{pagination.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-vert-kene" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mes Posts</p>
                <p className="text-2xl font-bold text-nuit-confiance">
                  {posts.filter(p => p.author.id === user?.id).length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Catégories</p>
                <p className="text-2xl font-bold text-nuit-confiance">{categories.length}</p>
              </div>
              <Filter className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions */}
      <div className="mb-6 space-y-4">
        {/* Onglets */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('all');
              setPagination({ ...pagination, page: 1 });
            }}
            className={activeTab === 'all' ? 'bg-vert-kene hover:bg-vert-kene/90' : ''}
          >
            Tous les posts
          </Button>
          <Button
            variant={activeTab === 'my' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my')}
            className={activeTab === 'my' ? 'bg-vert-kene hover:bg-vert-kene/90' : ''}
          >
            Mes posts
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-auto bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau post
          </Button>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par catégorie */}
          <div className="w-full md:w-64">
            <Select value={selectedCategory || 'ALL'} onValueChange={(value) => setSelectedCategory(value === 'ALL' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(cat.icon)}
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tri */}
          <div className="w-full md:w-48">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Plus récents
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Plus populaires
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Liste des posts */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Aucun post trouvé</p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  Créer le premier post
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-vert-kene/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-vert-kene" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-nuit-confiance">{post.author.name}</p>
                            <Badge className={getRoleBadgeColor(post.author.role)}>
                              {post.author.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>

                      {/* Boutons de modification/suppression */}
                      {post.author.id === user?.id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPost(post);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <CardTitle className="mt-4">{post.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {categories.find((c) => c.value === post.category) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(categories.find((c) => c.value === post.category)!.icon)}
                          {post.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-nuit-confiance/80 whitespace-pre-wrap mb-4">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post.id)}
                        className={post.isLikedByCurrentUser ? 'text-red-600' : ''}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`}
                        />
                        {post.likesCount}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const isExpanding = !expandedComments[post.id];
                          setExpandedComments({
                            ...expandedComments,
                            [post.id]: isExpanding,
                          });
                          // Charger les commentaires si on ouvre la section
                          if (isExpanding) {
                            await fetchPostComments(post.id);
                          }
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {post.commentsCount}
                      </Button>
                    </div>

                    {/* Section commentaires */}
                    {expandedComments[post.id] && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Ajouter un commentaire */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Écrire un commentaire..."
                            value={commentTexts[post.id] || ''}
                            onChange={(e) =>
                              setCommentTexts({ ...commentTexts, [post.id]: e.target.value })
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Liste des commentaires */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-2">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">{comment.author.name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                  </div>
                                  {comment.author.id === user?.id && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                      className="text-red-600 h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {activeTab === 'all' && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modal de création */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-nuit-confiance">Créer un post</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre</label>
                  <Input
                    placeholder="Titre de votre post..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <Select
                    value={newPost.category}
                    onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat.icon)}
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contenu</label>
                  <Textarea
                    placeholder="Partagez votre expérience, posez une question..."
                    rows={6}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    Publier
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de modification */}
      <AnimatePresence>
        {isEditModalOpen && editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-nuit-confiance">Modifier le post</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleEditPost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre</label>
                  <Input
                    placeholder="Titre de votre post..."
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <Select
                    value={editingPost.category}
                    onValueChange={(value) => setEditingPost({ ...editingPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat.icon)}
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contenu</label>
                  <Textarea
                    placeholder="Partagez votre expérience, posez une question..."
                    rows={6}
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    Enregistrer
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
