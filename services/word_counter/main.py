from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # <- добавить

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # или ["http://localhost:3000"] для безопасности
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/count-words/")
async def count_words(file: UploadFile = File(...)):
    content = await file.read()
    size_bytes = len(content)
    return JSONResponse(content={
        "filename": file.filename,
        "size_bytes": size_bytes,
        "size_kb": round(size_bytes / 1024, 2)
    })