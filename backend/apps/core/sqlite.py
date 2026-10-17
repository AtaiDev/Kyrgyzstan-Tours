import re
from functools import lru_cache


@lru_cache(maxsize=1024)
def compile_like_pattern(pattern, escape):
    parts = []
    index = 0
    while index < len(pattern):
        character = pattern[index]
        if escape and character == escape and index + 1 < len(pattern):
            parts.append(re.escape(pattern[index + 1]))
            index += 2
            continue
        if character == "%":
            parts.append(".*")
        elif character == "_":
            parts.append(".")
        else:
            parts.append(re.escape(character))
        index += 1
    return re.compile("^" + "".join(parts) + "$", re.IGNORECASE | re.DOTALL)


def unicode_like(pattern, value, escape=None):
    if pattern is None or value is None:
        return None
    return 1 if compile_like_pattern(str(pattern), escape).match(str(value)) else 0


def register_unicode_like(sender, connection, **kwargs):
    if connection.vendor != "sqlite":
        return
    connection.connection.create_function("like", 2, unicode_like, deterministic=True)
    connection.connection.create_function("like", 3, unicode_like, deterministic=True)
