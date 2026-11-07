from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = Path("output/pdf/Mayank_Chander_CV_Full_Stack_Software_Engineer.pdf")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#17324D")
TEAL = colors.HexColor("#167D8D")
TEXT = colors.HexColor("#24313D")
MUTED = colors.HexColor("#5D6A75")
RULE = colors.HexColor("#D7E0E6")
LIGHT = colors.HexColor("#F3F7F9")

styles = getSampleStyleSheet()

name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=24,
    textColor=NAVY,
    alignment=TA_CENTER,
    spaceAfter=2,
)
title_style = ParagraphStyle(
    "Title",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=13,
    textColor=TEAL,
    alignment=TA_CENTER,
    spaceAfter=4,
)
contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.4,
    leading=11,
    textColor=MUTED,
    alignment=TA_CENTER,
)
section_style = ParagraphStyle(
    "Section",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=13,
    textColor=NAVY,
    spaceBefore=7,
    spaceAfter=3,
    keepWithNext=True,
)
body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.65,
    leading=11.5,
    textColor=TEXT,
    spaceAfter=3,
)
role_style = ParagraphStyle(
    "Role",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=12,
    textColor=NAVY,
)
meta_style = ParagraphStyle(
    "Meta",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.1,
    leading=10,
    textColor=MUTED,
)
subrole_style = ParagraphStyle(
    "Subrole",
    parent=styles["Normal"],
    fontName="Helvetica-BoldOblique",
    fontSize=8.5,
    leading=11,
    textColor=TEAL,
    spaceBefore=4,
    spaceAfter=1,
)
bullet_style = ParagraphStyle(
    "Bullet",
    parent=body_style,
    leftIndent=9,
    firstLineIndent=-6,
    bulletIndent=0,
    spaceAfter=2.1,
)
skill_label_style = ParagraphStyle(
    "SkillLabel",
    parent=body_style,
    fontName="Helvetica-Bold",
    textColor=NAVY,
    spaceAfter=0,
)
skill_value_style = ParagraphStyle(
    "SkillValue",
    parent=body_style,
    spaceAfter=0,
)
footer_style = ParagraphStyle(
    "Footer",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=7.2,
    textColor=MUTED,
    alignment=TA_CENTER,
)


def p(text, style=body_style):
    return Paragraph(text, style)


def bullet(text):
    return Paragraph(f"<bullet>&#8226;</bullet>{text}", bullet_style)


def section(title):
    return [
        Paragraph(title.upper(), section_style),
        HRFlowable(width="100%", thickness=0.7, color=TEAL, spaceAfter=4),
    ]


