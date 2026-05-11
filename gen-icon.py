import subprocess, sys, os

sizes = [16, 48, 128]
svg_path = os.path.join(os.path.dirname(__file__), '前端/images/pinpoint-icon-p.svg')
out_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(out_dir, exist_ok=True)

for size in sizes:
    outpath = os.path.join(out_dir, f'icon{size}.png')
    # Use qlmanage to render SVG to PNG (macOS built-in)
    tmp = os.path.join(out_dir, f'icon{size}_tmp.png')
    # First generate at 4x for quality, then downscale with sips
    hi_size = size * 4
    result = subprocess.run(
        ['qlmanage', '-t', '-s', str(hi_size), '-o', out_dir, svg_path],
        capture_output=True, text=True
    )
    # qlmanage outputs with original filename + extension
    tmp_name = os.path.join(out_dir, 'pinpoint-icon-p.svg.png')
    if os.path.exists(tmp_name):
        subprocess.run(['sips', '-z', str(size), str(size), tmp_name, '--out', outpath], capture_output=True)
        os.remove(tmp_name)
        print(f'Generated {outpath}')
    else:
        # Fallback: use sips directly if qlmanage fails
        print(f'qlmanage failed for {size}px, trying alternative...')
        # Try using /usr/bin/qlmanage or safari's webarchive approach
        # Last resort: just copy and warn
        print(f'ERROR: Could not generate {outpath}')
        print(f'  Please manually export the SVG at {size}x{size}px')
        sys.exit(1)

print('Done! All icons generated.')
