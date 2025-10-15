from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

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

# Configuration OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY n'est pas définie dans les variables d'environnement.")

openai_client = openai.OpenAI(api_key=openai_api_key)

# Modèle de langage pour le triage (simulé avec OpenAI GPT-4)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=openai_api_key)

# Prompt pour le triage intelligent
triage_prompt = ChatPromptTemplate.from_messages([
    ("system", "Vous êtes un assistant médical IA. Votre tâche est de résumer les symptômes d'un patient et de suggérer une spécialité médicale appropriée. Répondez uniquement en français."),
    ("user", "Symptômes du patient: {symptoms}"),
    ("user", "Veuillez fournir un résumé concis des symptômes et suggérer une ou plusieurs spécialités médicales (ex: Cardiologie, Dermatologie, Médecine générale) qui pourraient être consultées. Format: Résumé: [votre résumé]. Spécialité(s): [spécialité1, spécialité2]."),
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
async def ai_triage(symptoms: str = Form(...)):
    if not symptoms:
        raise HTTPException(status_code=400, detail="Les symptômes sont requis pour le triage.")
    
    try:
        result = await triage_chain.invoke({"symptoms": symptoms})
        # Parser le résultat pour extraire le résumé et la spécialité
        summary_start = result.find("Résumé:")
        specialty_start = result.find("Spécialité(s):")

        summary = result[summary_start + len("Résumé:"):specialty_start].strip() if summary_start != -1 and specialty_start != -1 else ""
        specialties_str = result[specialty_start + len("Spécialité(s):"):].strip() if specialty_start != -1 else ""
        specialties = [s.strip() for s in specialties_str.split(',')] if specialties_str else []

        return JSONResponse({
            "summary": summary,
            "specialties": specialties,
            "full_response": result
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du triage IA: {e}")
