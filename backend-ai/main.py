from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import json
import requests
from typing import Optional
from dotenv import load_dotenv

# Charger les variables d'environnement depuis .env
load_dotenv()

app = FastAPI(title="Santé Kènè AI - Groq")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Groq (ULTRA-RAPIDE)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("⚠️  GROQ_API_KEY manquante ! Ajoutez-la dans le fichier .env")
client = Groq(api_key=GROQ_API_KEY)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Santé Kènè AI",
        "provider": "Groq (Gratuit)",
        "model": "llama-3.3-70b-versatile"
    }

@app.get("/health")
async def health_check():
    try:
        # Test rapide de la clé API
        print(f"🔍 Test clé API Groq: {GROQ_API_KEY[:20]}...")
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=10
        )
        
        print(f"✅ Groq fonctionne ! Réponse test reçue.")
        return {
            "status": "ok", 
            "groq": "connected",
            "model": "llama-3.1-8b-instant",
            "api_key_preview": f"{GROQ_API_KEY[:10]}...{GROQ_API_KEY[-5:]}"
        }
    except Exception as e:
        print(f"❌ Erreur test Groq: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error", 
            "groq": "disconnected", 
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.post("/api/ai/triage")
async def triage_symptoms(
    symptoms: str = Form(...),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None)
):
    """Analyse des symptômes avec Groq (ultra-rapide)"""
    try:
        print(f"\n{'='*60}")
        print(f"🩺 NOUVELLE ANALYSE DE SYMPTÔMES")
        print(f"📝 Symptômes: {symptoms[:100]}...")
        print(f"🔑 Clé API: {GROQ_API_KEY[:15]}...{GROQ_API_KEY[-5:]}")
        print(f"{'='*60}\n")
        
        # Prompt médical simplifié et accessible
        prompt = f"""Tu es un assistant médical bienveillant qui aide les patients à comprendre leurs symptômes de façon SIMPLE et RASSURANTE.

Analyse ces symptômes : {symptoms}

IMPORTANT : Utilise un langage SIMPLE, ACCESSIBLE, sans termes techniques compliqués.

DOMAINES D'EXPERTISE :
- Urgences et traumatologie
- Cardiologie et maladies cardiovasculaires
- Pneumologie et troubles respiratoires
- Neurologie (maux de tête, vertiges, troubles neurologiques)
- Gastro-entérologie et troubles digestifs
- Dermatologie (problèmes de peau, allergies cutanées)
- ORL (gorge, oreilles, nez)
- Orthopédie et traumatologie
- Pédiatrie (si symptômes d'enfant)
- Gynécologie (si symptômes féminins)
- Ophtalmologie (troubles visuels)
- Psychiatrie et santé mentale
- Infectiologie et maladies infectieuses
- Endocrinologie (diabète, thyroïde)
- Rhumatologie (douleurs articulaires, arthrose)

STRUCTURES DE SANTÉ À RECOMMANDER :
- Urgences hospitalières : traumas graves, douleurs thoraciques, difficultés respiratoires sévères
- Hôpital/Clinique : chirurgie, hospitalisations, examens spécialisés
- Centre de santé : consultations générales, suivi médical
- Cabinet médical : consultations de spécialistes
- Pharmacie : conseils, médicaments sans ordonnance pour cas légers

RÈGLES D'ÉVALUATION (sois RAISONNABLE, pas alarmiste) :

1. URGENT (urgency_level: 4) : VRAIE urgence vitale → URGENCES
   - Douleur thoracique intense + essoufflement
   - Hémorragie grave qui ne s'arrête pas
   - Perte de conscience, convulsions
   - Fracture ouverte, brûlure grave (>10% du corps)
   
2. HIGH (urgency_level: 3) : Consulter sous 24h → HÔPITAL/CLINIQUE
   - Fièvre très élevée >39.5°C avec confusion
   - Douleur abdominale intense + vomissements
   - Plaie profonde nécessitant sutures
   
3. MODERATE (urgency_level: 2) : Consulter sous 3-7 jours → CENTRE DE SANTÉ
   - Fièvre modérée qui dure >3 jours
   - Migraine, mal de gorge, toux qui persiste
   - Douleurs supportables mais gênantes
   
4. LOW (urgency_level: 1) : Pas urgent, automédication possible → PHARMACIE
   - Petit rhume, légère fatigue
   - Migraine occasionnelle légère
   - Petite douleur musculaire

STRUCTURE À RECOMMANDER selon gravité :
{{
  "recommended_facility_type": "URGENCES|HOPITAL|CENTRE_SANTE|CABINET|PHARMACIE",
  "facility_reason": "Explication courte pourquoi cette structure"
}}

Réponds UNIQUEMENT avec ce JSON (LANGAGE SIMPLE ET RASSURANT) :
{{
  "severity": "low|moderate|high|urgent",
  "diagnosis": "Explication SIMPLE et CLAIRE en 1-2 phrases (SANS termes médicaux compliqués)",
  "recommendations": [
    "Conseil pratique 1 (simple et actionnable)",
    "Conseil pratique 2",
    "Conseil pratique 3"
  ],
  "specialties": ["Spécialité adaptée"],
  "urgency_level": 1-4,
  "recommended_facility_type": "URGENCES|HOPITAL|CENTRE_SANTE|CABINET|PHARMACIE",
  "facility_reason": "Raison simple pourquoi cette structure (max 10 mots)"
}}

EXEMPLES DE BON DIAGNOSTIC (simple) :
- "Probablement une migraine. Repos et hydratation recommandés."
- "Symptômes de grippe. Besoin de repos et surveillance de la fièvre."
- "Possible entorse. Repos, glace et consultation si douleur persiste."

EXEMPLES DE MAUVAIS DIAGNOSTIC (trop technique, À ÉVITER) :
- "Migraine caractérisée par des céphalées unilatérales avec photophobie et phonophobie"
- "Syndrome grippal avec hyperthermie et asthénie généralisée"

JSON uniquement, LANGAGE SIMPLE."""

        print(f"🔄 Analyse des symptômes avec Groq...")
        
        # Appel Groq (ULTRA-RAPIDE)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Nouveau modèle (l'ancien est décommissionné)
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un médecin urgentiste expert en triage médical. Tu analyses les symptômes avec précision et donnes des recommandations adaptées. IMPORTANT : Réponds UNIQUEMENT en JSON strict, sans texte avant ou après."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=600
        )
        
        ai_text = completion.choices[0].message.content.strip()
        print(f"✅ Réponse Groq reçue")
        
        # Nettoyer le JSON si besoin
        if "```json" in ai_text:
            ai_text = ai_text.split("```json")[1].split("```")[0]
        elif "```" in ai_text:
            ai_text = ai_text.split("```")[1].split("```")[0]
        
        # Nettoyer les espaces et lignes
        ai_text = ai_text.strip()
        
        # Parser le JSON
        try:
            result = json.loads(ai_text)
            
            # Validation et correction des champs
            if "severity" not in result:
                result["severity"] = "moderate"
            if "diagnosis" not in result or not result["diagnosis"]:
                result["diagnosis"] = "Évaluation médicale recommandée"
            if "recommendations" not in result or not isinstance(result["recommendations"], list):
                result["recommendations"] = ["Consulter un professionnel de santé"]
            if "specialties" not in result or not isinstance(result["specialties"], list):
                result["specialties"] = ["Médecine générale"]
            if "urgency_level" not in result:
                result["urgency_level"] = 2
            if "recommended_facility_type" not in result:
                result["recommended_facility_type"] = "CENTRE_SANTE"
            if "facility_reason" not in result:
                result["facility_reason"] = "Consultation médicale recommandée"
            
            # Ajouter les champs UI pour le frontend
            severity_map = {
                "urgent": {
                    "label": "🚨 URGENT",
                    "color": "red",
                    "consultation_type": "URGENCE",
                    "consultation_label": "Consulter les urgences immédiatement"
                },
                "high": {
                    "label": "⚠️  Élevé",
                    "color": "orange",
                    "consultation_type": "RAPIDE",
                    "consultation_label": "Consultation médicale dans les 24h"
                },
                "moderate": {
                    "label": "🟡 Modéré",
                    "color": "yellow",
                    "consultation_type": "STANDARD",
                    "consultation_label": "Consultation sous 2-3 jours"
                },
                "low": {
                    "label": "✅ Faible",
                    "color": "green",
                    "consultation_type": "SURVEILLANCE",
                    "consultation_label": "Surveillance et conseils"
                }
            }
            
            severity_info = severity_map.get(result["severity"], severity_map["moderate"])
            
            result["urgency_label"] = severity_info["label"]
            result["urgency_color"] = severity_info["color"]
            result["consultation_type"] = severity_info["consultation_type"]
            result["consultation_type_label"] = severity_info["consultation_label"]
            result["summary"] = result["diagnosis"]
            result["precautions"] = result["recommendations"][:2] if len(result["recommendations"]) > 2 else result["recommendations"]
            result["explanation"] = f"Niveau d'urgence : {severity_info['label']}. {result['facility_reason']}"
            
            # Mapper le type de structure en français
            facility_map = {
                "URGENCES": "🚨 Service d'Urgences",
                "HOPITAL": "🏥 Hôpital/Clinique",
                "CENTRE_SANTE": "🏥 Centre de Santé",
                "CABINET": "👨‍⚕️ Cabinet Médical",
                "PHARMACIE": "💊 Pharmacie"
            }
            result["recommended_facility_label"] = facility_map.get(
                result["recommended_facility_type"], 
                "🏥 Centre de Santé"
            )
                
        except Exception as parse_error:
            print(f"⚠️  Erreur parsing JSON: {parse_error}")
            print(f"Texte reçu: {ai_text[:200]}")
            # Fallback si parsing échoue
            result = {
                "severity": "moderate",
                "diagnosis": "L'IA n'a pas pu analyser complètement les symptômes. Consultation recommandée.",
                "recommendations": [
                    "Consulter un professionnel de santé pour une évaluation complète",
                    "Décrire vos symptômes en détail au médecin",
                    "Noter l'évolution de vos symptômes"
                ],
                "specialties": ["Médecine générale"],
                "urgency_level": 2,
                "recommended_facility_type": "CENTRE_SANTE",
                "facility_reason": "Consultation médicale recommandée pour évaluation",
                "urgency_label": "🟡 Modéré",
                "urgency_color": "yellow",
                "consultation_type": "STANDARD",
                "consultation_type_label": "Consultation sous 2-3 jours",
                "summary": "L'IA n'a pas pu analyser complètement les symptômes. Consultation recommandée.",
                "precautions": ["Consulter un professionnel de santé"],
                "explanation": "Niveau d'urgence : 🟡 Modéré. Consultation médicale recommandée pour évaluation",
                "recommended_facility_label": "🏥 Centre de Santé"
            }
        
        # Ajouter recommandations médecins/centres
        if latitude and longitude:
            try:
                backend_url = "http://localhost:3001"
                specialties = ",".join(result.get("specialties", ["Médecine générale"]))
                
                # Médecins
                doctors_response = requests.get(
                    f"{backend_url}/api/ai/doctors?specialties={specialties}",
                    timeout=5
                )
                
                # Centres de santé
                health_centers_response = requests.get(
                    f"{backend_url}/api/ai/health-centers?latitude={latitude}&longitude={longitude}",
                    timeout=5
                )
                
                if doctors_response.status_code == 200:
                    result["recommended_doctors"] = doctors_response.json().get("doctors", [])
                
                if health_centers_response.status_code == 200:
                    result["health_centers"] = health_centers_response.json().get("healthCenters", [])
            except:
                result["recommended_doctors"] = []
                result["health_centers"] = []
        else:
            result["recommended_doctors"] = []
            result["health_centers"] = []
        
        return result
        
    except Exception as e:
        import traceback
        print(f"❌ ERREUR COMPLÈTE: {e}")
        print(f"❌ Type d'erreur: {type(e).__name__}")
        print(f"❌ Traceback complet:")
        traceback.print_exc()
        return {
            "severity": "moderate",
            "diagnosis": "Service IA temporairement indisponible",
            "recommendations": [
                "Consulter un médecin généraliste",
                "Décrire vos symptômes en détail",
                "Surveiller votre état"
            ],
            "specialties": ["Médecine générale"],
            "urgency_level": 2,
            "recommended_facility_type": "CENTRE_SANTE",
            "facility_reason": "Le service IA est temporairement indisponible",
            "urgency_label": "🟡 Modéré",
            "urgency_color": "yellow",
            "consultation_type": "STANDARD",
            "consultation_type_label": "Consultation médicale recommandée",
            "summary": "Service IA temporairement indisponible",
            "precautions": ["Consulter un professionnel de santé"],
            "explanation": "Le service IA est temporairement indisponible. Veuillez consulter un professionnel de santé.",
            "recommended_facility_label": "🏥 Centre de Santé",
            "recommended_doctors": [],
            "health_centers": [],
            "error": str(e)
        }

