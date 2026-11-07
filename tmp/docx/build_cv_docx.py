from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


OUTPUT = Path("output/docx/Mayank_Chander_CV_Full_Stack_Software_Engineer.docx")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

BLACK = "000000"
TEAL = "167D8D"
MUTED = "5D6A75"
LIGHT = "F3F7F9"
GRID = "D9D9D9"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=55, start=85, bottom=55, end=85):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table, color=GRID, size="4"):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), size)
        tag.set(qn("w:color"), color)


def set_paragraph_bottom_border(paragraph, color=TEAL, size="6", space="3"):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), space)
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)


def set_font(run, name="Arial", size=9.2, bold=False, italic=False, color=BLACK):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)


def add_hyperlink(paragraph, text, url, color=TEAL, underline=False, bold=False):
    part = paragraph.part
    relationship_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), relationship_id)
    run = OxmlElement("w:r")
    run_properties = OxmlElement("w:rPr")
    color_element = OxmlElement("w:color")
    color_element.set(qn("w:val"), color)
    run_properties.append(color_element)
    fonts = OxmlElement("w:rFonts")
    fonts.set(qn("w:ascii"), "Arial")
    fonts.set(qn("w:hAnsi"), "Arial")
    run_properties.append(fonts)
    size = OxmlElement("w:sz")
    size.set(qn("w:val"), "18")
    run_properties.append(size)
    if underline:
        underline_element = OxmlElement("w:u")
        underline_element.set(qn("w:val"), "single")
        run_properties.append(underline_element)
    if bold:
        run_properties.append(OxmlElement("w:b"))
    run.append(run_properties)
    text_element = OxmlElement("w:t")
    text_element.text = text
    run.append(text_element)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)
    return hyperlink


def compact(paragraph, before=0, after=0, line=1.02):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    return paragraph


def add_section_heading(doc, text):
    paragraph = doc.add_paragraph(style="Heading 1")
    compact(paragraph, before=6, after=4)
    run = paragraph.add_run(text.upper())
    set_font(run, size=11, bold=True, color=BLACK)
    set_paragraph_bottom_border(paragraph)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def add_body(doc, text, after=3):
    paragraph = doc.add_paragraph()
    compact(paragraph, after=after, line=1.08)
    run = paragraph.add_run(text)
    set_font(run, size=9.2, color=BLACK)
    return paragraph


def add_bullet(doc, text, after=1.2):
    paragraph = doc.add_paragraph(style="List Bullet")
    compact(paragraph, after=after, line=1.02)
    paragraph.paragraph_format.left_indent = Cm(0.45)
    paragraph.paragraph_format.first_line_indent = Cm(-0.28)
    run = paragraph.add_run(text)
    set_font(run, size=8.75, color=BLACK)
    return paragraph


def add_role_header(doc, role, organisation, location, dates):
    paragraph = doc.add_paragraph()
    compact(paragraph, before=4, after=0)
    paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.tab_stops.add_tab_stop(Cm(17.2), alignment=2)
    run = paragraph.add_run(f"{role} | {organisation}")
    set_font(run, size=10.2, bold=True, color=BLACK)
    date_run = paragraph.add_run(f"\t{dates}")
    set_font(date_run, size=9.7, bold=True, color=BLACK)

    location_p = doc.add_paragraph()
    compact(location_p, after=2)
    location_p.paragraph_format.keep_with_next = True
    location_run = location_p.add_run(location)
    set_font(location_run, size=8.4, color=MUTED)
    return paragraph


def add_subheading(doc, label, stack=None, link=None):
    paragraph = doc.add_paragraph()
    compact(paragraph, before=3, after=1)
    paragraph.paragraph_format.keep_with_next = True
    if link:
        add_hyperlink(paragraph, label, link, color=TEAL, bold=True)
    else:
        run = paragraph.add_run(label)
        set_font(run, size=9, bold=True, color=BLACK)
    if stack:
        run = paragraph.add_run(f" | {stack}")
        set_font(run, size=9, bold=True, color=BLACK)
    return paragraph


doc = Document()
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(1.25)
section.bottom_margin = Cm(1.45)
section.left_margin = Cm(1.65)
section.right_margin = Cm(1.65)

styles = doc.styles
styles["Normal"].font.name = "Arial"
styles["Normal"]._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
styles["Normal"]._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
styles["Normal"].font.size = Pt(9.2)
styles["Normal"].font.color.rgb = RGBColor.from_string(BLACK)
styles["Title"].font.name = "Arial"
styles["Title"]._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
styles["Title"]._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
styles["Title"].font.color.rgb = RGBColor.from_string(BLACK)
title_style_ppr = styles["Title"]._element.get_or_add_pPr()
title_style_border = title_style_ppr.find(qn("w:pBdr"))
if title_style_border is not None:
    title_style_ppr.remove(title_style_border)
