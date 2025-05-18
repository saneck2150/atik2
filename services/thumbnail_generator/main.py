from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

app = FastAPI()

# Разрешаем CORS для фронта
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Можно заменить на ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/thumbnail")
async def generate_thumbnail(file: UploadFile = File(...), size: int = Query(256)):
    try:
        image = Image.open(io.BytesIO(await file.read()))
        image.thumbnail((size, size))
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return Response(buffer.getvalue(), media_type="image/png")
    except Exception as e:
        return {"error": str(e)}
