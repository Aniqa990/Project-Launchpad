# utils/formatter.py

from datetime import datetime

def format_transcript_to_txt(transcription_json):
    """
    Format AssemblyAI JSON to .txt with timestamps and speaker labels.
    Adds meeting date at the top.
    Assumes speaker diarization is enabled.

    Example Output:
    # Meeting - 2025-07-25 22:14

    [3.76 - 11.12] Speaker B: Hello, welcome to our standup.
    [12.01 - 14.55] Speaker A: Good morning!
    """
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    formatted = f"# Meeting - {date_str}\n\n"

    utterances = transcription_json.get("utterances")

    if utterances and isinstance(utterances, list):
        for utt in utterances:
            start = utt.get("start", 0) / 1000
            end = utt.get("end", 0) / 1000
            speaker = utt.get("speaker", "Unknown")
            text = utt.get("text", "")
            formatted += f"[{start:.2f} - {end:.2f}] Speaker {speaker}: {text}\n"
    else:
        formatted += transcription_json.get("text", "⚠️ No transcript or utterances available.")

    return formatted
