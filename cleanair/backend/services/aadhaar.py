"""
backend/services/aadhaar.py
Placeholder Aadhaar verification: Verhoeff checksum validation + name matching
+ salted hashing. No real UIDAI API — but real Aadhaar numbers pass and made-up
numbers fail, because genuine Aadhaar numbers carry a Verhoeff check digit.
Swapping in real eKYC later only replaces `verify()` internals.
"""
import hashlib
import re
from difflib import SequenceMatcher

# -- Verhoeff algorithm tables ---------------------------------------------------

_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]


def _verhoeff_ok(number: str) -> bool:
    c = 0
    for i, digit in enumerate(reversed(number)):
        c = _D[c][_P[i % 8][int(digit)]]
    return c == 0


def normalize_aadhaar(raw: str) -> str:
    """Strip spaces/dashes: '1234 5678 9012' -> '123456789012'."""
    return re.sub(r"[\s-]", "", raw or "")


def validate_number(raw: str) -> tuple[bool, str]:
    """Returns (ok, reason). Reason is empty when ok."""
    number = normalize_aadhaar(raw)
    if not number.isdigit() or len(number) != 12:
        return False, "Aadhaar must be exactly 12 digits"
    if number[0] in ("0", "1"):
        return False, "Aadhaar numbers never start with 0 or 1"
    if not _verhoeff_ok(number):
        return False, "Invalid Aadhaar number (checksum failed)"
    return True, ""


def name_matches(entered_name: str, reference_name: str, threshold: float = 0.85) -> bool:
    """
    Placeholder for the eKYC name check. With no UIDAI API, the reference name
    is the user's Google account name; real eKYC would supply the Aadhaar name.
    """
    a = re.sub(r"\s+", " ", (entered_name or "").strip().lower())
    b = re.sub(r"\s+", " ", (reference_name or "").strip().lower())
    if not a or not b:
        return False
    if a == b or set(a.split()) <= set(b.split()) or set(b.split()) <= set(a.split()):
        return True
    return SequenceMatcher(None, a, b).ratio() >= threshold


def hash_aadhaar(raw: str, salt: str) -> str:
    """Salted SHA-256 — the raw number is never stored."""
    number = normalize_aadhaar(raw)
    return hashlib.sha256(f"{number}{salt}".encode()).hexdigest()


def last4(raw: str) -> str:
    return normalize_aadhaar(raw)[-4:]
