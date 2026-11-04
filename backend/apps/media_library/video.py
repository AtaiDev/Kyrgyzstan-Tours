"""MP4/MOV inspection straight from the container boxes, so the server needs no ffmpeg.

`probe` reads what the admin needs to judge an upload (size, duration, codec) and whether a browser can start
playing before the whole file has arrived. `make_streamable` fixes the common case where it can't: the `moov` index
sits after the media data, which makes the browser download the entire file before showing the first frame.
"""

import struct
from dataclasses import dataclass

CONTAINER_BOXES = {b"moov", b"trak", b"mdia", b"minf", b"stbl", b"edts", b"dinf"}


@dataclass
class VideoInfo:
    width: int | None = None
    height: int | None = None
    duration: float | None = None
    codec: str = ""
    streamable: bool = True


def _boxes(data, start=0, end=None):
    """Yield (type, box_start, header_size, box_size) for the boxes in data[start:end]."""
    end = len(data) if end is None else end
    position = start
    while position + 8 <= end:
        size, kind = struct.unpack_from(">I4s", data, position)
        header = 8
        if size == 1:
            if position + 16 > end:
                return
            size = struct.unpack_from(">Q", data, position + 8)[0]
            header = 16
        elif size == 0:
            size = end - position
        if size < header or position + size > end:
            return
        yield kind, position, header, size
        position += size


def _find(data, start, end, path):
    """Return (payload_start, payload_end) of every box at the given nested path, e.g. [b"trak", b"tkhd"]."""
    found = []
    for kind, box_start, header, size in _boxes(data, start, end):
        if kind != path[0]:
            continue
        if len(path) == 1:
            found.append((box_start + header, box_start + size))
        else:
            found.extend(_find(data, box_start + header, box_start + size, path[1:]))
    return found


def _top_level(handle):
    """Scan top-level boxes of a seekable binary file without reading the media data."""
    handle.seek(0, 2)
    total = handle.tell()
    position = 0
    boxes = []
    while position + 8 <= total:
        handle.seek(position)
        head = handle.read(16)
        size, kind = struct.unpack_from(">I4s", head, 0)
        header = 8
        if size == 1:
            size = struct.unpack_from(">Q", head, 8)[0]
            header = 16
        elif size == 0:
            size = total - position
        if size < header:
            break
        boxes.append((kind, position, header, size))
        position += size
    return boxes


def _parse_moov(moov):
    info = VideoInfo()
    for payload_start, payload_end in _find(moov, 0, len(moov), [b"moov", b"mvhd"]):
        version = moov[payload_start]
        if version == 1:
            timescale, duration = struct.unpack_from(">IQ", moov, payload_start + 20)
        else:
            timescale, duration = struct.unpack_from(">II", moov, payload_start + 12)
        if timescale:
            info.duration = round(duration / timescale, 3)
    for trak_start, trak_end in _find(moov, 0, len(moov), [b"moov", b"trak"]):
        handlers = _find(moov, trak_start, trak_end, [b"mdia", b"hdlr"])
        if not handlers or moov[handlers[0][0] + 8 : handlers[0][0] + 12] != b"vide":
            continue
        for payload_start, _ in _find(moov, trak_start, trak_end, [b"tkhd"]):
            version = moov[payload_start]
            matrix = payload_start + (52 if version == 1 else 40)
            dims = payload_start + (88 if version == 1 else 76)
            width, height = struct.unpack_from(">II", moov, dims)
            info.width, info.height = width >> 16, height >> 16
            a, b = struct.unpack_from(">ii", moov, matrix)
            if a == 0 and b != 0:  # rotated 90°/270° (phone footage): the picture is shown the other way round
                info.width, info.height = info.height, info.width
        for payload_start, _ in _find(moov, trak_start, trak_end, [b"mdia", b"minf", b"stbl", b"stsd"]):
            info.codec = moov[payload_start + 12 : payload_start + 16].decode("latin-1").strip()
        break
    return info


def probe(handle):
    """Inspect an open, seekable binary file. Returns None when it isn't a readable MP4/MOV."""
    try:
        boxes = _top_level(handle)
        kinds = [kind for kind, *_ in boxes]
        if b"moov" not in kinds:
            return None
        _, moov_start, _, moov_size = boxes[kinds.index(b"moov")]
        handle.seek(moov_start)
        info = _parse_moov(handle.read(moov_size))
        info.streamable = b"mdat" not in kinds or kinds.index(b"moov") < kinds.index(b"mdat")
        return info
    except (struct.error, IndexError, ValueError):
        return None
    finally:
        handle.seek(0)


def make_streamable(data):
    """Return the file with `moov` moved in front of the media data (what qt-faststart does), or None if the
    file is already streamable or can't be rewritten safely."""
    try:
        boxes = list(_boxes(data))
        kinds = [kind for kind, *_ in boxes]
        if b"moov" not in kinds or b"mdat" not in kinds or kinds.index(b"moov") < kinds.index(b"mdat"):
            return None
        _, moov_start, _, moov_size = boxes[kinds.index(b"moov")]
        insert_at = boxes[kinds.index(b"mdat")][1]
        moov = bytearray(data[moov_start : moov_start + moov_size])

        # Media between the insertion point and the old moov position moves forward by the size of moov.
        def shifted(offset):
            return offset + moov_size if insert_at <= offset < moov_start else offset

        for path, entry in (([b"moov", b"trak", b"mdia", b"minf", b"stbl", b"stco"], 4), ([b"moov", b"trak", b"mdia", b"minf", b"stbl", b"co64"], 8)):
            for payload_start, _ in _find(moov, 0, len(moov), path):
                count = struct.unpack_from(">I", moov, payload_start + 4)[0]
                for index in range(count):
                    position = payload_start + 8 + index * entry
                    if entry == 4:
                        new = shifted(struct.unpack_from(">I", moov, position)[0])
                        if new > 0xFFFFFFFF:
                            return None
                        struct.pack_into(">I", moov, position, new)
                    else:
                        struct.pack_into(">Q", moov, position, shifted(struct.unpack_from(">Q", moov, position)[0]))
        rest = b"".join(data[start : start + size] for kind, start, _, size in boxes if start >= insert_at and kind != b"moov")
        return bytes(data[:insert_at]) + bytes(moov) + rest
    except (struct.error, IndexError, ValueError):
        return None
