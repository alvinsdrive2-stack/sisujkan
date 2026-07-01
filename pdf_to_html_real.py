import sys
import os
import fitz
import re
from html import escape

def extract_images(page, output_dir, page_num):
    """Extract embedded images from page."""
    img_list = page.get_images(full=True)
    images = []
    for img_idx, img in enumerate(img_list):
        xref = img[0]
        base_image = page.parent.extract_image(xref)
        img_ext = base_image["ext"]
        img_data = base_image["image"]
        img_name = f"img_p{page_num}_{img_idx}.{img_ext}"
        img_path = os.path.join(output_dir, img_name)
        with open(img_path, "wb") as f:
            f.write(img_data)
        # Get image position on page
        img_rects = page.get_image_rects(xref)
        images.append({
            "name": img_name,
            "width": base_image["width"],
            "height": base_image["height"],
            "rect": img_rects[0] if img_rects else None,
            "bpc": base_image.get("bpc", 8),
            "colorspace": base_image.get("colorspace", "RGB"),
        })
        print(f"    Extracted image: {img_name} ({base_image['width']}x{base_image['height']})")
    return images

def is_table(block, min_lines=3):
    """Heuristic: block is a table if it has multiple lines with consistent x positions."""
    if block["type"] != 0:
        return False
    lines = block["lines"]
    if len(lines) < min_lines:
        return False
    # Check if lines have similar x positions (column alignment)
    x_positions = []
    for line in lines:
        for span in line["spans"]:
            x_positions.append((span["bbox"][0], span["bbox"][2]))  # (x0, x1)
    if not x_positions:
        return False
    # Cluster similar x positions
    x0s = sorted(set(round(x[0], -1) for x in x_positions))
    x1s = sorted(set(round(x[1], -1) for x in x_positions))
    return len(x0s) >= 2 or len(x1s) >= 2

def build_html_from_page(page, page_num, output_dir):
    """Extract page content and build HTML."""
    page_width = page.rect.width
    page_height = page.rect.height

    # Extract images
    images = extract_images(page, output_dir, page_num)

    # Extract text blocks
    blocks = page.get_text("dict")["blocks"]

    html_parts = []
    current_y = 0
    elements = []

    for block in blocks:
        btype = block["type"]

        if btype == 1:  # Image block
            # Match to extracted image
            block_rect = block["bbox"]
            matched_img = None
            for img in images:
                if img["rect"] and img_rect_overlaps(img["rect"], block_rect):
                    matched_img = img
                    break
            if not matched_img and images:
                matched_img = images[0]
            if matched_img:
                x = matched_img["rect"].x0 if matched_img["rect"] else 0
                y = matched_img["rect"].y0 if matched_img["rect"] else 0
                elements.append({
                    "y": y,
                    "type": "img",
                    "src": matched_img["name"],
                    "x": x,
                    "width": matched_img["width"],
                    "height": matched_img["height"],
                    "rect": matched_img["rect"],
                })

        elif btype == 0:  # Text block
            block_rect = block["bbox"]
            y = block_rect[1]
            lines = block["lines"]

            # Check if it's a table
            if is_table(block):
                table_html = build_table_html(lines)
                elements.append({"y": y, "type": "table", "html": table_html})
            else:
                # Regular text
                line_htmls = []
                for line in lines:
                    span_htmls = []
                    for span in line["spans"]:
                        text = escape(span["text"])
                        font = span["font"]
                        size = span["size"]
                        color = span.get("color", 0)
                        bbox = span["bbox"]

                        # CSS font style
                        font_weight = "bold" if "Bold" in font else "normal"
                        font_style = "italic" if "Italic" in font else "normal"

                        # Font family mapping
                        font_family = "Arial, sans-serif"
                        if "Times" in font:
                            font_family = "Times New Roman, serif"
                        elif "Courier" in font:
                            font_family = "Courier New, monospace"

                        # Color as RGB
                        if color != 0:
                            r = (color >> 16) & 0xFF
                            g = (color >> 8) & 0xFF
                            b = color & 0xFF
                            color_css = f"#{r:02X}{g:02X}{b:02X}"
                        else:
                            color_css = "inherit"

                        # Inline style
                        style = f"font-family:{font_family};font-size:{size:.1f}px;font-weight:{font_weight};font-style:{font_style};color:{color_css};"

                        # Check for underline
                        if "underline" in font.lower():
                            style += "text-decoration:underline;"

                        span_htmls.append(f'<span style="{style}">{text}</span>')

                    line_html = "".join(span_htmls)
                    # Preserve spaces
                    line_html = f'<div style="line-height:1.4;margin:0;">{line_html}</div>'
                    line_htmls.append(line_html)

                block_html = "\n".join(line_htmls)
                elements.append({"y": y, "type": "text", "html": block_html, "rect": block_rect})

    # Sort by y position
    elements.sort(key=lambda e: e["y"])

    return elements

