import sys
from faster_whisper import WhisperModel

audio_path = sys.argv[1]
output_path = sys.argv[2]

model = WhisperModel("base", device="cpu", compute_type="int8")

segments, info = model.transcribe(audio_path)

with open(output_path, "w", encoding="utf-8") as f:
    for segment in segments:
        f.write(f"[{segment.start:.2f} - {segment.end:.2f}] {segment.text}\n")