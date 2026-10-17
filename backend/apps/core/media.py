import mimetypes
import re
from pathlib import Path

from django.core.exceptions import SuspiciousFileOperation
from django.http import Http404, HttpResponse, StreamingHttpResponse
from django.utils._os import safe_join
from django.utils.http import http_date
from django.views.static import serve

RANGE_PATTERN = re.compile(r"^bytes=(\d*)-(\d*)$")
CHUNK_SIZE = 64 * 1024


def _stream(path, start, length):
    with path.open("rb") as handle:
        handle.seek(start)
        remaining = length
        while remaining > 0:
            chunk = handle.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def _resolve_range(header, size):
    match = RANGE_PATTERN.match(header)
    if not match:
        return None
    first, last = match.groups()
    if first:
        start = int(first)
        end = min(int(last), size - 1) if last else size - 1
    elif last:
        start = max(size - int(last), 0)
        end = size - 1
    else:
        return None
    return start, end


def serve_media(request, path, document_root):
    header = request.headers.get("Range", "").strip()
    if not header:
        response = serve(request, path, document_root=document_root)
        response["Accept-Ranges"] = "bytes"
        return response
    try:
        full_path = Path(safe_join(str(document_root), path))
    except (SuspiciousFileOperation, ValueError):
        raise Http404
    if not full_path.is_file():
        raise Http404
    stat = full_path.stat()
    byte_range = _resolve_range(header, stat.st_size)
    if byte_range is None or byte_range[0] >= stat.st_size or byte_range[0] > byte_range[1]:
        response = HttpResponse(status=416)
        response["Content-Range"] = f"bytes */{stat.st_size}"
        return response
    start, end = byte_range
    length = end - start + 1
    content_type = mimetypes.guess_type(full_path.name)[0] or "application/octet-stream"
    response = StreamingHttpResponse(_stream(full_path, start, length), status=206, content_type=content_type)
    response["Content-Length"] = str(length)
    response["Content-Range"] = f"bytes {start}-{end}/{stat.st_size}"
    response["Accept-Ranges"] = "bytes"
    response["Last-Modified"] = http_date(stat.st_mtime)
    return response