@app.post("/api/ai/transcribe")
async def transcribe_audio():
    """Transcription audio - disponible avec Groq"""
    return {
        "error": "Transcription non implémentée dans cette version rapide",
        "detail": "Pour la transcription, installer Whisper ou utiliser Groq Whisper API"
    }

@app.post("/api/ai/medical-assistant")
async def medical_assistant(
    symptoms: str = Form(...),
    patient_info: str = Form(None),
    medical_history: str = Form(None),
    current_findings: str = Form(None)
):
    """Assistant médical IA pour les médecins - Aide au diagnostic"""
    try:
        print(f"\n{'='*60}")
        print(f"🩺 ASSISTANT MÉDICAL IA")
        print(f"📝 Symptômes: {symptoms[:100]}...")
        print(f"👤 Patient: {patient_info}")
        print(f"{'='*60}\n")
        
        # Prompt médical pour diagnostic différentiel
        prompt = f"""Tu es un médecin expert expérimenté qui assiste un confrère dans son diagnostic.

INFORMATIONS DU PATIENT :
{patient_info}

ANTÉCÉDENTS MÉDICAUX :
{medical_history}

SYMPTÔMES ACTUELS :
{symptoms}

OBSERVATIONS CLINIQUES :
{current_findings}

RÈGLES IMPORTANTES :
- Sois PRAGMATIQUE et ÉQUILIBRÉ (pas alarmiste)
- Base-toi sur les PROBABILITÉS CLINIQUES (diagnostic le plus probable en premier)
- Les "red_flags" doivent être RÉELLEMENT GRAVES (pas de sur-diagnostic)
- Propose des examens PERTINENTS (pas tout le catalogue)
- Les traitements doivent être ADAPTÉS et RÉALISTES
- Niveau de confiance basé sur les éléments fournis

EXEMPLES DE BON RAISONNEMENT :
- Si "mal de tête" → penser migraine/céphalée de tension AVANT tumeur cérébrale
- Si "toux + fièvre" → infection respiratoire haute AVANT pneumonie
- Ne mettre en "red_flags" QUE les signes vraiment inquiétants

Réponds UNIQUEMENT avec ce JSON :
{{
  "differential_diagnosis": [
    "Diagnostic le plus probable (60-70%)",
    "Diagnostic alternatif plausible (20-30%)",
    "Diagnostic rare à écarter (5-10%)"
  ],
  "recommended_tests": [
    "Examen de première intention pertinent",
    "Examen de confirmation si nécessaire",
    "Examen complémentaire si doute"
  ],
  "treatment_suggestions": [
    "Traitement de première ligne adapté",
    "Alternative thérapeutique si contre-indication",
    "Mesures symptomatiques"
  ],
  "red_flags": [
    "Signe d'alerte VRAIMENT inquiétant UNIQUEMENT si présent dans les symptômes"
  ],
  "precautions": [
    "Précaution pratique 1",
    "Précaution pratique 2"
  ],
  "follow_up": "Suivi adapté à la gravité (ne pas systématiquement dramatiser)",
  "confidence_level": "élevé|moyen|faible",
  "confidence_label": "Confiance élevée|moyenne|faible (selon les éléments fournis)",
  "explanation": "Raisonnement médical CONCIS et CLAIR (3-4 phrases max)",
  "disclaimer": "Aide à la décision médicale. Le diagnostic final relève du médecin."
}}

IMPORTANT : Si les symptômes sont BÉNINS, ne pas dramatiser. Si GRAVES, être clair.

JSON uniquement."""

        print(f"🔄 Analyse médicale avec Groq...")
        
        # Appel Groq
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un médecin expérimenté et PRAGMATIQUE qui aide un confrère. Tu analyses les symptômes de façon ÉQUILIBRÉE, en te basant sur les PROBABILITÉS CLINIQUES réelles. Tu n'es NI alarmiste, NI négligent. Tu proposes des diagnostics différentiels RÉALISTES, des examens PERTINENTS et des traitements ADAPTÉS. Tu ne dramatises pas les cas bénins, mais tu identifies clairement les situations graves."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1200
        )
        
        ai_text = completion.choices[0].message.content.strip()
        print(f"✅ Réponse Groq reçue")
        
        # Nettoyer le JSON
        if "```json" in ai_text:
            ai_text = ai_text.split("```json")[1].split("```")[0]
        elif "```" in ai_text:
            ai_text = ai_text.split("```")[1].split("```")[0]
        
        ai_text = ai_text.strip()
        
        # Parser le JSON
        try:
            result = json.loads(ai_text)
            
            # Validation des champs
            if "differential_diagnosis" not in result:
                result["differential_diagnosis"] = ["Analyse insuffisante - Veuillez fournir plus de détails"]
            if "recommended_tests" not in result:
                result["recommended_tests"] = ["Examens cliniques standards"]
            if "treatment_suggestions" not in result:
                result["treatment_suggestions"] = ["Consultation recommandée"]
            if "red_flags" not in result:
                result["red_flags"] = []
            if "precautions" not in result:
                result["precautions"] = ["Surveillance clinique"]
            if "follow_up" not in result:
                result["follow_up"] = "Suivi à déterminer selon évolution"
            if "confidence_level" not in result:
                result["confidence_level"] = "moyen"
            if "confidence_label" not in result:
                result["confidence_label"] = "Confiance moyenne"
            if "explanation" not in result:
                result["explanation"] = "Analyse basée sur les symptômes fournis"
            if "disclaimer" not in result:
                result["disclaimer"] = "Cette analyse est une aide à la décision. Le diagnostic final reste de la responsabilité du médecin."
            
            print(f"✅ Assistant médical IA - Analyse terminée")
            return result
            
        except Exception as parse_error:
            print(f"⚠️  Erreur parsing JSON: {parse_error}")
            return {
                "differential_diagnosis": ["Erreur d'analyse - Veuillez réessayer"],
                "recommended_tests": ["Examens cliniques de routine"],
                "treatment_suggestions": ["Consultation médicale recommandée"],
                "red_flags": [],
                "precautions": ["Surveillance du patient"],
                "follow_up": "Réévaluation nécessaire",
                "confidence_level": "faible",
                "confidence_label": "Confiance faible",
                "explanation": "Erreur lors de l'analyse IA",
                "disclaimer": "Cette analyse est une aide à la décision. Le diagnostic final reste de la responsabilité du médecin."
            }
        
    except Exception as e:
        import traceback
        print(f"❌ Erreur assistant médical: {e}")
        traceback.print_exc()
        return {
            "differential_diagnosis": ["Service IA temporairement indisponible"],
            "recommended_tests": ["Évaluation clinique standard"],
            "treatment_suggestions": ["Consultation en personne recommandée"],
            "red_flags": [],
            "precautions": ["Surveillance du patient"],
            "follow_up": "Suivi régulier",
            "confidence_level": "faible",
            "confidence_label": "Service indisponible",
            "explanation": f"Erreur technique: {str(e)}",
            "disclaimer": "Service IA temporairement indisponible. Veuillez vous baser sur votre jugement clinique."
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage Backend IA (Groq - Ultra-rapide)")
    print("🔗 API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
