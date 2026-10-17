from io import BytesIO

from PIL import Image, ImageDraw, ImageFilter, ImageFont

MILK = (246, 241, 232)


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def blend(first, second, ratio):
    return tuple(round(a + (b - a) * ratio) for a, b in zip(first, second))


def ridge(width, height, base, amplitude, seed):
    points = [(0, height)]
    steps = 14
    for step in range(steps + 1):
        x = width * step / steps
        wave = ((step * 37 + seed * 11) % 17) / 17
        y = base - amplitude * (0.35 + 0.65 * wave) * (1 if step % 2 else 0.55)
        points.append((x, y))
    points.append((width, height))
    return points


def make_portrait(initials, palette, size=(800, 1000), seed=1):
    width, height = size
    top = hex_to_rgb(palette[0])
    accent = hex_to_rgb(palette[1])
    canvas = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(canvas)
    for y in range(height):
        draw.line([(0, y), (width, y)], fill=blend(top, accent, (y / height) ** 1.6 * 0.85))

    glow = Image.new("L", size, 0)
    ImageDraw.Draw(glow).ellipse(
        [width * 0.6, height * 0.06, width * 0.88, height * 0.06 + width * 0.28], fill=150
    )
    glow = glow.filter(ImageFilter.GaussianBlur(28))
    canvas.paste(Image.new("RGB", size, MILK), (0, 0), glow)

    layers = Image.new("RGBA", size, (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layers)
    for index, (base, amplitude, alpha) in enumerate(((0.62, 220, 70), (0.74, 180, 110), (0.86, 120, 170))):
        color = (*blend(top, (8, 14, 22), 0.35 + index * 0.2), alpha)
        layer_draw.polygon(ridge(width, height, height * base, amplitude, seed + index), fill=color)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), layers)

    text_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    font = ImageFont.load_default(size=int(width * 0.34))
    box = text_draw.textbbox((0, 0), initials, font=font)
    text_width = box[2] - box[0]
    text_height = box[3] - box[1]
    position = ((width - text_width) / 2 - box[0], height * 0.42 - text_height / 2 - box[1])
    text_draw.text(position, initials, font=font, fill=(*MILK, 235))
    canvas = Image.alpha_composite(canvas, text_layer).convert("RGB")

    buffer = BytesIO()
    canvas.save(buffer, "WEBP", quality=88, method=4)
    return buffer.getvalue()