def img_rect_overlaps(r1, r2, threshold=0.3):
    """Check if two rects overlap significantly."""
    if r1 is None or r2 is None:
        return False
    # Check intersection
    x0 = max(r1.x0, r2[0])
    y0 = max(r1.y0, r2[1])
    x1 = min(r1.x1, r2[2])
    y1 = min(r1.y1, r2[3])
    if x1 <= x0 or y1 <= y0:
        return False
    # Intersection area
    inter_area = (x1 - x0) * (y1 - y0)
    img_area = r1.width * r1.height
    overlap_ratio = inter_area / img_area if img_area > 0 else 0
    return overlap_ratio > threshold

def build_table_html(lines):
    """Try to build a table from text lines."""
    # Estimate column positions
    all_spans = []
    for line in lines:
        for span in line["spans"]:
            all_spans.append((span["bbox"][0], span["bbox"][2]))

    if not all_spans:
        return "<table><tr><td></td></tr></table>"

    # Cluster x positions to find columns
    x_starts = sorted(set(round(x[0], -2) for x in all_spans))  # Round to nearest 100
    x_ends = sorted(set(round(x[1], -2) for x in all_spans))

    # Build column boundaries
    boundaries = sorted(set(x_starts + [x + 50 for x in x_starts]))
    if len(boundaries) < 2:
        boundaries = [0, 200, 400, 600]

    rows = []
    for line in lines:
        cells = []
        line_bbox = line["bbox"]
        for i in range(len(boundaries) - 1):
            col_start = boundaries[i]
            col_end = boundaries[i + 1]
            cell_texts = []
            for span in line["spans"]:
                sx0, sx1 = span["bbox"][0], span["bbox"][2]
                # Check if span belongs to this column
                if sx0 < col_end - 10:
                    cell_texts.append(escape(span["text"]))
            cell_content = " ".join(cell_texts).strip()
            cells.append(f"<td>{cell_content}</td>")
        if any(c.replace("<td>", "").replace("</td>", "").strip() for c in cells):
            rows.append(f"<tr>{''.join(cells)}</tr>")

    if not rows:
        return "<table><tr><td></td></tr></table>"

    return f"<table border='1' style='border-collapse:collapse;width:100%;font-size:11px;'>\n{chr(10).join(rows)}\n</table>"

def pdf_to_real_html(pdf_path, output_html=None, dpi=150):
    """Main converter."""
    if output_html is None:
        output_html = os.path.splitext(pdf_path)[0] + ".html"

    output_dir = os.path.dirname(output_html)
    if not output_dir:
        output_dir = "."

    doc = fitz.open(pdf_path)
    page_count = len(doc)

    all_pages_html = []

    for i, page in enumerate(doc):
        print(f"\nProcessing page {i+1}/{page_count}...")
        page_width = page.rect.width
        page_height = page.rect.height

        elements = build_html_from_page(page, i+1, output_dir)

        page_html = f"""<div class="page" style="position:relative;width:{page_width}px;min-height:{page_height}px;margin:0 auto 20px;background:white;padding:40px 50px;box-sizing:border-box;border:1px solid #ccc;overflow:hidden;">
"""
        for el in elements:
            if el["type"] == "text":
                style = f"position:absolute;top:{el['y']:.0f}px;left:0;right:0;"
                page_html += f"  <div style=\"{style}\">\n    {el['html']}\n  </div>\n"
            elif el["type"] == "table":
                style = f"position:absolute;top:{el['y']:.0f}px;left:0;right:0;"
                page_html += f"  <div style=\"{style}\">\n    {el['html']}\n  </div>\n"
            elif el["type"] == "img":
                img = el
                style = f"position:absolute;top:{img['y']:.0f}px;left:{img['x']:.0f}px;width:{img['width']}px;height:{img['height']}px;"
                page_html += f'  <img style="{style}" src="{img["src"]}" />\n'

        page_html += "</div>"
        all_pages_html.append(page_html)

    doc.close()

    full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>{escape(os.path.basename(pdf_path))}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #f0f0f0; font-family: Arial, sans-serif; }}
  @media print {{
    body {{ background: white; }}
    .page {{ margin: 0; border: none; page-break-after: always; }}
  }}
</style>
</head>
<body>
{chr(10).join(all_pages_html)}
</body>
</html>"""

    with open(output_html, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"\nDone! Output: {output_html}")
    return output_html

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_html_real.py <pdf_path> [output_html]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_html = sys.argv[2] if len(sys.argv) > 2 else None
    pdf_to_real_html(pdf_path, output_html)
