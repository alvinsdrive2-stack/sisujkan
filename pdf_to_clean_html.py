import sys
import os
import fitz
from html import escape

def pdf_to_clean_html(pdf_path, output_html=None):
    if output_html is None:
        output_html = os.path.splitext(pdf_path)[0] + ".html"

    doc = fitz.open(pdf_path)

    pages_html = []

    for page_num, page in enumerate(doc, 1):
        blocks = page.get_text("dict")["blocks"]
        text_blocks = [b for b in blocks if b["type"] == 0]

        page_divs = []

        for block in text_blocks:
            block_divs = []
            for line in block["lines"]:
                spans_html = []
                for span in line["spans"]:
                    text = escape(span["text"])
                    font = span["font"]
                    size = span["size"]
                    color = span.get("color", 0)

                    weight = "bold" if "Bold" in font else "normal"
                    style = "italic" if "Italic" in font else "normal"
                    family = "Arial, sans-serif"
                    if "Times" in font:
                        family = "Times New Roman, serif"
                    elif "Courier" in font:
                        family = "Courier New, monospace"

                    if color != 0 and color != 0x000000:
                        r = (color >> 16) & 0xFF
                        g = (color >> 8) & 0xFF
                        b = color & 0xFF
                        clr = f"#{r:02X}{g:02X}{b:02X}"
                        style_attr = f' style="font-family:{family};font-size:{size:.1f}pt;font-weight:{weight};font-style:{style};color:{clr};"'
                    else:
                        style_attr = f' style="font-family:{family};font-size:{size:.1f}pt;font-weight:{weight};font-style:{style};"'

                    spans_html.append(f"<span{style_attr}>{text}</span>")

                line_text = "".join(spans_html)
                block_divs.append(f"<div>{line_text}</div>")

            if block_divs:
                page_divs.append(f"<div class='block'>" + "".join(block_divs) + "</div>")

        page_html = f"""<div class="page">
  <div class="content">
    {''.join(page_divs)}
  </div>
</div>"""
        pages_html.append(page_html)

    doc.close()

    full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>{escape(os.path.basename(pdf_path))}</title>
<style>
  body {{ margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }}
  .page {{ background: white; margin: 0 auto 20px; padding: 40px 60px; max-width: 800px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); page-break-after: always; }}
  .block {{ margin-bottom: 8px; }}
  .block > div {{ line-height: 1.5; }}
  @media print {{ body {{ background: white; }} .page {{ box-shadow: none; margin: 0; padding: 20px 40px; }} }}
</style>
</head>
<body>
{''.join(pages_html)}
</body>
</html>"""

    with open(output_html, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"Done! {output_html}")
    return output_html

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_clean_html.py <pdf_path> [output_html]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_html = sys.argv[2] if len(sys.argv) > 2 else None
    pdf_to_clean_html(pdf_path, output_html)
