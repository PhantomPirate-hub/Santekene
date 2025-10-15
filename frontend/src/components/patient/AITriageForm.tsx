'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Send, StopCircle, Loader2 } from 'lucide-react';

interface AITriageFormProps {
  setTriageResults: (results: any) => void;
}

const AITriageForm = ({ setTriageResults }: AITriageFormProps) => {
  const [symptomsText, setSymptomsText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err);
      setError("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');

      const response = await fetch('http://localhost:8000/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de transcription audio.');
      }
      setSymptomsText(data.transcription);
      await sendSymptomsForTriage(data.transcription);
    } catch (err: any) {
      console.error("Erreur transcription:", err);
      setError(err.message || "Erreur lors de la transcription audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendSymptomsForTriage = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('symptoms', text);

      const response = await fetch('http://localhost:8000/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de triage IA.');
      }
      setTriageResults(data);
    } catch (err: any) {
      console.error("Erreur triage:", err);
      setError(err.message || "Erreur lors du triage IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitText = async () => {
    if (!symptomsText.trim()) {
      setError("Veuillez entrer des symptômes ou enregistrer votre voix.");
      return;
    }
    await sendSymptomsForTriage(symptomsText);
  };

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Décrivez vos symptômes</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Utilisez le texte ou votre voix pour expliquer ce que vous ressentez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Ex: J'ai de la fièvre, une toux sèche et je me sens fatigué depuis 3 jours."
          rows={6}
          value={symptomsText}
          onChange={(e) => setSymptomsText(e.target.value)}
          disabled={isLoading}
        />
        <div className="flex items-center space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`flex-1 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-aqua-moderne hover:bg-aqua-moderne/90'} text-blanc-pur rounded-full`}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <StopCircle className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {isRecording ? 'Arrêter l'enregistrement' : 'Enregistrer ma voix'}
          </Button>
          <Button
            onClick={handleSubmitText}
            disabled={isLoading || !symptomsText.trim()}
            className="flex-1 bg-vert-vitalite hover:bg-vert-vitalite/90 text-blanc-pur rounded-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer par texte
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default AITriageForm;
