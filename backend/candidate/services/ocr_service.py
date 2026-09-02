import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

import os
import re
import logging
from difflib import SequenceMatcher
from pytesseract import TesseractNotFoundError
from PIL import Image, ImageOps, ImageFilter

logger = logging.getLogger(__name__)

DEGREE_SYNONYMS = {
    "ssc": ["ssc", "secondary school certificate", "s.s.c"],
    "hsc": ["hsc", "higher secondary certificate", "h.s.c"],
    "10th": ["ssc", "secondary school certificate", "10th"],
    "12th": ["hsc", "higher secondary certificate", "12th"],
    "bsc": ["bsc", "b.sc", "bachelor of science"],
    "msc": ["msc", "m.sc", "master of science"],
    "ba": ["ba", "b.a", "bachelor of arts"],
    "ma": ["ma", "m.a", "master of arts"],
    "bcom": ["bcom", "b.com", "bachelor of commerce"],
    "mcom": ["mcom", "m.com", "master of commerce"],
    "btech": ["btech", "b.tech", "bachelor of technology"],
    "mtech": ["mtech", "m.tech", "master of technology"],
    "be": ["be", "b.e", "bachelor of engineering"],
    "mba": ["mba", "master of business administration"],
    "bca": ["bca", "bachelor of computer applications"],
    "mca": ["mca", "master of computer applications"],
    "phd": ["phd", "ph.d", "doctor of philosophy"],
}

STOPWORDS = {"of", "the", "and", "&", "for", "a", "an", "in", "at", "&amp;"}


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.strip().lower(), b.strip().lower()).ratio()


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def _preprocess_for_ocr(image: Image.Image) -> Image.Image:
    image = image.convert("L")
    scale = 2 if max(image.size) < 1500 else 1
    if scale > 1:
        image = image.resize((image.width * scale, image.height * scale), Image.LANCZOS)
    image = ImageOps.autocontrast(image)
    image = image.filter(ImageFilter.SHARPEN)
    return image


def extract_text_from_image(image_file) -> str:
    try:
        image_file.seek(0)
        image = Image.open(image_file)
        processed = _preprocess_for_ocr(image)
        text = pytesseract.image_to_string(processed)
        image_file.seek(0)
        return text
    except TesseractNotFoundError:
        logger.critical("Tesseract binary not found on this server.")
        image_file.seek(0)
        return None
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}", exc_info=True)
        image_file.seek(0)
        return ""


def name_found_in_text(candidate_name: str, ocr_text: str, threshold: float = 0.75) -> bool:
    normalized_name = _normalize(candidate_name)
    normalized_text = _normalize(ocr_text)
    if not normalized_name or not normalized_text:
        return False
    if normalized_name in normalized_text:
        return True
    name_words = normalized_name.split()
    text_words = normalized_text.split()
    window_size = len(name_words)
    for i in range(len(text_words) - window_size + 1):
        window = " ".join(text_words[i:i + window_size])
        if _similarity(normalized_name, window) >= threshold:
            return True
    return False


def degree_found_in_text(value: str, ocr_text: str) -> bool:
    if not value:
        return True
    normalized_value = _normalize(value).replace(".", "")
    normalized_text = _normalize(ocr_text)
    candidates = {normalized_value}
    candidates.update(DEGREE_SYNONYMS.get(normalized_value, []))
    for candidate in candidates:
        if candidate in normalized_text:
            return True
    return field_found_in_text(value, ocr_text)


def institute_found_in_text(value: str, ocr_text: str, word_threshold: float = 0.75, overlap_required: float = 0.5) -> bool:
    normalized_value = _normalize(value)
    normalized_text = _normalize(ocr_text)
    text_words = normalized_text.split()
    value_words = [
        w for w in re.findall(r"[a-z0-9]+", normalized_value)
        if w not in STOPWORDS and len(w) > 2
    ]
    if not value_words:
        return True
    matched = 0
    for vw in value_words:
        if any(_similarity(vw, tw) >= word_threshold for tw in text_words):
            matched += 1
    return (matched / len(value_words)) >= overlap_required


def document_contains_marks_data(ocr_text: str) -> bool:
    patterns = [
        r'\b\d{1,3}(\.\d+)?\s*%',
        r'\b\d\.\d{1,2}\s*(cgpa|gpa)\b',
        r'\bcgpa\s*[:\-]?\s*\d',
        r'\bpercentage\s*[:\-]?\s*\d',
        r'\bmarks?\s*obtained',
        r'\bgrand\s+total\b',
        r'\btotal\s*[:\-]?\s*\d{2,3}\b',
    ]
    text = (ocr_text or "").lower()
    return any(re.search(p, text) for p in patterns)


def field_found_in_text(value: str, ocr_text: str, threshold: float = 0.65) -> bool:
    if not value:
        return True
    normalized_value = _normalize(value)
    normalized_text = _normalize(ocr_text)
    if normalized_value in normalized_text:
        return True
    value_words = normalized_value.split()
    text_words = normalized_text.split()
    window_size = max(len(value_words), 1)
    for i in range(len(text_words) - window_size + 1):
        window = " ".join(text_words[i:i + window_size])
        if _similarity(normalized_value, window) >= threshold:
            return True
    return False


def verify_education_document(candidate_name, education_data, image_file):
    """
    Returns (status: str, message: str | None)
    status is one of: "verified", "pending_review", "rejected"
    """
    ocr_text = extract_text_from_image(image_file)

    if ocr_text is None:
        return "rejected", (
            "Certificate verification is temporarily unavailable. "
            "Please try again later or contact support."
        )

    if not ocr_text.strip():
        return "rejected", "Could not read any text from the uploaded certificate. Please upload a clearer image."

    institute_ok = institute_found_in_text(education_data.get("institute", ""), ocr_text)
    degree_ok = degree_found_in_text(education_data.get("degree", ""), ocr_text)
    name_ok = name_found_in_text(candidate_name, ocr_text)

    marks = education_data.get("marks", "")
    marks_ok = True
    if marks and document_contains_marks_data(ocr_text):
        marks_ok = field_found_in_text(marks, ocr_text)

    if name_ok and institute_ok and degree_ok and marks_ok:
        return "verified", None

    if not institute_ok and not degree_ok:
        return "rejected", (
            "This certificate doesn't appear to match the institute or degree you entered. "
            "Please upload the correct certificate."
        )

    if not name_ok:
        return "pending_review", (
            "Your education details were saved, but the name on the certificate "
            "could not be automatically verified. An admin will review it shortly."
        )

    mismatches = []
    if not institute_ok:
        mismatches.append("institute")
    if not degree_ok:
        mismatches.append("degree")
    if not marks_ok:
        mismatches.append("marks")

    return "rejected", (
        f"The following details don't match your certificate: {', '.join(mismatches)}. "
        "Please check and re-enter them."
    )