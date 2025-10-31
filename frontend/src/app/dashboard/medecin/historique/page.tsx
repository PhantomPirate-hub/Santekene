'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Calendar as CalendarIcon,
  User,
  Loader2,
  AlertCircle,
  Eye,
  Filter,
  X,
  Edit,
} from 'lucide-react';
import EditConsultationModal from '@/components/medecin/EditConsultationModal';

interface Consultation {
  id: number;
  date: Date;
  diagnosis: string | null;
  notes: string | null;
  allergies: string | null;
  aiSummary: string | null;
  triageScore: number | null;
  blockchainTxId: string | null;
  patient: {
    id: number;
    name: string;
    phone: string;
    bloodGroup: string | null;
    birthDate: Date | null;
  };
}

export default function HistoriquePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    patientName: '',
    diagnosis: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!token) return;
    fetchConsultations();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [consultations, filters]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/medecin/consultations/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'historique');
      }

      const data = await response.json();
      setConsultations(data.consultations);
      setFilteredConsultations(data.consultations);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...consultations];

    // Filtre par nom de patient
    if (filters.patientName) {
      const searchTerm = filters.patientName.toLowerCase();
      filtered = filtered.filter((c) =>
        c.patient.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par diagnostic
    if (filters.diagnosis) {
      const searchTerm = filters.diagnosis.toLowerCase();
      filtered = filtered.filter((c) =>
        c.diagnosis?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par date de début
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((c) => new Date(c.date) >= startDate);
    }

    // Filtre par date de fin
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => new Date(c.date) <= endDate);
    }

    setFilteredConsultations(filtered);
  };

  const resetFilters = () => {
    setFilters({
      patientName: '',
      diagnosis: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
          <p className="text-texte-principal/60">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <FileText className="w-8 h-8 mr-3 text-bleu-principal" />
            Historique des Consultations
          </h1>
          <p className="text-texte-principal/60 mt-2">
            {filteredConsultations.length} consultation(s) trouvée(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtres */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtres
                </span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche par patient */}
              <div>
                <Label htmlFor="patientName" className="flex items-center mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Nom du patient
                </Label>
                <Input
                  id="patientName"
                  placeholder="Rechercher un patient..."
                  value={filters.patientName}
                  onChange={(e) => setFilters({ ...filters, patientName: e.target.value })}
                />
              </div>

              {/* Recherche par diagnostic */}
              <div>
                <Label htmlFor="diagnosis" className="flex items-center mb-2">
                  <Search className="w-4 h-4 mr-2" />
                  Diagnostic
                </Label>
                <Input
                  id="diagnosis"
                  placeholder="Rechercher un diagnostic..."
                  value={filters.diagnosis}
                  onChange={(e) => setFilters({ ...filters, diagnosis: e.target.value })}
                />
              </div>

              {/* Date de début */}
              <div>
                <Label htmlFor="startDate" className="flex items-center mb-2">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Date de début
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              {/* Date de fin */}
              <div>
                <Label htmlFor="endDate" className="flex items-center mb-2">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Date de fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Liste des consultations */}
          <div className="lg:col-span-2 space-y-4">
            {filteredConsultations.length === 0 ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-medium">
                      {hasActiveFilters
                        ? 'Aucune consultation ne correspond aux filtres.'
                        : 'Aucune consultation trouvée.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredConsultations.map((consultation) => (
                <Card
                  key={consultation.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-bleu-principal"
                  onClick={() => setSelectedConsultation(consultation)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-texte-principal">
                            {consultation.patient.name}
                          </h3>
                          {consultation.patient.bloodGroup && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              {consultation.patient.bloodGroup}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-texte-principal/70">
                          <div>
                            <p className="font-medium text-texte-principal">📅 Date</p>
                            <p>
                              {new Date(consultation.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-texte-principal">📞 Téléphone</p>
                            <p>{consultation.patient.phone}</p>
                          </div>
                        </div>

                        {consultation.diagnosis && (
                          <div className="mt-4">
                            <p className="font-medium text-texte-principal mb-1">🩺 Diagnostic</p>
                            <p className="text-sm text-texte-principal/80">
                              {consultation.diagnosis}
                            </p>
                          </div>
                        )}

                        {consultation.blockchainTxId && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs">
                              🔐 Blockchain: {consultation.blockchainTxId}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConsultation(consultation);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Modal des détails */}
        {selectedConsultation && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedConsultation(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="bg-gradient-to-r from-bleu-clair to-aqua-moderne text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Détails de la Consultation</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        setEditingConsultation(selectedConsultation);
                        setSelectedConsultation(null);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setSelectedConsultation(null)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Informations patient */}
                <div>
                  <h3 className="font-bold text-lg text-texte-principal mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-bleu-principal" />
                    Patient
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-texte-principal/60">Nom</p>
                      <p className="font-semibold">{selectedConsultation.patient.name}</p>
                    </div>
                    <div>
                      <p className="text-texte-principal/60">Téléphone</p>
                      <p className="font-semibold">{selectedConsultation.patient.phone}</p>
                    </div>
                    {selectedConsultation.patient.bloodGroup && (
                      <div>
                        <p className="text-texte-principal/60">Groupe sanguin</p>
                        <p className="font-semibold">{selectedConsultation.patient.bloodGroup}</p>
                      </div>
                    )}
                    {selectedConsultation.patient.birthDate && (
                      <div>
                        <p className="text-texte-principal/60">Date de naissance</p>
                        <p className="font-semibold">
                          {new Date(selectedConsultation.patient.birthDate).toLocaleDateString(
                            'fr-FR'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date de consultation */}
                <div>
                  <h3 className="font-bold text-lg text-texte-principal mb-3 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-bleu-principal" />
                    Date de consultation
                  </h3>
                  <p className="text-sm">
                    {new Date(selectedConsultation.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Diagnostic */}
                {selectedConsultation.diagnosis && (
                  <div>
                    <h3 className="font-bold text-lg text-texte-principal mb-3">🩺 Diagnostic</h3>
                    <p className="text-sm text-texte-principal/80">
                      {selectedConsultation.diagnosis}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedConsultation.notes && (
                  <div>
                    <h3 className="font-bold text-lg text-texte-principal mb-3">📝 Notes</h3>
                    <p className="text-sm text-texte-principal/80 whitespace-pre-wrap">
                      {selectedConsultation.notes}
                    </p>
                  </div>
                )}

                {/* Allergies */}
                {selectedConsultation.allergies && (
                  <div>
                    <h3 className="font-bold text-lg text-texte-principal mb-3 text-red-600">
                      ⚠️ Allergies détectées
                    </h3>
                    <p className="text-sm text-texte-principal/80 bg-red-50 p-3 rounded border border-red-200">
                      {selectedConsultation.allergies}
                    </p>
                  </div>
                )}

                {/* Résumé IA */}
                {selectedConsultation.aiSummary && (
                  <div>
                    <h3 className="font-bold text-lg text-texte-principal mb-3">🤖 Analyse IA</h3>
                    <p className="text-sm text-texte-principal/80 bg-blue-50 p-3 rounded border border-blue-200">
                      {selectedConsultation.aiSummary}
                    </p>
                    {selectedConsultation.triageScore !== null && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Score de triage: {(selectedConsultation.triageScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Blockchain */}
                {selectedConsultation.blockchainTxId && (
                  <div>
                    <h3 className="font-bold text-lg text-texte-principal mb-3">🔐 Blockchain</h3>
                    <p className="text-xs font-mono bg-gray-100 p-3 rounded border">
                      {selectedConsultation.blockchainTxId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de modification */}
        {editingConsultation && token && (
          <EditConsultationModal
            consultation={editingConsultation}
            token={token}
            onClose={() => setEditingConsultation(null)}
            onSuccess={() => {
              fetchConsultations();
              setEditingConsultation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

