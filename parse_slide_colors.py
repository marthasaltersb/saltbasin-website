"""Parse slide XML to extract color palettes and layout patterns."""
import os, re, xml.etree.ElementTree as ET

OUT = r'C:\Users\mbets\saltbasin-website\pptx_analysis'

def extract_colors_from_xml(xml_text):
    """Pull all hex colors from XML."""
    # srgbClr and lumMod patterns
    colors = re.findall(r'val="([0-9A-Fa-f]{6})"', xml_text)
    return list(dict.fromkeys(colors))  # deduplicated, preserving order

def extract_text_snippets(xml_text):
    """Extract text runs from XML."""
    # Remove namespaces for simpler parsing
    xml_text = re.sub(r'xmlns[^"]*"[^"]*"', '', xml_text)
    xml_text = re.sub(r'<[a-z]+:', '<', xml_text)
    xml_text = re.sub(r'</[a-z]+:', '</', xml_text)
    texts = re.findall(r'<t[^>]*>([^<]+)</t>', xml_text)
    return [t.strip() for t in texts if t.strip()][:20]

def describe_layout(xml_text):
    """Count shapes and identify layout patterns."""
    tables = len(re.findall(r'<graphicFrame', xml_text))
    pics = len(re.findall(r'<pic>', xml_text))
    shapes = len(re.findall(r'<sp>', xml_text))
    connectors = len(re.findall(r'<cxnSp>', xml_text))
    return {'tables': tables, 'pics': pics, 'shapes': shapes, 'connectors': connectors}

for folder in sorted(os.listdir(OUT)):
    fpath = os.path.join(OUT, folder)
    if not os.path.isdir(fpath):
        continue

    print(f'\n{"="*55}')
    print(f'  {folder}')
    print('='*55)

    # Theme colors
    theme_path = os.path.join(fpath, 'theme.xml')
    if os.path.exists(theme_path):
        with open(theme_path, encoding='utf-8') as f:
            theme_xml = f.read()
        theme_colors = re.findall(r'val="([0-9A-Fa-f]{6})"', theme_xml)
        unique_theme = list(dict.fromkeys(theme_colors))[:12]
        print(f'  Theme palette: #{" #".join(unique_theme[:8])}')

    # Slide 1 analysis
    slide1_path = os.path.join(fpath, 'slide1.xml')
    if os.path.exists(slide1_path):
        with open(slide1_path, encoding='utf-8') as f:
            xml = f.read()

        layout = describe_layout(xml)
        texts = extract_text_snippets(xml)
        colors = extract_colors_from_xml(xml)

        print(f'  Slide 1 shapes: {layout}')
        print(f'  Slide 1 colors: #{" #".join(colors[:10])}')
        if texts:
            print(f'  Text snippets: {texts[:8]}')

print('\nDone.')
