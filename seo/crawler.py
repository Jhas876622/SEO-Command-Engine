"""
crawler.py — lightweight Python web crawler to audit live URLs directly.

Fetches web pages starting from a seed URL, extracts titles, H1s, metas,
word counts, and status codes, and produces a Screaming Frog compatible dataset.
"""

import csv
import re
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser

# Helper to extract tags and links from HTML text
class SimpleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_desc = ""
        self.h1s = []
        self.links = []
        self.in_title = False
        self.in_h1 = False
        self.current_h1 = ""
        self.text_content = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        tag_lower = tag.lower()
        if tag_lower == 'title':
            self.in_title = True
        elif tag_lower == 'h1':
            self.in_h1 = True
            self.current_h1 = ""
        elif tag_lower == 'meta':
            name = attr_dict.get('name', '').lower()
            if name == 'description':
                self.meta_desc = attr_dict.get('content', '')
        elif tag_lower == 'a':
            href = attr_dict.get('href', '')
            if href:
                self.links.append(href)

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower == 'title':
            self.in_title = False
        elif tag_lower == 'h1':
            self.in_h1 = False
            if self.current_h1.strip():
                self.h1s.append(self.current_h1.strip())

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_h1:
            self.current_h1 += data
        if data.strip():
            self.text_content.append(data.strip())


# Crawl a target site starting from seed_url up to max_pages
def crawl_site(seed_url, max_pages=25):
    if not seed_url.startswith(("http://", "https://")):
        seed_url = "https://" + seed_url

    parsed_seed = urllib.parse.urlparse(seed_url)
    domain = parsed_seed.netloc.lower()
    
    queue = [seed_url]
    visited = set()
    rows = []

    headers = {
        'User-Agent': 'SEOCommandCenter/2.0 (Mozilla/5.0 Compatible SEO Audit Bot)'
    }

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        url_clean = url.split('#')[0]
        if url_clean in visited:
            continue
        visited.add(url_clean)

        t0 = time.time()
        status_code = 200
        content_type = "text/html; charset=utf-8"
        body = ""
        redirect_url = ""

        try:
            req = urllib.request.Request(url_clean, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                status_code = resp.getcode()
                content_type = resp.headers.get('Content-Type', 'text/html')
                if resp.url != url_clean:
                    redirect_url = resp.url
                if 'text/html' in content_type.lower():
                    body = resp.read().decode('utf-8', errors='ignore')
        except urllib.error.HTTPError as e:
            status_code = e.code
        except Exception:
            status_code = 0

        response_time = round(time.time() - t0, 3)

        title = ""
        meta_desc = ""
        h1 = ""
        word_count = 0
        inlinks = 1

        if body and status_code == 200:
            parser = SimpleHTMLParser()
            try:
                parser.feed(body)
                title = parser.title.strip()
                meta_desc = parser.meta_desc.strip()
                h1 = parser.h1s[0] if parser.h1s else ""
                full_text = " ".join(parser.text_content)
                word_count = len(full_text.split())

                # Add new internal links to queue
                for href in parser.links:
                    joined = urllib.parse.urljoin(url_clean, href)
                    parsed_href = urllib.parse.urlparse(joined)
                    if parsed_href.netloc.lower() == domain and joined not in visited and joined not in queue:
                        if len(queue) < max_pages * 2:
                            queue.append(joined)
            except Exception:
                pass

        indexability = "Indexable" if status_code == 200 else "Non-Indexable"
        pixel_width = len(title) * 6

        rows.append({
            'Address': url_clean,
            'Content Type': content_type,
            'Status Code': status_code,
            'Indexability': indexability,
            'Title 1': title,
            'Title 1 Length': len(title),
            'Title 1 Pixel Width': pixel_width,
            'Meta Description 1': meta_desc,
            'Meta Description 1 Length': len(meta_desc),
            'H1-1': h1,
            'Inlinks': inlinks,
            'Redirect URL': redirect_url,
            'Word Count': word_count,
            'Response Time': response_time
        })

    return rows


# Write crawled rows to Screaming Frog CSV format
def export_crawled_csv(rows, output_path):
    fieldnames = [
        'Address', 'Content Type', 'Status Code', 'Indexability', 'Title 1',
        'Title 1 Length', 'Title 1 Pixel Width', 'Meta Description 1',
        'Meta Description 1 Length', 'H1-1', 'Inlinks', 'Redirect URL',
        'Word Count', 'Response Time'
    ]
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return output_path