def role_header(role, organisation, location, dates):
    table = Table(
        [
            [
                Paragraph(f"{role} | {organisation}", role_style),
                Paragraph(dates, role_style),
            ],
            [Paragraph(location, meta_style), ""],
        ],
        colWidths=[131 * mm, 39 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def project_header(name, stack, link=None):
    label = name
    if link:
        label = f'<link href="{link}" color="#17324D">{name}</link>'
    return Table(
        [[Paragraph(label, role_style), Paragraph(stack, meta_style)]],
        colWidths=[65 * mm, 105 * mm],
        style=TableStyle(
            [
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        ),
    )


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 13 * mm, 190 * mm, 13 * mm)
    footer = Paragraph(f"Mayank Chander | Page {doc.page}", footer_style)
    footer.wrapOn(canvas, 170 * mm, 8 * mm)
    footer.drawOn(canvas, 20 * mm, 7 * mm)
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=20 * mm,
    leftMargin=20 * mm,
    topMargin=14 * mm,
    bottomMargin=18 * mm,
    title="Mayank Chander - Full-Stack Software Engineer CV",
    author="Mayank Chander",
    subject="Curriculum Vitae",
)

story = []

story.extend(
    [
        Paragraph("MAYANK CHANDER", name_style),
        Paragraph("FULL-STACK SOFTWARE ENGINEER", title_style),
        Paragraph(
            'Melbourne, VIC &nbsp;|&nbsp; 0413 289 882 &nbsp;|&nbsp; '
            '<link href="mailto:mayankchander21@gmail.com" color="#5D6A75">mayankchander21@gmail.com</link> &nbsp;|&nbsp; '
            '<link href="https://www.linkedin.com/in/mayank-chander-495074170/" color="#167D8D">LinkedIn</link> &nbsp;|&nbsp; '
            '<link href="https://github.com/Mayankcnz" color="#167D8D">GitHub</link>',
            contact_style,
        ),
        Paragraph(
            "New Zealand citizen &nbsp;|&nbsp; Full Australian working rights",
            contact_style,
        ),
        Spacer(1, 4),
    ]
)

story.extend(section("Profile"))
story.append(
    p(
        "Full-stack software engineer with five years of commercial experience delivering React and TypeScript interfaces and Node.js services for Qantas and startup products. Experienced in APIs, microservices, payments, third-party integrations, real-time systems and production troubleshooting. At Qantas, built an AWS Secrets Manager workflow that reduced local setup time from approximately 30 minutes to under five minutes across three engineering squads. Effective at clarifying ambiguous requirements, evaluating technical trade-offs and owning work from implementation through production support."
    )
)

story.extend(section("Core technologies"))
skills = [
    ("Frontend", "TypeScript, JavaScript, React, Next.js, HTML5, CSS3, Material UI, Tailwind CSS"),
    ("Backend", "Node.js, Express, REST, GraphQL, WebSockets, microservices"),
    ("Data and cloud", "PostgreSQL, MongoDB, Redis, Firebase, AWS Lambda, S3, SQS, SNS, Secrets Manager"),
    ("Quality and delivery", "Jest, Vitest, GitHub Actions, Docker, CI/CD, Splunk, production troubleshooting"),
    ("Platforms", "commercetools, Adobe Experience Manager, Edge Delivery Services, Adyen, Stripe, GCP Retail API"),
]
skill_rows = [
    [Paragraph(label, skill_label_style), Paragraph(value, skill_value_style)]
    for label, value in skills
]
skills_table = Table(skill_rows, colWidths=[31 * mm, 139 * mm], hAlign="LEFT")
skills_table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.white),
        ]
    )
)
story.append(skills_table)

