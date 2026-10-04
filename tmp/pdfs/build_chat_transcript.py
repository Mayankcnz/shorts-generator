import json
import re
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    XPreformatted,
)


SOURCE = Path(
    "/Users/mayankchander/.codex/sessions/2026/07/31/"
    "rollout-2026-07-31T01-42-38-019fb3b1-2327-76e0-aba9-3057d750a790.jsonl"
)
OUTPUT = Path(
    "/Users/mayankchander/Documents/youtube-shortform/shorts-generator/"
    "output/pdf/shorts-generator-chat-transcript.pdf"
)


def register_fonts():
    candidates = [
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Italic.ttf",
        ),
        (
            "/System/Library/Fonts/Supplemental/Helvetica.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica Oblique.ttf",
        ),
    ]
    for regular, bold, italic in candidates:
        if all(Path(p).exists() for p in (regular, bold, italic)):
            pdfmetrics.registerFont(TTFont("TranscriptSans", regular))
            pdfmetrics.registerFont(TTFont("TranscriptSans-Bold", bold))
            pdfmetrics.registerFont(TTFont("TranscriptSans-Italic", italic))
            return "TranscriptSans", "TranscriptSans-Bold", "TranscriptSans-Italic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


def extract_messages():
    messages = []
    with SOURCE.open(encoding="utf-8") as stream:
        for line in stream:
            record = json.loads(line)
            if record.get("type") != "response_item":
                continue
            payload = record.get("payload", {})
            if payload.get("type") != "message":
                continue
            role = payload.get("role")
            if role not in {"user", "assistant"}:
                continue
            chunks = []
            for item in payload.get("content", []):
                if item.get("type") in {"input_text", "output_text"}:
                    text = item.get("text", "")
                    if text:
                        chunks.append(text)
            if not chunks:
                continue
            messages.append(
                {
                    "role": role,
                    "timestamp": record.get("timestamp", ""),
                    "text": "\n".join(chunks),
                }
            )
    return messages


def clean_text(text):
    # Preserve the transcript while removing control characters PDF fonts cannot render.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove app-injected runtime metadata that was serialized inside an early user item.
    # It is not part of the human conversation and may contain internal instructions.
    text = re.sub(
        r"<recommended_plugins>.*?</recommended_plugins>",
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"# AGENTS\.md instructions.*?</environment_context>",
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"<environment_context>.*?</environment_context>",
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    # Use ASCII punctuation where practical for reliable rendering.
    text = (
        text.replace("\u2011", "-")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u00a0", " ")
    )
    return text


def formatted_timestamp(value):
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime(
            "%Y-%m-%d %H:%M:%S UTC"
        )
    except ValueError:
        return value


def split_large_block(text, size=2600):
    if len(text) <= size:
        return [text]
    chunks = []
    remainder = text
    while len(remainder) > size:
        point = remainder.rfind("\n", 0, size)
        if point < size // 2:
            point = remainder.rfind(" ", 0, size)
        if point < size // 2:
            point = size
        chunks.append(remainder[:point])
        remainder = remainder[point:].lstrip("\n ")
    if remainder:
        chunks.append(remainder)
    return chunks


def body_flowables(text, body_style, code_style):
    output = []
    in_code = False
    buffer = []

    def flush():
        nonlocal buffer
        if not buffer:
            return
        block = "\n".join(buffer).strip("\n")
        if block:
            for chunk in split_large_block(block):
                if in_code:
                    output.append(XPreformatted(escape(chunk), code_style))
                else:
                    safe = escape(chunk).replace("\n", "<br/>")
                    output.append(Paragraph(safe, body_style))
                output.append(Spacer(1, 1.8 * mm))
        buffer = []

    for line in clean_text(text).split("\n"):
        if line.strip().startswith("```"):
            flush()
            in_code = not in_code
            continue
        if not in_code and not line.strip():
            flush()
            continue
        buffer.append(line)
    flush()
    return output


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    regular, bold, italic = register_fonts()
    messages = extract_messages()
    messages = [
        {**message, "text": clean_text(message["text"])}
        for message in messages
        if clean_text(message["text"]).strip()
    ]

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName=bold,
        fontSize=24,
        leading=29,
        textColor=colors.HexColor("#172033"),
        alignment=TA_CENTER,
        spaceAfter=8 * mm,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName=regular,
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#596579"),
        alignment=TA_CENTER,
        spaceAfter=6 * mm,
    )
    note = ParagraphStyle(
        "Note",
        parent=styles["Normal"],
        fontName=italic,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#6B7280"),
        alignment=TA_CENTER,
    )
    user_header = ParagraphStyle(
        "UserHeader",
        parent=styles["Heading3"],
        fontName=bold,
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1D4ED8"),
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
    )
    assistant_header = ParagraphStyle(
        "AssistantHeader",
        parent=user_header,
        textColor=colors.HexColor("#047857"),
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName=regular,
        fontSize=8.6,
        leading=12.2,
        textColor=colors.HexColor("#202938"),
        alignment=TA_LEFT,
        splitLongWords=True,
        allowWidows=1,
        allowOrphans=1,
    )
    code = ParagraphStyle(
        "Code",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=7.2,
        leading=9.2,
        leftIndent=4 * mm,
        rightIndent=2 * mm,
        borderColor=colors.HexColor("#D7DEE8"),
        borderWidth=0.5,
        borderPadding=3 * mm,
        backColor=colors.HexColor("#F5F7FA"),
        textColor=colors.HexColor("#253047"),
        splitLongWords=True,
    )

    story = [
        Spacer(1, 35 * mm),
        Paragraph("Complete Chat Transcript", title),
        Paragraph("Shorts Generator, interview preparation, and technical learning", subtitle),
        Paragraph(
            f"{len(messages):,} user-visible messages exported from the persisted thread history.",
            subtitle,
        ),
        Paragraph(
            "System instructions, hidden reasoning, tool calls, and tool outputs are intentionally excluded. "
            "Image attachments are represented only where their paths or descriptions appeared in message text.",
            note,
        ),
        PageBreak(),
    ]

    for index, message in enumerate(messages, start=1):
        role_label = "User" if message["role"] == "user" else "Assistant"
        timestamp = formatted_timestamp(message["timestamp"])
        heading = f"{index}. {role_label}"
        if timestamp:
            heading += f"  |  {timestamp}"
        header_style = user_header if message["role"] == "user" else assistant_header
        story.append(Paragraph(escape(heading), header_style))
        story.extend(body_flowables(message["text"], body, code))
        story.append(Spacer(1, 2 * mm))

    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Complete Chat Transcript",
        author="Mayank Chander and Codex",
        subject="Shorts Generator and interview preparation conversation",
    )

    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    def decorate(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#E5E9F0"))
        canvas.line(18 * mm, 13 * mm, A4[0] - 18 * mm, 13 * mm)
        canvas.setFont(regular, 7.5)
        canvas.setFillColor(colors.HexColor("#6B7280"))
        canvas.drawString(18 * mm, 8.5 * mm, "Complete Chat Transcript")
        canvas.drawRightString(A4[0] - 18 * mm, 8.5 * mm, f"Page {document.page}")
        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="Transcript", frames=[frame], onPage=decorate)])
    doc.build(story)
    print(f"Wrote {OUTPUT}")
    print(f"Messages: {len(messages)}")


if __name__ == "__main__":
    main()
