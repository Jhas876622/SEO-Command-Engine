import unittest
import pandas as pd
from agents.detector import detect_all, get_indexable_html

class TestDetector(unittest.TestCase):
    def setUp(self):
        # Create a sample DataFrame matching Screaming Frog column layout
        self.sample_data = {
            'Address': [
                'https://example.com/',
                'https://example.com/about',
                'https://example.com/services',
                'https://example.com/broken',
                'https://example.com/redirect',
                'https://example.com/slow',
                'https://example.com/robots.txt',
                'https://example.com/sitemap.xml',
            ],
            'Content Type': [
                'text/html; charset=utf-8',
                'text/html; charset=utf-8',
                'text/html; charset=utf-8',
                'text/html; charset=utf-8',
                'text/html; charset=utf-8',
                'text/html; charset=utf-8',
                'text/plain',
                'application/xml'
            ],
            'Status Code': [200, 200, 200, 404, 301, 200, 404, 500],
            'Indexability': ['Indexable', 'Indexable', 'Indexable', 'Non-Indexable', 'Non-Indexable', 'Indexable', 'Non-Indexable', 'Non-Indexable'],
            'Title 1': [
                'Home - Example',
                'Home - Example',  # Duplicate title
                '',                # Missing title
                'Broken Page',
                'Redirect Page',
                'Very Long Title That Spans Over Sixty Characters To Trigger Title Too Long Detection Rule',
                'robots.txt',
                'sitemap.xml'
            ],
            'Title 1 Length': [14, 14, 0, 11, 13, 89, 10, 11],
            'Title 1 Pixel Width': [100, 100, 0, 80, 90, 620, 60, 66],
            'Meta Description 1': ['Home meta', '', 'Services meta', '', '', 'Slow page meta', '', ''],
            'Meta Description 1 Length': [9, 0, 13, 0, 0, 14, 0, 0],
            'H1-1': ['Welcome Home', '', 'Services', '404 Not Found', '', 'Slow Page', '', ''],
            'Inlinks': [10, 5, 0, 2, 1, 3, 0, 0],  # /services has Inlinks = 0 (Orphan page)
            'Redirect URL': ['', '', '', '', 'https://example.com/new-location', '', '', ''],
            'Word Count': [500, 400, 150, 50, 0, 600, 0, 0],  # /services has Word Count < 200 (Thin content)
            'Response Time': [0.2, 0.4, 0.3, 0.1, 0.1, 4.5, 0.05, 0.05],  # /slow has Response Time > 3.0 (Slow page)
            'Images Without Alt': [0, 4, 0, 0, 0, 0, 0, 0],  # /about has missing image alt text
            'Canonical Link Element 1': ['https://example.com/', 'https://example.com/wrong-canonical', '', '', '', '', '', '']
        }
        self.df = pd.DataFrame(self.sample_data)

    def test_get_indexable_html(self):
        idx = get_indexable_html(self.df)
        self.assertEqual(len(idx), 4)  # 200 Status Code + Indexable + text/html

    def test_detect_all_issues(self):
        issues = detect_all(self.df)
        issue_types = {issue['type']: issue['count'] for issue in issues}

        self.assertIn('missing_title', issue_types)
        self.assertEqual(issue_types['missing_title'], 1)

        self.assertIn('duplicate_title', issue_types)
        self.assertEqual(issue_types['duplicate_title'], 2)

        self.assertIn('broken_link', issue_types)
        self.assertEqual(issue_types['broken_link'], 2)

        self.assertIn('title_too_long', issue_types)
        self.assertEqual(issue_types['title_too_long'], 1)

        self.assertIn('missing_meta_description', issue_types)
        self.assertEqual(issue_types['missing_meta_description'], 1)

        self.assertIn('orphan_page', issue_types)
        self.assertEqual(issue_types['orphan_page'], 1)

        self.assertIn('thin_content', issue_types)
        self.assertEqual(issue_types['thin_content'], 1)

        self.assertIn('slow_page', issue_types)
        self.assertEqual(issue_types['slow_page'], 1)

        # New SEO detectors assertions
        self.assertIn('missing_image_alt', issue_types)
        self.assertEqual(issue_types['missing_image_alt'], 1)

        self.assertIn('missing_robots_txt', issue_types)
        self.assertEqual(issue_types['missing_robots_txt'], 1)

        self.assertIn('missing_sitemap_xml', issue_types)
        self.assertEqual(issue_types['missing_sitemap_xml'], 1)

        self.assertIn('canonical_mismatch', issue_types)
        self.assertEqual(issue_types['canonical_mismatch'], 1)

if __name__ == '__main__':
    unittest.main()
