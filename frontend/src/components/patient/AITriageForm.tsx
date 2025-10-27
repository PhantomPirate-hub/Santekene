'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Brain, AlertCircle, Mic, StopCircle } from 'lucide-react';

interface AITriageFormProps {
  setTriageResults: (results: any) => void;
}

const AITriageForm = ({ setTriageResults }: AITriageFormProps) => {
  const [symptomsText, setSymptomsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForTranscription(audioBlob);
        // Arrêter tous les tracks pour libérer le micro
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('🎤 Enregistrement démarré');
    } catch (err) {
      console.error("Erreur microphone:", err);
      setError("Impossible d'accéder au microphone. Veuillez autoriser l'accès dans votre navigateur.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🎤 Enregistrement arrêté');
    }
  };

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🎙️ Envoi audio pour transcription...');
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');

      const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';
      const response = await fetch(`${aiApiUrl}/api/ai/transcribe`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de transcription audio.');
      }
      
      console.log('✅ Transcription reçue:', data.transcription);
      setSymptomsText(data.transcription);
      
      // Envoyer directement pour analyse
      await sendSymptomsForTriage(data.transcription);
    } catch (err: any) {
      console.error("❌ Erreur transcription:", err);
      setError(err.message || "Erreur lors de la transcription audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendSymptomsForTriage = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Envoi des symptômes:', text);
      
      const formData = new URLSearchParams();
      formData.append('symptoms', text);

      // Ajouter la géolocalisation si disponible
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          formData.append('latitude', position.coords.latitude.toString());
          formData.append('longitude', position.coords.longitude.toString());
          console.log('📍 Géolocalisation ajoutée');
        } catch (geoError) {
          console.log('📍 Géolocalisation non disponible:', geoError);
        }
      }

      const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';
      console.log('🌐 Appel API:', `${aiApiUrl}/api/ai/triage`);
      
      const response = await fetch(`${aiApiUrl}/api/ai/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log('✅ Réponse reçue:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de triage IA.');
      }
      
      setTriageResults(data);
      
    } catch (err: any) {
      console.error("❌ Erreur triage:", err);
      setError(err.message || "Erreur lors du triage IA. Vérifiez que le backend IA est démarré (port 8000)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symptomsText.trim()) {
      setError("Veuillez décrire vos symptômes.");
      return;
    }
    
    await sendSymptomsForTriage(symptomsText);
  };

  return (
    <Card className="bg-white shadow-lg rounded-2xl border-2 border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-900">Analyse IA de vos symptômes</CardTitle>
            <CardDescription className="text-gray-600">
              Décrivez ce que vous ressentez et l'IA vous guidera
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        <form onSubmit={handleSubmitText} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quels sont vos symptômes ? <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Exemple : J'ai de la fièvre depuis 2 jours, des maux de tête et je me sens très fatigué. J'ai aussi des courbatures..."
              rows={8}
              value={symptomsText}
              onChange={(e) => {
                setSymptomsText(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Plus vous êtes précis, meilleure sera l'analyse
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            {/* Bouton enregistrement vocal */}
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`flex-1 text-white text-lg py-6 rounded-xl ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              size="lg"
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Arrêter l'enregistrement
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Enregistrer ma voix
                </>
              )}
            </Button>

            {/* Bouton analyse texte */}
            <Button
              type="submit"
              disabled={isLoading || !symptomsText.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg py-6 rounded-xl"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Analyser par texte
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">ℹ️ Comment ça marche ?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Écrivez</strong> vos symptômes ou <strong>enregistrez votre voix</strong> 🎤</li>
            <li>• L'IA analyse et évalue le niveau d'urgence</li>
            <li>• Vous recevez des recommandations personnalisées</li>
            <li>• Des médecins disponibles vous sont suggérés</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            💡 L'enregistrement vocal est idéal pour les personnes qui ont du mal à écrire
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITriageForm;
