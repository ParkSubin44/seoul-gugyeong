from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from dotenv import load_dotenv

# 백엔드 전용 환경파일(.env.backend)을 로드하도록 지정
load_dotenv('.env.backend')
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in .env.backend")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    text = (req.message or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="message is required")

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant about Seoul travel."},
            {"role": "user", "content": text}
        ],
        "max_tokens": 500
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {resp.text}")

    data = resp.json()
    reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return {"reply": reply}