styles["Heading 1"].font.color.rgb = RGBColor.from_string(BLACK)

title = doc.add_paragraph(style="Title")
compact(title, after=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_ppr = title._p.get_or_add_pPr()
title_border = title_ppr.find(qn("w:pBdr"))
if title_border is not None:
    title_ppr.remove(title_border)
run = title.add_run("MAYANK CHANDER")
set_font(run, size=22, bold=True, color=BLACK)

subtitle = doc.add_paragraph()
compact(subtitle, after=2)
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run("FULL-STACK SOFTWARE ENGINEER")
set_font(run, size=11.5, bold=True, color=BLACK)

contact = doc.add_paragraph()
compact(contact, after=1)
contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
for text, url in [
    ("Melbourne, VIC | 0413 289 882 | ", None),
    ("mayankchander21@gmail.com", "mailto:mayankchander21@gmail.com"),
    (" | ", None),
    ("LinkedIn", "https://www.linkedin.com/in/mayank-chander-495074170/"),
    (" | ", None),
    ("GitHub", "https://github.com/Mayankcnz"),
]:
    if url:
        add_hyperlink(contact, text, url, color=TEAL)
    else:
        set_font(contact.add_run(text), size=8.4, color=MUTED)

rights = doc.add_paragraph()
compact(rights, after=4)
rights.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_font(rights.add_run("New Zealand citizen | Full Australian working rights"), size=8.4, color=MUTED)

add_section_heading(doc, "Profile")
add_body(
    doc,
    "Full-stack software engineer with five years of commercial experience delivering React and TypeScript interfaces and Node.js services for Qantas and startup products. Experienced in APIs, microservices, payments, third-party integrations, real-time systems and production troubleshooting. At Qantas, built an AWS Secrets Manager workflow that reduced local setup time from approximately 30 minutes to under five minutes across three engineering squads. Effective at clarifying ambiguous requirements, evaluating technical trade-offs and owning work from implementation through production support.",
)

add_section_heading(doc, "Core technologies")
skills = [
    ("Frontend", "TypeScript, JavaScript, React, Next.js, HTML5, CSS3, Material UI, Tailwind CSS"),
    ("Backend", "Node.js, Express, REST, GraphQL, WebSockets, microservices"),
    ("Data and cloud", "PostgreSQL, MongoDB, Redis, Firebase, AWS Lambda, S3, SQS, SNS, Secrets Manager"),
    ("Quality and delivery", "Jest, Vitest, GitHub Actions, Docker, CI/CD, Splunk, production troubleshooting"),
    ("Platforms", "commercetools, Adobe Experience Manager, Edge Delivery Services, Adyen, Stripe, GCP Retail API"),
]
table = doc.add_table(rows=0, cols=2)
table.autofit = False
table.columns[0].width = Cm(3.3)
table.columns[1].width = Cm(14.1)
set_table_borders(table)
for label, value in skills:
    cells = table.add_row().cells
    cells[0].width = Cm(3.3)
    cells[1].width = Cm(14.1)
    for cell in cells:
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, LIGHT)
        set_cell_margins(cell)
    p0 = cells[0].paragraphs[0]
    compact(p0)
    set_font(p0.add_run(label), size=8.7, bold=True, color=BLACK)
    p1 = cells[1].paragraphs[0]
    compact(p1)
    set_font(p1.add_run(value), size=8.7, color=BLACK)

add_section_heading(doc, "Professional experience")
add_role_header(doc, "Independent Engineering and Product Development", "Self-directed", "Melbourne, VIC", "Apr 2026 - Present")
add_subheading(
    doc,
    "AI Shorts Generator",
    "Next.js, TypeScript, PostgreSQL, Docker, FFmpeg, Whisper and Ollama",
    "https://github.com/Mayankcnz/shorts-generator",
)
for item in [
    "Developing a local application that downloads and processes long-form video, generates a transcript and uses a local LLM to identify short-form clip suggestions.",
    "Separated HTTP request handling from the video-analysis workflow and introduced dependency injection around filesystem operations, command execution and clip generation.",
    "Added unit and API-route tests using Vitest, allowing workflow behaviour to be verified without running yt-dlp, FFmpeg, Python or Ollama.",
    "Added PostgreSQL through Docker Compose to practise durable job state, schema migrations and database integration testing, and documented an evolutionary design for queued background processing.",
]:
    add_bullet(doc, item)

add_subheading(
    doc,
    "Booking Platform",
    "Next.js, TypeScript, MongoDB, Stripe and Vercel",
    "https://mayankhigherself.com/booking",
)
for item in [
    "Designed, built and deployed a production booking website covering the customer journey from service selection through online payment.",
    "Integrated Stripe for payments, MongoDB for persistent data and Vercel for production deployment.",
]:
    add_bullet(doc, item)

