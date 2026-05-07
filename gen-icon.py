import struct, zlib, sys

size = int(sys.argv[1])
pixels = []
cx, cy = size // 2, size // 2
r_outer = size * 0.22
r_inner = size * 0.08
corner_r = size * 0.156

for y in range(size):
    for x in range(size):
        in_rect = True
        if x < corner_r and y < corner_r:
            in_rect = ((x - corner_r)**2 + (y - corner_r)**2) <= corner_r**2
        elif x >= size - corner_r and y < corner_r:
            in_rect = ((x - (size - corner_r))**2 + (y - corner_r)**2) <= corner_r**2
        elif x < corner_r and y >= size - corner_r:
            in_rect = ((x - corner_r)**2 + (y - (size - corner_r))**2) <= corner_r**2
        elif x >= size - corner_r and y >= size - corner_r:
            in_rect = ((x - (size - corner_r))**2 + (y - (size - corner_r))**2) <= corner_r**2

        dist = ((x - cx)**2 + (y - cy)**2) ** 0.5
        if not in_rect:
            pixels.append((0, 0, 0, 0))
        elif dist <= r_inner:
            pixels.append((59, 130, 246, 255))
        elif dist <= r_outer:
            pixels.append((255, 255, 255, 230))
        else:
            pixels.append((59, 130, 246, 255))

raw = b''
for y in range(size):
    raw += b'\x00'
    for x in range(size):
        r, g, b, a = pixels[y * size + x]
        raw += bytes([r, g, b, a])

def chunk(ctype, data):
    c = ctype + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n' + \
    chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + \
    chunk(b'IDAT', zlib.compress(raw)) + \
    chunk(b'IEND', b'')

outpath = sys.argv[2]
with open(outpath, 'wb') as f:
    f.write(png)
print(f'Generated {outpath}')
