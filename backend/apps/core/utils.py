from django.utils.text import slugify

CYRILLIC_TRANSLITERATION = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
    "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "ң": "ng", "о": "o", "ө": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ү": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh",
    "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def make_slug(text, max_length=80):
    transliterated = "".join(CYRILLIC_TRANSLITERATION.get(character, character) for character in str(text).lower())
    return slugify(transliterated)[:max_length].strip("-")


def unique_slug(model, base, exclude_pk=None, field="slug"):
    root = base or "item"
    candidate = root
    counter = 2
    queryset = model._default_manager.all()
    if exclude_pk:
        queryset = queryset.exclude(pk=exclude_pk)
    while queryset.filter(**{field: candidate}).exists():
        candidate = f"{root}-{counter}"
        counter += 1
    return candidate


def split_lines(text):
    return [line.strip(" -•\t") for line in (text or "").splitlines() if line.strip(" -•\t")]
