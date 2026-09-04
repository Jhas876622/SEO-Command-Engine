import unittest
from seo.crawler import SimpleHTMLParser, export_crawled_csv
import os
import tempfile

class TestCrawler(unittest.TestCase):
    def test_simple_html_parser(self):
        sample_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Page Title</title>
            <meta name="description" content="This is a test meta description for SEO testing.">
        </head>
        <body>
            <h1>Main Heading Title</h1>
            <p>Welcome to our test page with some sample words.</p>
            <a href="/about">About Us</a>
            <a href="https://example.com/contact">Contact Us</a>
        </body>
        </html>
        """
        parser = SimpleHTMLParser()
        parser.feed(sample_html)
        self.assertEqual(parser.title.strip(), "Test Page Title")
        self.assertEqual(parser.meta_desc.strip(), "This is a test meta description for SEO testing.")
        self.assertEqual(parser.h1s[0], "Main Heading Title")
        self.assertIn("/about", parser.links)

    def test_export_crawled_csv(self):
        rows = [{
            'Address': 'https://example.com/',
            'Content Type': 'text/html',
            'Status Code': 200,
            'Indexability': 'Indexable',
            'Title 1': 'Home',
            'Title 1 Length': 4,
            'Title 1 Pixel Width': 24,
            'Meta Description 1': 'Meta',
            'Meta Description 1 Length': 4,
            'H1-1': 'Home H1',
            'Inlinks': 1,
            'Redirect URL': '',
            'Word Count': 100,
            'Response Time': 0.1
        }]
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "internal_all.csv")
            export_crawled_csv(rows, csv_path)
            self.assertTrue(os.path.exists(csv_path))

if __name__ == '__main__':
    unittest.main()
