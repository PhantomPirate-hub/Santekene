from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import json

# LangChain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# OpenAI pour Whisper
import openai

load_dotenv()

app = FastAPI(
    title="Santé Kènè - AI Service",
    description="API pour les services d'IA (Whisper, LLaMA3, LangChain) de Santé Kènè.",
    version="0.1.0",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY n'est pas définie dans les variables d'environnement.")

openai_client = openai.OpenAI(api_key=openai_api_key)

# Modèle de langage pour le triage (simulé avec OpenAI GPT-4)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=openai_api_key)

# Prompt amélioré pour le triage intelligent et complet
triage_prompt = ChatPromptTemplate.from_messages([
    ("system", """Vous êtes un assistant médical IA expert pour le système de santé Santé Kènè. 
Votre rôle est d'analyser les symptômes d'un patient et de fournir des recommandations médicales précises.

Vous devez TOUJOURS répondre au format JSON suivant (sans markdown, juste le JSON brut):
{{
  "summary": "Résumé concis des symptômes en 1-2 phrases",
  "urgency": "faible|modéré|urgent",
  "specialties": ["Spécialité1", "Spécialité2"],
  "precautions": ["Précaution 1", "Précaution 2", "Précaution 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "consultation_type": "presentiel|en_ligne|urgence",
  "explanation": "Explication détaillée de l'analyse"
}}

Critères d'urgence:
- "urgent": Symptômes graves nécessitant une attention immédiate (douleur thoracique, difficulté respiratoire sévère, saignement important, perte de conscience)
- "modéré": Symptômes significatifs nécessitant une consultation rapide (fièvre élevée persistante, douleur intense, symptômes durant plusieurs jours)
- "faible": Symptômes légers ou courants (rhume, légère fièvre, fatigue)

Spécialités disponibles: Médecine Générale, Cardiologie, Dermatologie, Pédiatrie, Gynécologie, Neurologie, Orthopédie, ORL, Pneumologie, Gastro-entérologie

Type de consultation:
- "urgence": Pour les cas urgents nécessitant une intervention immédiate
- "presentiel": Pour les cas nécessitant un examen physique
- "en_ligne": Pour les cas pouvant être gérés en téléconsultation

Répondez UNIQUEMENT en français et UNIQUEMENT au format JSON."""),
    ("user", "Symptômes du patient: {symptoms}"),
])

triage_chain = triage_prompt | llm | StrOutputParser()

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Santé Kènè AI Service is running."}

@app.post("/api/ai/transcribe", tags=["AI - Whisper"])
async def transcribe_audio(audio_file: UploadFile = File(...)):
    if not audio_file.content_type or not audio_file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être un fichier audio.")

    try:
        # L'API Whisper d'OpenAI supporte directement les fichiers audio
        response = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file.file,
            response_format="text"
        )
        return {"transcription": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la transcription audio: {e}")

@app.post("/api/ai/triage", tags=["AI - LangChain/LLaMA3"])
async def ai_triage(symptoms: str = Form(...), latitude: float = Form(None), longitude: float = Form(None)):
    if not symptoms:
        raise HTTPException(status_code=400, detail="Les symptômes sont requis pour le triage.")
    
    try:
        # Analyse IA des symptômes
        result = await triage_chain.invoke({"symptoms": symptoms})
        
        # Nettoyer le résultat (enlever les balises markdown si présentes)
        cleaned_result = result.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        cleaned_result = cleaned_result.strip()
        
        # Parser le JSON
        try:
            triage_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            print(f"Erreur de parsing JSON: {e}")
            print(f"Résultat brut: {result}")
            # Fallback: créer une structure de base
            triage_data = {
                "summary": "Analyse en cours...",
                "urgency": "modéré",
                "specialties": ["Médecine Générale"],
                "precautions": ["Consultez un médecin"],
                "recommendations": ["Prenez rendez-vous dès que possible"],
                "consultation_type": "presentiel",
                "explanation": result
            }
        
        # Valider et normaliser les données
        urgency = triage_data.get("urgency", "modéré").lower()
        if urgency not in ["faible", "modéré", "urgent"]:
            urgency = "modéré"
        
        consultation_type = triage_data.get("consultation_type", "presentiel").lower()
        if consultation_type not in ["presentiel", "en_ligne", "urgence"]:
            consultation_type = "presentiel"
        
        # Préparer la réponse finale
        response_data = {
            "summary": triage_data.get("summary", "Analyse des symptômes terminée"),
            "urgency": urgency,
            "urgency_label": {
                "faible": "Urgence Faible",
                "modéré": "Urgence Modérée",
                "urgent": "Urgence Élevée"
            }.get(urgency, "Urgence Modérée"),
            "urgency_color": {
                "faible": "green",
                "modéré": "orange",
                "urgent": "red"
            }.get(urgency, "orange"),
            "specialties": triage_data.get("specialties", ["Médecine Générale"]),
            "precautions": triage_data.get("precautions", []),
            "recommendations": triage_data.get("recommendations", []),
            "consultation_type": consultation_type,
            "consultation_type_label": {
                "presentiel": "Consultation en présentiel recommandée",
                "en_ligne": "Téléconsultation possible",
                "urgence": "Consultation d'urgence nécessaire"
            }.get(consultation_type, "Consultation recommandée"),
            "explanation": triage_data.get("explanation", ""),
            "raw_response": result  # Pour debug
        }
        
        return JSONResponse(response_data)
        
    except Exception as e:
        print(f"Erreur complète: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du triage IA: {str(e)}")


@app.post("/api/ai/medical-assistant")
async def medical_assistant(
    symptoms: str = Form(...),
    patient_info: str = Form(None),
    medical_history: str = Form(None),
    current_findings: str = Form(None)
):
    """
    Assistant IA pour aider le médecin pendant une consultation
    Analyse les symptômes, l'historique et les observations pour suggérer:
    - Diagnostics possibles
    - Examens complémentaires recommandés
    - Traitements potentiels
    - Précautions importantes
    """
    try:
        print(f"📋 Assistant médical - Analyse en cours...")
        print(f"📝 Symptômes reçus: {symptoms[:100]}...")
        print(f"👤 Patient info: {patient_info}")
        print(f"📚 Historique médical: {medical_history[:200] if medical_history else 'Aucun'}...")
        print(f"🔍 Observations: {current_findings[:100] if current_findings else 'Aucune'}...")
        
        # Créer le prompt pour l'assistant médecin
        medical_assistant_prompt = ChatPromptTemplate.from_messages([
            ("system", """Vous êtes un assistant médical IA expert qui aide les médecins pendant leurs consultations.
Votre rôle est d'analyser les informations du patient et de fournir des suggestions de diagnostic et de traitement.

⚠️ IMPORTANT: 
- Vos suggestions sont des AIDES À LA DÉCISION pour le médecin, pas des diagnostics définitifs.
- Utilisez SYSTÉMATIQUEMENT l'historique médical fourni pour affiner votre diagnostic.
- Si l'historique médical contient des informations pertinentes, mentionnez-les dans votre raisonnement.

Vous devez TOUJOURS répondre au format JSON suivant (sans markdown, juste le JSON brut):
{{
  "differential_diagnosis": ["Liste de 3-5 diagnostics possibles par ordre de probabilité décroissante"],
  "recommended_tests": ["Liste de 3-5 examens complémentaires recommandés avec justification"],
  "treatment_suggestions": ["Liste de 3-5 suggestions de traitements potentiels avec posologie si approprié"],
  "red_flags": ["Liste de 2-4 signes d'alerte importants à surveiller"],
  "precautions": ["Liste de 2-3 précautions à prendre"],
  "follow_up": "Recommandations détaillées pour le suivi (quand revoir le patient, quoi surveiller)",
  "confidence_level": "faible|moyen|élevé",
  "explanation": "Explication détaillée du raisonnement médical en 3-5 phrases, en citant l'historique médical si pertinent"
}}

Basez votre analyse sur:
1. Les symptômes actuels présentés
2. L'HISTORIQUE MÉDICAL du patient (TRÈS IMPORTANT - à utiliser systématiquement)
3. Les observations cliniques du médecin
4. Les informations démographiques du patient
5. Les meilleures pratiques médicales actuelles"""),
            ("user", """🏥 ANALYSE MÉDICALE COMPLÈTE

👤 PATIENT:
{patient_info}

📚 HISTORIQUE MÉDICAL (consultations antérieures):
{medical_history}

🤒 SYMPTÔMES ACTUELS:
{symptoms}

🔍 OBSERVATIONS CLINIQUES DU MÉDECIN:
{current_findings}

⚕️ Fournis une analyse médicale complète en tenant compte de TOUS ces éléments, notamment l'historique médical.""")
        ])
        
        # Créer la chaîne de traitement
        chain = medical_assistant_prompt | llm | StrOutputParser()
        
        # Exécuter l'analyse
        result = chain.invoke({
            "symptoms": symptoms,
            "patient_info": patient_info or "Non renseigné",
            "medical_history": medical_history or "Non renseigné",
            "current_findings": current_findings or "Évaluation en cours"
        })
        
        print(f"✅ Résultat reçu de OpenAI")
        print(f"📄 Longueur réponse: {len(result)} caractères")
        print(f"📄 Début: {result[:300]}...")
        
        # Parser le résultat JSON
        try:
            # Nettoyer la réponse (supprimer les markdown code blocks si présents)
            clean_result = result.strip()
            if clean_result.startswith("```json"):
                clean_result = clean_result[7:]
            if clean_result.startswith("```"):
                clean_result = clean_result[3:]
            if clean_result.endswith("```"):
                clean_result = clean_result[:-3]
            clean_result = clean_result.strip()
            
            print(f"🧹 JSON nettoyé, tentative de parsing...")
            analysis_data = json.loads(clean_result)
            print(f"✅ JSON parsé avec succès !")
            
        except json.JSONDecodeError as json_err:
            print(f"❌ Erreur JSON parsing: {json_err}")
            print(f"📄 Réponse brute complète: {result}")
            # Fallback avec données par défaut
            analysis_data = {
                "differential_diagnosis": ["⚠️ Erreur de parsing - Veuillez vérifier le backend IA"],
                "recommended_tests": ["Vérifier les logs du serveur backend-ai"],
                "treatment_suggestions": ["Relancer le serveur backend-ai"],
                "red_flags": ["Erreur de communication avec l'IA"],
                "precautions": ["Vérifier la clé OpenAI et le quota"],
                "follow_up": "Contacter l'administrateur système",
                "confidence_level": "faible",
                "explanation": f"Erreur technique: {str(json_err)}\n\nRéponse brute: {result[:500]}"
            }
        
        # Préparer la réponse
        response_data = {
            "success": True,
            "differential_diagnosis": analysis_data.get("differential_diagnosis", []),
            "recommended_tests": analysis_data.get("recommended_tests", []),
            "treatment_suggestions": analysis_data.get("treatment_suggestions", []),
            "red_flags": analysis_data.get("red_flags", []),
            "precautions": analysis_data.get("precautions", []),
            "follow_up": analysis_data.get("follow_up", ""),
            "confidence_level": analysis_data.get("confidence_level", "moyen"),
            "confidence_label": {
                "faible": "Confidence Faible",
                "moyen": "Confidence Moyenne",
                "élevé": "Confidence Élevée"
            }.get(analysis_data.get("confidence_level", "moyen"), "Confidence Moyenne"),
            "explanation": analysis_data.get("explanation", ""),
            "disclaimer": "⚠️ Ces suggestions sont des aides à la décision. Le médecin reste responsable du diagnostic et du traitement final."
        }
        
        print(f"✅ Réponse préparée et envoyée au frontend")
        return JSONResponse(response_data)
        
    except Exception as e:
        print(f"❌ ERREUR COMPLÈTE: {e}")
        print(f"❌ Type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erreur de l'assistant médical: {str(e)}")


# ============================================
# LANCEMENT DU SERVEUR
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Démarrage du serveur Santé Kènè AI...")
    print("=" * 60)
    print("📡 URL: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
