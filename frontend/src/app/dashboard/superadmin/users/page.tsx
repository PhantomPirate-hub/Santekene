'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Shield,
  Stethoscope,
  User,
  Loader2,
  Ban,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  patient?: {
    birthDate: string | null;
    bloodGroup: string | null;
    location: string | null;
  };
  doctor?: {
    speciality: string | null;
    structure: string | null;
    location: string | null;
  };
  admin?: {
    id: number;
    centerId: number | null;
  };
  superAdmin?: {
    id: number;
    permissions: string | null;
  };
}

export default function UsersPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    patients: 0,
    doctors: 0,
    admins: 0,
    superAdmins: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    if (token) {
      console.log('🚀 useEffect triggered, fetching users...');
      fetchUsers();
    } else {
      console.log('⏳ Waiting for token...');
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      console.log('🔍 Fetching users from:', `${backendUrl}/api/superadmin/users`);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${backendUrl}/api/superadmin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Data received:', data);
        console.log('👥 Users count:', data.users?.length);
        console.log('📊 Stats:', data.stats);
        setUsers(data.users || []);
        setStats(data.stats || {
          total: 0,
          patients: 0,
          doctors: 0,
          admins: 0,
          superAdmins: 0,
          active: 0,
          inactive: 0,
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        toast.error(errorData.error || 'Erreur de chargement');
      }
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/superadmin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(currentStatus ? 'Utilisateur désactivé' : 'Utilisateur activé');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const filteredUsers = users.filter((user) => {
    // Filtre par rôle
    if (filter !== 'all' && user.role !== filter) return false;
    
    // Recherche
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  console.log('🔍 Total users:', users.length);
  console.log('🔍 Filtered users:', filteredUsers.length);
  console.log('🔍 Current filter:', filter);
  console.log('🔍 Current search:', search);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return <Badge className="bg-blue-500"><User className="w-3 h-3 mr-1" />Patient</Badge>;
      case 'MEDECIN':
        return <Badge className="bg-green-500"><Stethoscope className="w-3 h-3 mr-1" />Médecin</Badge>;
      case 'ADMIN':
        return <Badge className="bg-orange-500"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'SUPERADMIN':
        return <Badge className="bg-purple-500"><Shield className="w-3 h-3 mr-1" />Super Admin</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <Users className="w-8 h-8 mr-3 text-purple-600" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Vue d'ensemble et gestion de tous les comptes utilisateurs
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-texte-principal">{stats.total}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.patients}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.doctors}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Médecins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.admins}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.superAdmins}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Super</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-xs text-texte-principal/60 mt-1">Inactifs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtres et liste */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="PATIENT">Patients</TabsTrigger>
            <TabsTrigger value="MEDECIN">Médecins</TabsTrigger>
            <TabsTrigger value="ADMIN">Admins</TabsTrigger>
            <TabsTrigger value="SUPERADMIN">Super</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 space-y-3">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                  <p className="text-texte-principal/60">Aucun utilisateur trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-texte-principal">{user.name}</h3>
                          {getRoleBadge(user.role)}
                          {user.isVerified ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <Ban className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center space-x-2 text-texte-principal/70">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-texte-principal/70">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          
                          {/* Infos spécifiques patient */}
                          {user.patient && (
                            <>
                              {user.patient.bloodGroup && (
                                <Badge variant="outline" className="w-fit">
                                  Groupe: {user.patient.bloodGroup}
                                </Badge>
                              )}
                              {user.patient.location && (
                                <div className="flex items-center space-x-2 text-texte-principal/70">
                                  <MapPin className="w-4 h-4" />
                                  <span>{user.patient.location}</span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Infos spécifiques médecin */}
                          {user.doctor && (
                            <>
                              {user.doctor.speciality && (
                                <Badge variant="outline" className="w-fit">
                                  {user.doctor.speciality}
                                </Badge>
                              )}
                              {user.doctor.structure && (
                                <div className="flex items-center space-x-2 text-texte-principal/70">
                                  <MapPin className="w-4 h-4" />
                                  <span>{user.doctor.structure}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-texte-principal/50">
                          Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant={user.isVerified ? 'destructive' : 'outline'}
                          onClick={() => handleToggleActive(user.id, user.isVerified)}
                        >
                          {user.isVerified ? (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

