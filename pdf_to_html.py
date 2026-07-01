import sys
import os
import fitz

def pdf_to_html(pdf_path, output_html=None, dpi=150):
    if output_html is None:
        output_html = os.path.splitext(pdf_path)[0] + ".html"

    doc = fitz.open(pdf_path)
    page_count = len(doc)

    page_images = []
    for i, page in enumerate(doc):
        mat = fitz.Matrix(dpi/72, dpi/72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_name = f"page_{i+1}.png"
        img_path = os.path.join(os.path.dirname(output_html), img_name)
        pix.save(img_path)
        page_images.append((img_name, page.rect.width, page.rect.height))
        print(f"  Rendered page {i+1}/{page_count}")

    doc.close()

    page_width = page_images[0][1] if page_images else 595
    page_height = page_images[0][2] if page_images else 842

    html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>{os.path.basename(pdf_path)}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #e0e0e0; font-family: sans-serif; }}
  .page {{
    position: relative;
    background: white;
    margin: 20px auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    width: {page_width}px;
    height: {page_height}px;
  }}
  .page img {{
    width: 100%;
    height: 100%;
    display: block;
  }}
  @media print {{
    body {{ background: white; }}
    .page {{ box-shadow: none; margin: 0; page-break-after: always; }}
  }}
</style>
</head>
<body>
"""

    for img_name, pw, ph in page_images:
        html += f"""<div class="page">
  <img src="{img_name}" alt="Page">
</div>
"""

    html += """
</body>
</html>"""

    with open(output_html, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nDone! Output: {output_html}")
    print(f"Images extracted: {len(page_images)}")
    return output_html

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_html.py <pdf_path> [output_html]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_html = sys.argv[2] if len(sys.argv) > 2 else None
    pdf_to_html(pdf_path, output_html)
