'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Consultation {
  id: number;
  diagnosis: string | null;
  notes: string | null;
  allergies: string | null;
  aiSummary: string | null;
}

interface EditConsultationModalProps {
  consultation: Consultation;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditConsultationModal({
  consultation,
  token,
  onClose,
  onSuccess,
}: EditConsultationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: consultation.diagnosis || '',
    notes: consultation.notes || '',
    allergies: consultation.allergies || '',
    aiSummary: consultation.aiSummary || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/medecin/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la modification');
      }

      toast.success('Consultation modifiée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="bg-gradient-to-r from-bleu-clair to-aqua-moderne text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Modifier la Consultation</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Diagnostic */}
            <div>
              <Label htmlFor="diagnosis">🩺 Diagnostic</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Diagnostic posé..."
                className="mt-2"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">📝 Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes de consultation..."
                rows={6}
                className="mt-2"
              />
            </div>

            {/* Allergies */}
            <div>
              <Label htmlFor="allergies" className="text-red-600">
                ⚠️ Allergies détectées
              </Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Allergies détectées lors de la consultation..."
                rows={3}
                className="mt-2 border-red-200 bg-red-50"
              />
              <p className="text-xs text-texte-principal/60 mt-1">
                Laissez vide si aucune allergie n'a été détectée
              </p>
            </div>

            {/* Résumé IA */}
            <div>
              <Label htmlFor="aiSummary">🤖 Résumé IA</Label>
              <Textarea
                id="aiSummary"
                value={formData.aiSummary}
                onChange={(e) => setFormData({ ...formData, aiSummary: e.target.value })}
                placeholder="Résumé de l'analyse IA..."
                rows={4}
                className="mt-2 border-blue-200 bg-blue-50"
              />
            </div>

            {/* Boutons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-bleu-principal">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

