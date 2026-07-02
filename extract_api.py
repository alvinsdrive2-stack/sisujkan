"""
CLI wrapper for single DOCX extraction.
Usage: python extract_api.py <docx_path> <type>
Types: ia04b, ia05, ia06, ia05b
Output: JSON to stdout
"""
import sys, json, traceback
from extract_soal import extract_ia04b, extract_ia05, extract_ia05b, extract_ia06

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python extract_api.py <docx_path> <type>"}))
        sys.exit(1)

    docx_path = sys.argv[1]
    tipe = sys.argv[2].lower()

    if not docx_path.lower().endswith('.docx'):
        print(json.dumps({"error": "File must be .docx"}))
        sys.exit(1)

    try:
        if tipe == 'ia04b':
            result = extract_ia04b(docx_path)
        elif tipe == 'ia05':
            result = extract_ia05(docx_path)
        elif tipe == 'ia05b':
            result = extract_ia05b(docx_path)
        elif tipe == 'ia06':
            result = extract_ia06(docx_path)
        else:
            print(json.dumps({"error": f"Unknown type: {tipe}. Use: ia04b, ia05, ia05b, ia06"}))
            sys.exit(1)

        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)