add_role_header(doc, "Career Break", "Travel, Content Creation and Personal Development", "Melbourne, VIC", "Nov 2025 - Mar 2026")
for item in [
    "Travelled across Victoria, Tasmania and regional Australia while planning and producing travel, motorcycling and lifestyle content for YouTube.",
    "Developed practical skills in video production, editing, storytelling and digital content strategy while continuing professional development in cloud, frontend and emerging AI technologies.",
]:
    add_bullet(doc, item)

doc.add_page_break()

add_role_header(doc, "Software Engineer", "Accenture - Qantas Airways client", "Melbourne, VIC", "Sep 2022 - Nov 2025")
for item in [
    "Delivered frontend and backend initiatives across Qantas Marketplace, Qantas Wine and Qantas digital-experience platforms.",
    "Translated Figma designs into reusable, responsive and accessible components, including configurable Anchor Section, Icon and Text Container and Breadcrumb components, improving consistency and reducing duplicated development effort.",
    "Developed and supported Qantas Marketplace and Qantas Wine services using Node.js, REST and GraphQL APIs, commercetools and AWS Lambda, S3, SQS and SNS.",
    "Proposed, designed and implemented an AWS Secrets Manager workflow that replaced manual environment-variable sharing, then led its adoption across three squads and 12 engineers; the change reduced local setup from approximately 30 minutes to under five.",
    "Worked within a dedicated production-incident team, using Splunk and application logs to investigate API, service and data-flow failures, implement validated fixes, and define spike and remediation work.",
    "Resolved production incidents affecting premium-customer subscription allocation and merchant-product availability.",
    "Played a key role in shaping the transitional architecture between the existing frontend and a new order service, enabling reliable communication as order functionality moved from the monolith into independently deployable services.",
    "Integrated Adyen checkout, refund and webhook flows, including webhook handling for the Marketplacer external-system integration.",
    "Contributed to GCP Retail API and LLM initiatives supporting eCommerce search, recommendations and personalisation.",
    "Collaborated with designers, content creators, engineers and business stakeholders to clarify requirements, agree implementation approaches and communicate system behaviour through technical documentation and visual explanations.",
]:
    add_bullet(doc, item)

add_role_header(doc, "Full-Stack Developer", "Point Zero", "Wellington, New Zealand", "Feb 2021 - Sep 2022")
for item in [
    "Owned backend architecture for a real-time multiplayer application, including REST APIs, WebSocket services, matchmaking, game-state management and persistence using Node.js, Express, MongoDB, Redis and Firebase.",
    "Delivered three complete applications end to end, from product and design discovery through solution design, React and Node.js implementation, AWS deployment and production support.",
    "Built REST APIs with pagination, filtering, validation and versioning.",
    "Deployed and maintained production applications on AWS Lightsail using Linux, HAProxy and HTTPS.",
    "Shipped the Toast Martinborough event application, SMATA and a turn-based multiplayer mobile game with location-based challenges and real-time battles.",
    "Worked directly with stakeholders in a small product team to clarify incomplete requirements and determine practical implementation approaches.",
]:
    add_bullet(doc, item)

add_section_heading(doc, "Technical writing")
paragraph = doc.add_paragraph()
compact(paragraph, after=3, line=1.05)
set_font(paragraph.add_run("Published author, Qantas Engineering Blog: "), size=9, bold=True)
add_hyperlink(
    paragraph,
    "Why Today's Software Development Can't Keep Up With Release Cycles",
    "https://medium.com/qantas-engineering-blog/why-todays-software-development-can-t-keep-up-with-release-cycles-5abfac20c5aa",
    color=TEAL,
)
set_font(
    paragraph.add_run(" - software delivery, monolith-to-microservices migration and service boundaries."),
    size=9,
)

add_section_heading(doc, "Education")
add_role_header(
    doc,
    "Bachelor of Science",
    "Victoria University of Wellington",
    "Computer Science and Information Systems | Wellington, New Zealand",
    "",
)

footer = section.footer
footer_p = footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
compact(footer_p)
set_font(footer_p.add_run("Mayank Chander | Page "), size=7.5, color=MUTED)
field = OxmlElement("w:fldSimple")
field.set(qn("w:instr"), "PAGE")
footer_p._p.append(field)

doc.core_properties.title = "Mayank Chander Full Stack Software Engineer CV"
doc.core_properties.author = "Mayank Chander"
doc.core_properties.subject = "Curriculum Vitae"
doc.core_properties.keywords = "Software Engineer, TypeScript, React, Node.js, AWS"

doc.save(OUTPUT)
print(OUTPUT.resolve())
