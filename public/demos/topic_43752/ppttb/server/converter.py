import subprocess
from pathlib import Path

import fitz  # PyMuPDF


def convert_ppt_to_pdf(ppt_path, out_dir):
    cmd = [
        "soffice", "--headless", "--convert-to", "pdf",
        "--outdir", str(out_dir), str(ppt_path),
    ]
    subprocess.run(cmd, check=True, timeout=300)
    pdf_name = Path(ppt_path).stem + ".pdf"
    return Path(out_dir) / pdf_name


def render_pdf_to_images(pdf_path, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    total = len(doc)
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=150)
        pix.save(out_dir / f"{i}.png")
    doc.close()
    return total


def convert(ppt_path, out_dir):
    pdf_path = convert_ppt_to_pdf(ppt_path, out_dir)
    total = render_pdf_to_images(pdf_path, out_dir)
    return total
