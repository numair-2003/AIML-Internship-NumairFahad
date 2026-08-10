"""
LearnTube Project Report — PDF generator
Run: python scripts/generate_report.py
Requires: reportlab (pip install reportlab)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image, KeepTogether,
)
from reportlab.platypus.flowables import CondPageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

# ── Colours ────────────────────────────────────────────────────────────────────
NAVY      = colors.HexColor("#0a1628")
INDIGO    = colors.HexColor("#4f46e5")
VIOLET    = colors.HexColor("#7c3aed")
CYAN      = colors.HexColor("#0891b2")
SLATE     = colors.HexColor("#64748b")
LIGHT_BG  = colors.HexColor("#f1f5f9")
WHITE     = colors.white
GREEN     = colors.HexColor("#16a34a")
DARK_TEXT = colors.HexColor("#1e293b")

W, H = A4  # 595 × 842 pt

# ── Styles ─────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def s(name, **kw):
    """Return a ParagraphStyle derived from 'Normal'."""
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

COVER_TITLE  = s("CoverTitle",  fontName="Helvetica-Bold",   fontSize=42,
                 textColor=WHITE,  alignment=TA_CENTER, spaceAfter=6)
COVER_SUB    = s("CoverSub",    fontName="Helvetica",        fontSize=16,
                 textColor=colors.HexColor("#a5b4fc"), alignment=TA_CENTER, spaceAfter=4)
COVER_BADGE  = s("CoverBadge",  fontName="Helvetica",        fontSize=12,
                 textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)

H1           = s("H1",          fontName="Helvetica-Bold",   fontSize=16,
                 textColor=NAVY, spaceBefore=14, spaceAfter=6,
                 borderPad=0)
H2           = s("H2",          fontName="Helvetica-Bold",   fontSize=12,
                 textColor=INDIGO, spaceBefore=10, spaceAfter=4)
BODY         = s("Body",        fontName="Helvetica",        fontSize=10,
                 textColor=DARK_TEXT, leading=15, spaceAfter=4,
                 alignment=TA_JUSTIFY)
BULLET       = s("Bullet",      fontName="Helvetica",        fontSize=10,
                 textColor=DARK_TEXT, leading=15, leftIndent=16,
                 bulletIndent=6, spaceAfter=3)
CAPTION      = s("Caption",     fontName="Helvetica-Oblique",fontSize=9,
                 textColor=SLATE, alignment=TA_CENTER, spaceBefore=4, spaceAfter=8)
FOOTER_STYLE = s("Footer",      fontName="Helvetica",        fontSize=8,
                 textColor=SLATE, alignment=TA_CENTER)
SMALL        = s("Small",       fontName="Helvetica",        fontSize=9,
                 textColor=SLATE)
BACK_LABEL   = s("BackLabel",   fontName="Helvetica-Bold",   fontSize=10,
                 textColor=SLATE)
BACK_VALUE   = s("BackValue",   fontName="Helvetica",        fontSize=10,
                 textColor=DARK_TEXT)

# ── Helpers ────────────────────────────────────────────────────────────────────
def hr(color=INDIGO, thickness=1):
    return HRFlowable(width="100%", thickness=thickness,
                      color=color, spaceAfter=6, spaceBefore=6)

def section_header(number, title):
    return [
        Spacer(1, 6),
        Paragraph(f"{number}. {title}", H1),
        hr(INDIGO, 0.5),
    ]

def two_col_table(rows, col_widths=None):
    """Dark-header two-column table."""
    if col_widths is None:
        col_widths = [5*cm, 11.5*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("BACKGROUND",    (0, 1), (-1, -1), LIGHT_BG),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("FONTNAME",      (0, 1), (0, -1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 1), (0, -1),  NAVY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
        ("ROWSPAN",       (0, 0), (0, 0),   1),
    ]))
    return t

def four_col_table(rows, col_widths=None):
    """Four-column tech-stack table."""
    if col_widths is None:
        col_widths = [3*cm, 4*cm, 2*cm, 7.5*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("BACKGROUND",    (0, 1), (-1, -1), LIGHT_BG),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("FONTNAME",      (0, 1), (0, -1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 1), (0, -1),  INDIGO),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
    ]))
    return t

def achievement_table(rows):
    col_widths = [4.5*cm, 12*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("FONTNAME",      (0, 1), (0, -1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 1), (0, -1),  GREEN),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
    ]))
    return t

def perf_table(rows):
    col_widths = [5.5*cm, 4*cm, 7*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
    ]))
    return t

def add_image(path, max_width=14*cm, max_height=10*cm, caption=None):
    """Scale image to fit within max_width x max_height, preserving aspect ratio."""
    elems = []
    try:
        from PIL import Image as PILImage
        with PILImage.open(path) as pil:
            px_w, px_h = pil.size
        ratio = px_h / px_w if px_w else 1
        # Fit by width first
        w = max_width
        h = w * ratio
        # If too tall, fit by height instead
        if h > max_height:
            h = max_height
            w = h / ratio
        img = Image(path, width=w, height=h)
        img.hAlign = "CENTER"
        elems.append(img)
        if caption:
            elems.append(Paragraph(caption, CAPTION))
    except Exception as e:
        elems.append(Paragraph(f"[Image unavailable: {os.path.basename(path)}]", CAPTION))
    return elems

# ── Page template with header/footer ──────────────────────────────────────────
def make_doc(out_path):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title="LearnTube Project Report",
        author="Numair Fahad",
    )

    page_nums = {}

    def _header_footer(canvas, doc):
        canvas.saveState()
        pn = doc.page
        if pn == 1:  # cover — no header/footer
            canvas.restoreState()
            return

        # Header bar
        canvas.setFillColor(NAVY)
        canvas.rect(1.5*cm, H - 1.6*cm, W - 3*cm, 0.55*cm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(WHITE)
        canvas.drawString(1.7*cm, H - 1.35*cm, "LearnTube | AI YouTube Learning Assistant")
        canvas.drawRightString(W - 1.7*cm, H - 1.35*cm, "Numair Fahad | AIML Internship 2026")

        # Footer
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(SLATE)
        footer = (
            f"LearnTube Project Report | Internship ID: ZYNVEX-CERT-0487 | Page {pn}"
        )
        canvas.drawCentredString(W / 2, 1.2*cm, footer)
        canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
        canvas.line(1.5*cm, 1.45*cm, W - 1.5*cm, 1.45*cm)
        canvas.restoreState()

    # ── Story ─────────────────────────────────────────────────────────────────
    story = []

    # ── 1. COVER PAGE ─────────────────────────────────────────────────────────
    # Full-page background drawn via a Frame or a canvas callback; we simulate
    # with a large coloured table that fills the page margins.
    cover_bg = Table(
        [[""]],
        colWidths=[W - 4*cm],
        rowHeights=[H - 4*cm],
    )
    cover_bg.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("ROUNDEDCORNERS", [8]),
        ("TOPPADDING", (0, 0), (-1, -1), 60),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
    ]))

    story += [
        Spacer(1, 1.2*cm),
        Paragraph("LEARNTUBE", COVER_TITLE),
        Paragraph("AI YouTube Learning Assistant", COVER_SUB),
        Spacer(1, 0.4*cm),
        Paragraph("PROJECT REPORT", s("PR", fontName="Helvetica-Bold", fontSize=13,
                   textColor=colors.HexColor("#a5b4fc"), alignment=TA_CENTER)),
        Paragraph("AIML Internship | August 2026",
                  s("PRS", fontName="Helvetica", fontSize=11,
                    textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)),
        Spacer(1, 1*cm),
        hr(colors.HexColor("#4f46e5"), 1),
        Spacer(1, 0.6*cm),
    ]

    meta_rows = [
        [Paragraph("Student",     BACK_LABEL), Paragraph("Numair Fahad",               BACK_VALUE)],
        [Paragraph("Internship ID",BACK_LABEL), Paragraph("ZYNVEX-CERT-0487",           BACK_VALUE)],
        [Paragraph("Program",     BACK_LABEL), Paragraph("AIML Internship",             BACK_VALUE)],
        [Paragraph("Project Title",BACK_LABEL), Paragraph("AI YouTube Learning Assistant", BACK_VALUE)],
        [Paragraph("Tech Stack",  BACK_LABEL), Paragraph(
            "FastAPI | React | Expo | Google Gemini | ChromaDB | Clerk Auth", BACK_VALUE)],
        [Paragraph("Live URL",    BACK_LABEL), Paragraph(
            "https://ai-you-tube-assistant.replit.app", BACK_VALUE)],
        [Paragraph("Date",        BACK_LABEL), Paragraph("August 2026",                 BACK_VALUE)],
    ]
    meta_t = Table(meta_rows, colWidths=[4*cm, 12*cm])
    meta_t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8fafc"), WHITE]),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
    ]))
    story += [meta_t, Spacer(1, 0.5*cm)]

    # ── 2. TABLE OF CONTENTS ──────────────────────────────────────────────────
    story += [CondPageBreak(10*cm)]
    toc_rows = [
        [Paragraph("Section", s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Title",   s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Page",    s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE,
                                alignment=TA_CENTER))],
        ["1.", "Introduction",              "3"],
        ["2.", "Problem Statement",         "3"],
        ["3.", "System Architecture",       "4"],
        ["4.", "Technology Stack",          "4"],
        ["5.", "App UI Screenshots",        "5"],
        ["6.", "Results & Key Achievements","6"],
        ["7.", "Future Approach",           "7"],
        ["8.", "Conclusion",                "8"],
    ]
    toc_t = Table(toc_rows, colWidths=[1.5*cm, 12*cm, 2*cm])
    toc_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 10),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("ALIGN",         (2, 0), (2, -1),  "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
    ]))
    story += [Paragraph("Table of Contents", H1), toc_t, Spacer(1, 0.5*cm)]

    # ── 3. INTRODUCTION ───────────────────────────────────────────────────────
    story += section_header(1, "Introduction")
    story += [
        Paragraph(
            "LearnTube is a full-stack AI-powered platform — available as both a web application and a "
            "native mobile app — that transforms any YouTube video into an interactive, structured "
            "learning experience. Users paste a YouTube URL and instantly receive an AI-generated "
            "summary, chapter breakdowns, a multiple-choice quiz, flip-card flashcards, and a "
            "context-aware chat assistant — all grounded in the actual video transcript.",
            BODY),
        Paragraph(
            "The project was built as the capstone of the AIML Internship program, demonstrating "
            "practical application of Retrieval-Augmented Generation (RAG), large language models, "
            "vector databases, and modern full-stack engineering practices — including a live deployment "
            "at <b>ai-you-tube-assistant.replit.app</b> and a cross-platform mobile app.",
            BODY),
        Spacer(1, 4),
        Paragraph("Core Capabilities", H2),
    ]

    cap_rows = [
        [Paragraph("Feature",     s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Description", s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE))],
        ["RAG Chat",
         "Ask any question about the video — answers are grounded in transcript chunks with [MM:SS] timestamp citations."],
        ["Smart Summary",
         "Auto-generated overview, key points, and inferred chapter structure from the video."],
        ["AI Quiz",
         "Adaptive multiple-choice questions with explanations to verify comprehension."],
        ["Flashcards",
         "Spaced-repetition-ready flip cards covering key concepts and terms."],
        ["User Auth",
         "Clerk-managed authentication with Google OAuth, email/password, and forgot-password."],
        ["Video Library",
         "Per-user persistent library to revisit and re-learn from any added video."],
        ["Mobile App",
         "Native Expo / React Native companion app for iOS and Android — full feature parity with the web app, scan-to-open via QR code."],
    ]
    story += [two_col_table(cap_rows), Spacer(1, 0.4*cm)]

    # ── 4. PROBLEM STATEMENT ──────────────────────────────────────────────────
    story += section_header(2, "Problem Statement")
    story += [
        Paragraph(
            "YouTube hosts over 800 million videos and serves more than 1 billion hours of content "
            "daily. Despite being the world's largest free educational platform, learners face "
            "significant barriers to effective knowledge retention:", BODY),
        Paragraph("Passive consumption — viewers watch without active recall or structured review.", BULLET),
        Paragraph("No quick-reference summaries — rewatching an entire video to find a single point is inefficient.", BULLET),
        Paragraph("Lack of comprehension checks — no built-in quizzes, exercises, or knowledge tests.", BULLET),
        Paragraph("No interactive Q&A — learners cannot ask follow-up questions about specific content.", BULLET),
        Paragraph("Time inefficiency — long videos bury key concepts without navigation aids.", BULLET),
        Paragraph("Fragmented note-taking — learners must context-switch between the video and note tools.", BULLET),
        Spacer(1, 4),
        Paragraph("Our Solution", H2),
        Paragraph(
            "LearnTube solves all six barriers in a single unified interface. By extracting the "
            "transcript of any YouTube video, chunking it semantically, embedding it into a vector "
            "store, and feeding relevant chunks to a Google Gemini LLM, the application provides "
            "instant, grounded, interactive learning tools — without requiring any manual note-taking "
            "or video replay. The platform is accessible from any browser and, with the companion "
            "mobile app, from any iOS or Android device.", BODY),
    ]

    # ── 5. SYSTEM ARCHITECTURE ────────────────────────────────────────────────
    story += [CondPageBreak(8*cm)] + section_header(3, "System Architecture")
    story += [
        Paragraph(
            "LearnTube follows a clean three-tier architecture: a React/Vite SPA on the web "
            "frontend, an Expo/React Native app on mobile, a FastAPI REST backend, and a dual "
            "persistence layer combining SQLite (relational data) with ChromaDB (vector embeddings).",
            BODY),
        Spacer(1, 4),
        Paragraph("Architecture Overview", H2),
    ]

    arch_rows = [
        [Paragraph("Layer",       s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Technology",  s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Responsibility", s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE))],
        ["Web Frontend",    "React 18 + Vite + Tailwind CSS v4",  "SPA UI, routing, state management"],
        ["Mobile Frontend", "Expo 53 / React Native 0.79",         "iOS & Android app, Clerk auth, full feature parity"],
        ["Authentication",  "Clerk (Replit-managed)",               "JWT sessions, Google OAuth, email/password"],
        ["API Gateway",     "FastAPI (Python 3.13)",                "REST endpoints, auth middleware, RAG orchestration"],
        ["LLM",             "Google Gemini 2.0 Flash",              "Chat answers, summary, quiz, flashcard generation"],
        ["Vector Store",    "ChromaDB",                             "Semantic chunk storage and similarity search"],
        ["Relational DB",   "SQLite + SQLAlchemy",                  "User library, video metadata, summaries"],
        ["Transcript API",  "youtube-transcript-api",               "Fetches auto/manual captions from YouTube"],
        ["Embeddings",      "sentence-transformers",                 "all-MiniLM-L6-v2 local embedding model"],
        ["Intent Classifier","scikit-learn TF-IDF + LR",            "Routes user queries to correct pipeline"],
    ]
    cw = [4*cm, 5*cm, 7.5*cm]
    t = Table(arch_rows, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK_TEXT),
        ("FONTNAME",      (0, 1), (0, -1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 1), (0, -1),  NAVY),
        # highlight the mobile row
        ("BACKGROUND",    (0, 2), (-1, 2),  colors.HexColor("#ede9fe")),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
    ]))
    story += [t, Spacer(1, 6)]

    story += [Paragraph("RAG Pipeline Flow", H2),
              Paragraph("When a user submits a YouTube URL, the backend executes this pipeline:", BODY)]
    rag_rows = [
        [Paragraph("Step",        s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Action",      s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE))],
        ["Step 1 — Transcript Fetch", "youtube-transcript-api retrieves timestamped captions (auto or manual)."],
        ["Step 2 — Chunking",         "Transcript split into ~200-word semantic chunks, each tagged with a start timestamp."],
        ["Step 3 — Embedding",        "Each chunk is embedded via sentence-transformers (all-MiniLM-L6-v2) and stored in ChromaDB."],
        ["Step 4 — RAG Query",        "User questions trigger a top-5 cosine-similarity search; retrieved chunks are injected as LLM context."],
        ["Step 5 — LLM Generation",   "Google Gemini 2.0 Flash generates grounded answers with [MM:SS] timestamp citations."],
    ]
    story += [two_col_table(rag_rows, [5*cm, 11.5*cm]), Spacer(1, 0.4*cm)]

    # ── 6. TECHNOLOGY STACK ───────────────────────────────────────────────────
    story += [CondPageBreak(8*cm)] + section_header(4, "Technology Stack")
    tech_rows = [
        [Paragraph("Category",  s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
         Paragraph("Tool / Library", s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
         Paragraph("Version",   s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
         Paragraph("Purpose",   s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE))],
        ["Language",      "Python",                 "3.13",      "Backend services"],
        ["Language",      "TypeScript",             "5.x",       "Frontend (web & mobile)"],
        ["Framework",     "FastAPI",                "latest",    "REST API server"],
        ["Framework",     "React",                  "18",        "SPA web frontend"],
        ["Framework",     "Expo",                   "53",        "React Native mobile framework"],
        ["Mobile UI",     "React Native",           "0.79",      "Native iOS & Android components"],
        ["Build Tool",    "Vite",                   "6",         "Frontend bundler"],
        ["Styling",       "Tailwind CSS",           "v4",        "Utility-first CSS"],
        ["Auth",          "Clerk",                  "v5",        "JWT + OAuth sessions (web & mobile)"],
        ["LLM",           "Google Gemini",          "2.0 Flash", "AI text generation"],
        ["LLM SDK",       "google-genai",           "2.17",      "Gemini Python client"],
        ["Vectors",       "ChromaDB",               "latest",    "Semantic similarity search"],
        ["Embeddings",    "sentence-transformers",  "latest",    "all-MiniLM-L6-v2 model"],
        ["Database",      "SQLite + SQLAlchemy",    "latest",    "Relational persistence"],
        ["ML",            "scikit-learn",           "1.x",       "Intent classification"],
        ["UI Library",    "shadcn/ui + Radix UI",   "latest",    "Web component library"],
        ["Animations",    "Framer Motion",          "12",        "UI animations"],
        ["Data Fetching", "TanStack Query",         "v5",        "Server state management"],
        ["Routing",       "Wouter",                 "latest",    "Lightweight SPA router"],
    ]
    story += [four_col_table(tech_rows), Spacer(1, 0.4*cm)]

    # ── 7. APP UI SCREENSHOTS ─────────────────────────────────────────────────
    story += [CondPageBreak(8*cm)] + section_header(5, "App UI Screenshots")
    story += [
        Paragraph(
            'The following screenshots capture the live LearnTube application. The UI follows a '
            '"Cosmic Learning" design theme — deep navy background, indigo/violet/cyan gradients, '
            'animated floating orbs, glassmorphism cards, and a play-button logo mark.',
            BODY),
    ]

    assets = "attached_assets"
    imgs = sorted([
        os.path.join(assets, f)
        for f in os.listdir(assets)
        if f.endswith(".png")
    ]) if os.path.isdir(assets) else []

    captions = [
        "Figure 1: LearnTube landing page — \"Learn\" gradient wordmark, Play icon, Gemini AI badge, and animated app preview",
        "Figure 2: Clerk-powered sign-in — full logo visible, Google OAuth button, email/password flow",
        "Figure 3: App workspace — video library sidebar, URL input, YouTube player, and AI tab panel",
        "Figure 4: RAG Chat — grounded Q&A with [MM:SS] timestamp citations",
        "Figure 5: AI Summary — structured overview, key points, and chapter timestamps",
        "Figure 6: AI Quiz — multiple-choice questions with answer explanations",
        "Figure 7: Flashcards — flip-card view with term / definition pairs",
        "Figure 8: Mobile app — Expo/React Native companion on iOS and Android",
    ]

    story += [Paragraph("Landing Page — Hero Section", H2)]
    for i, img_path in enumerate(imgs):
        cap = captions[i] if i < len(captions) else f"Figure {i+1}"
        story += [CondPageBreak(8*cm)]
        if i == 1:
            story += [Paragraph("Sign-In / Authentication Page", H2)]
        if i == 2:
            story += [
                Paragraph("App Workspace (Video Learning Interface)", H2),
                Paragraph(
                    "After authentication, users enter the main workspace which is divided into four zones:",
                    BODY),
                Paragraph("Left sidebar — persistent video library showing all previously added videos with thumbnails.", BULLET),
                Paragraph("Top header — YouTube URL input field, process button, user avatar, and sign-out control.", BULLET),
                Paragraph("Video panel — embedded YouTube player with chapter timestamp navigation.", BULLET),
                Paragraph("Tab panel — four AI-powered tabs: Chat (RAG Q&A), Summary, Quiz, and Flashcards.", BULLET),
            ]
        if i == 3:
            story += [Paragraph("RAG Chat — Grounded Q&A with Timestamp Citations", H2),
                      Paragraph(
                          "Users type questions in plain English. The system retrieves the top-5 most relevant "
                          "transcript chunks via ChromaDB cosine similarity, feeds them into a Gemini 2.0 Flash "
                          "prompt, and returns a grounded answer with clickable [MM:SS] citations that auto-seek "
                          "the YouTube player to the exact moment.", BODY)]
        story += add_image(img_path, caption=cap)

    # ── 8. RESULTS & KEY ACHIEVEMENTS ─────────────────────────────────────────
    story += [CondPageBreak(8*cm)] + section_header(6, "Results & Key Achievements")
    story += [
        Paragraph(
            "The LearnTube application was successfully built, tested end-to-end, and deployed to "
            "production. All planned features were implemented and are fully functional:",
            BODY),
    ]

    ach_rows = [
        [Paragraph("Achievement", s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Details",     s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE))],
        ["[OK] Full RAG Pipeline",
         "End-to-end transcript ingestion, chunking, embedding, retrieval, and LLM answer with timestamp citations."],
        ["[OK] AI Summary Engine",
         "Gemini JSON-mode produces structured overviews, bullet-point key points, and inferred chapter timestamps."],
        ["[OK] Quiz Generator",
         "5-10 multiple-choice questions with correct answers and explanations, tailored to each video."],
        ["[OK] Flashcard Generator",
         "8-12 flip-card flashcards covering key concepts, ready for spaced-repetition study."],
        ["[OK] Intent Classifier",
         "scikit-learn TF-IDF + Logistic Regression classifier routes queries with approximately 85% accuracy."],
        ["[OK] User Authentication",
         "Clerk-managed auth with JWT verification, Google OAuth, forgot-password flow, and email/password."],
        ["[OK] Video Library",
         "Per-user persistent library of added videos stored in SQLite with full CRUD operations."],
        ["[OK] Timestamp Citations",
         "Chat answers include [MM:SS] citations that seek the embedded YouTube player to the exact moment."],
        ["[OK] Production-Ready UI",
         "Responsive, animated UI with Tailwind CSS v4, Framer Motion, shadcn/ui, and Clerk themes."],
        ["[OK] Gemini SDK Migration",
         "Migrated from deprecated google-generativeai to the new google-genai SDK v2.17."],
        ["[OK] Mobile App (Expo)",
         "Full Expo 53 / React Native 0.79 companion app for iOS and Android — Clerk auth, full feature parity, "
         "QR-code launch via Expo Go."],
        ["[OK] Live Deployment",
         "Application deployed to production at https://ai-you-tube-assistant.replit.app — publicly accessible, "
         "Autoscale hosting, venv-based Python runtime."],
    ]
    story += [achievement_table(ach_rows), Spacer(1, 6)]

    story += [Paragraph("Performance Metrics", H2)]
    perf_rows = [
        [Paragraph("Metric",       s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
         Paragraph("Typical Time", s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
         Paragraph("Notes",        s("TH", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE))],
        ["Transcript ingestion",   "3-5 seconds",  "Depends on video length"],
        ["Embedding generation",   "5-10 seconds", "Local all-MiniLM-L6-v2 model"],
        ["RAG chat latency",       "2-4 seconds",  "Gemini 2.0 Flash + top-5 retrieval"],
        ["Summary generation",     "3-6 seconds",  "JSON mode, single LLM call"],
        ["Quiz generation",        "4-8 seconds",  "JSON mode, 5-10 questions"],
        ["Flashcard generation",   "3-6 seconds",  "JSON mode, 8-12 cards"],
        ["Intent classification",  "<10 ms",        "Local scikit-learn model"],
        ["Frontend bundle size",   "~1.2 MB",       "Vite production build"],
    ]
    story += [perf_table(perf_rows), Spacer(1, 0.4*cm)]

    # ── 9. FUTURE APPROACH ────────────────────────────────────────────────────
    story += [CondPageBreak(8*cm)] + section_header(7, "Future Approach")
    story += [
        Paragraph(
            "LearnTube has a clear product roadmap. The following improvements are planned for future "
            "development iterations:",
            BODY),
    ]

    future_rows = [
        [Paragraph("Planned Feature", s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE)),
         Paragraph("Description",     s("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE))],
        ["Multi-Modal Understanding",
         "Integrate Gemini's vision API to process video frames alongside transcripts, enabling "
         "understanding of diagrams, charts, slides, and on-screen code that transcripts alone miss."],
        ["Inline Video Playback (Mobile)",
         "Embed the YouTube player directly inside the mobile app so learners can watch and interact "
         "without leaving the app, with seek-to-timestamp support from chat citations."],
        ["Share Summary / Flashcards",
         "Let learners share a video's AI-generated summary or flashcard deck with a friend via a "
         "short link or native share sheet on mobile."],
        ["Spaced Repetition System (SRS)",
         "Build a full SM-2 algorithm scheduler into the flashcard system, tracking user performance "
         "per card and scheduling reviews at optimal retention intervals."],
        ["YouTube Playlist / Course Mode",
         "Allow users to add entire YouTube playlists or channels as structured \"courses\", generating "
         "cross-video summaries and linked concept maps."],
        ["Note Export (PDF / Notion)",
         "One-click export of summaries, flashcards, and chat transcripts to PDF, Notion, or Markdown "
         "for offline study and personal knowledge management."],
        ["Multilingual Support",
         "Extend transcript processing and LLM prompts to support non-English videos, with "
         "auto-detected language and translated learning materials."],
        ["Collaborative Study Rooms",
         "Real-time multiplayer rooms where groups can watch a video together, share chat messages, "
         "compare quiz scores, and annotate key moments."],
        ["Learning Analytics Dashboard",
         "Track videos watched, quiz score trends, flashcard retention rates, and generate personalised "
         "study insights and weak-area recommendations."],
        ["Fine-Tuned Embeddings",
         "Replace sentence-transformers with an embedding model fine-tuned on educational content for "
         "more semantically accurate retrieval from lecture transcripts."],
        ["YouTube Data API Integration",
         "Migrate from transcript scraping to the official YouTube Data API for richer metadata — "
         "thumbnails, channel info, official chapter markers, and related video recommendations."],
    ]
    story += [two_col_table(future_rows), Spacer(1, 0.4*cm)]

    # ── 10. CONCLUSION ────────────────────────────────────────────────────────
    story += [CondPageBreak(6*cm)] + section_header(8, "Conclusion")
    story += [
        Paragraph(
            "LearnTube demonstrates the practical power of Retrieval-Augmented Generation applied to a "
            "real-world educational problem. By combining a modern full-stack architecture "
            "(FastAPI + React + Expo) with cutting-edge AI (Google Gemini 2.0 Flash, ChromaDB, "
            "sentence-transformers), the project delivers a production-quality platform that genuinely "
            "transforms how learners interact with video content — on the web and on mobile.",
            BODY),
        Paragraph(
            "The project showcases end-to-end ML engineering skills — from data ingestion and "
            "embedding to vector retrieval, LLM orchestration, cross-platform mobile development, "
            "and full-stack deployment. It also demonstrates awareness of production concerns: "
            "authentication, error handling, rate limiting, clean API design, and a polished, "
            "responsive user interface across both web and native mobile platforms.",
            BODY),
        Paragraph(
            "The application is live at <b>https://ai-you-tube-assistant.replit.app</b> and available "
            "as a native mobile app via Expo Go. Most importantly, LearnTube solves a genuine pain "
            "point. It makes self-directed video learning measurably more effective by adding the "
            "structured recall mechanisms — summarisation, active quizzing, and spaced repetition — "
            "that cognitive science shows are essential for long-term knowledge retention.",
            BODY),
    ]

    # ── 11. BACK PAGE ─────────────────────────────────────────────────────────
    story += [CondPageBreak(6*cm), hr(INDIGO, 1), Spacer(1, 0.6*cm)]

    back_rows = [
        [Paragraph("Repository",   BACK_LABEL),
         Paragraph("github.com/numair-2003/AIML-Internship-NumairFahad/ai_youtube_learning_assistant", BACK_VALUE)],
        [Paragraph("Live App",     BACK_LABEL),
         Paragraph("https://ai-you-tube-assistant.replit.app", BACK_VALUE)],
        [Paragraph("Built with",   BACK_LABEL),
         Paragraph("FastAPI | React | Expo | Vite | Google Gemini 2.0 Flash | ChromaDB | Clerk | Tailwind CSS v4", BACK_VALUE)],
        [Paragraph("Internship ID",BACK_LABEL),
         Paragraph("ZYNVEX-CERT-0487", BACK_VALUE)],
        [Paragraph("Student",      BACK_LABEL),
         Paragraph("Numair Fahad | AIML Internship | August 2026", BACK_VALUE)],
    ]
    back_t = Table(back_rows, colWidths=[3.5*cm, 13*cm])
    back_t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8fafc"), WHITE]),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
    ]))
    story += [back_t, Spacer(1, 0.8*cm)]
    story += [Paragraph("Thank you for reviewing this project.", s(
        "Thanks", fontName="Helvetica-Bold", fontSize=12,
        textColor=INDIGO, alignment=TA_CENTER))]

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    print(f"PDF written to: {out_path}")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "LearnTube_Project_Report.pdf")
    out = os.path.normpath(out)
    make_doc(out)