story.extend(section("Professional experience"))
story.append(role_header("Independent Engineering and Product Development", "Self-directed", "Melbourne, VIC", "Apr 2026 - Present"))
story.append(Paragraph('<link href="https://github.com/Mayankcnz/shorts-generator" color="#167D8D">AI Shorts Generator</link> | Next.js, TypeScript, PostgreSQL, Docker, FFmpeg, Whisper and Ollama', subrole_style))
story.extend(
    [
        bullet("Developing a local application that downloads and processes long-form video, generates a transcript and uses a local LLM to identify short-form clip suggestions."),
        bullet("Separated HTTP request handling from the video-analysis workflow and introduced dependency injection around filesystem operations, command execution and clip generation."),
        bullet("Added unit and API-route tests using Vitest, allowing workflow behaviour to be verified without running yt-dlp, FFmpeg, Python or Ollama."),
        bullet("Added PostgreSQL through Docker Compose to practise durable job state, schema migrations and database integration testing, and documented an evolutionary design for queued background processing."),
    ]
)
story.append(Paragraph('<link href="https://mayankhigherself.com/booking" color="#167D8D">Booking Platform</link> | Next.js, TypeScript, MongoDB, Stripe and Vercel', subrole_style))
story.extend(
    [
        bullet("Designed, built and deployed a production booking website covering the customer journey from service selection through online payment."),
        bullet("Integrated Stripe for payments, MongoDB for persistent data and Vercel for production deployment."),
    ]
)
story.append(Spacer(1, 5))
story.append(role_header("Career Break", "Travel, Content Creation and Personal Development", "Melbourne, VIC", "Nov 2025 - Mar 2026"))
story.extend(
    [
        bullet("Travelled across Victoria, Tasmania and regional Australia while planning and producing travel, motorcycling and lifestyle content for YouTube."),
        bullet("Developed practical skills in video production, editing, storytelling and digital content strategy while continuing professional development in cloud, frontend and emerging AI technologies."),
    ]
)
story.append(PageBreak())
story.append(role_header("Software Engineer", "Accenture - Qantas Airways client", "Melbourne, VIC", "Sep 2022 - Nov 2025"))
story.extend(
    [
        bullet("Delivered frontend and backend initiatives across Qantas Marketplace, Qantas Wine and Qantas digital-experience platforms."),
        bullet("Translated Figma designs into reusable, responsive and accessible components, including configurable Anchor Section, Icon and Text Container and Breadcrumb components, improving consistency and reducing duplicated development effort."),
        bullet("Developed and supported Qantas Marketplace and Qantas Wine services using Node.js, REST and GraphQL APIs, commercetools and AWS Lambda, S3, SQS and SNS."),
        bullet("Proposed, designed and implemented an AWS Secrets Manager workflow that replaced manual environment-variable sharing, then led its adoption across three squads and 12 engineers; the change reduced local setup from approximately 30 minutes to under five."),
        bullet("Worked within a dedicated production-incident team, using Splunk and application logs to investigate API, service and data-flow failures, implement validated fixes, and define spike and remediation work."),
        bullet("Resolved production incidents affecting premium-customer subscription allocation and merchant-product availability."),
        bullet("Played a key role in shaping the transitional architecture between the existing frontend and a new order service, enabling reliable communication as order functionality moved from the monolith into independently deployable services."),
        bullet("Integrated Adyen checkout, refund and webhook flows, including webhook handling for the Marketplacer external-system integration."),
        bullet("Contributed to GCP Retail API and LLM initiatives supporting eCommerce search, recommendations and personalisation."),
        bullet("Collaborated with designers, content creators, engineers and business stakeholders to clarify requirements, agree implementation approaches and communicate system behaviour through technical documentation and visual explanations."),
    ]
)

story.append(Spacer(1, 6))
story.append(role_header("Full-Stack Developer", "Point Zero", "Wellington, New Zealand", "Feb 2021 - Sep 2022"))
story.extend(
    [
        bullet("Owned backend architecture for a real-time multiplayer application, including REST APIs, WebSocket services, matchmaking, game-state management and persistence using Node.js, Express, MongoDB, Redis and Firebase."),
        bullet("Delivered three complete applications end to end, from product and design discovery through solution design, React and Node.js implementation, AWS deployment and production support."),
        bullet("Built REST APIs with pagination, filtering, validation and versioning."),
        bullet("Deployed and maintained production applications on AWS Lightsail using Linux, HAProxy and HTTPS."),
        bullet("Shipped the Toast Martinborough event application, SMATA and a turn-based multiplayer mobile game with location-based challenges and real-time battles."),
        bullet("Worked directly with stakeholders in a small product team to clarify incomplete requirements and determine practical implementation approaches."),
    ]
)

story.extend(section("Technical writing"))
story.append(
    p(
        '<b>Published author, Qantas Engineering Blog:</b> '
        '<link href="https://medium.com/qantas-engineering-blog/why-todays-software-development-can-t-keep-up-with-release-cycles-5abfac20c5aa" color="#167D8D">'
        "Why Today's Software Development Can't Keep Up With Release Cycles</link> - software delivery, monolith-to-microservices migration and service boundaries."
    )
)

story.extend(section("Education"))
story.append(
    role_header(
        "Bachelor of Science",
        "Victoria University of Wellington",
        "Computer Science and Information Systems | Wellington, New Zealand",
        "",
    )
)

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(OUTPUT.resolve())
