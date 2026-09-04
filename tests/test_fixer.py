import unittest
import pandas as pd
from agents.fixer import (
    _is_valid_title,
    _trim_title,
    _restore_acronyms,
    _fallback_title,
    generate_redirect_map,
    generate_valid_title
)

class TestFixer(unittest.TestCase):
    def test_is_valid_title(self):
        self.assertTrue(_is_valid_title("About Us | Example Site"))
        self.assertFalse(_is_valid_title("Short"))  # <= 10 chars
        self.assertFalse(_is_valid_title("This title is extremely long and will far exceed sixty characters limit and pixel limit")) # > 60 chars

    def test_trim_title(self):
        long_title = "This is a very long title that definitely exceeds the sixty character maximum limit for SEO titles"
        trimmed = _trim_title(long_title, max_chars=60)
        self.assertLessEqual(len(trimmed), 60)

    def test_restore_acronyms(self):
        title = "Best Seo Tools and Ai Api Integration"
        restored = _restore_acronyms(title)
        self.assertEqual(restored, "Best SEO Tools and AI API Integration")

    def test_fallback_title(self):
        title1 = _fallback_title("https://example.com/about-us", site_name="Acme Inc", h1="About Our Company")
        self.assertIn("About Our Company", title1)

        title2 = _fallback_title("https://example.com/contact_us", site_name="Acme Inc", h1="")
        self.assertIn("Contact Us", title2)

    def test_generate_redirect_map(self):
        data = {
            'Address': [
                'https://example.com/blog/old-post-2020',
                'https://example.com/blog/new-post-2020',
                'https://example.com/services'
            ],
            'Status Code': [404, 200, 200]
        }
        df = pd.DataFrame(data)
        redirects = generate_redirect_map(df, max_redirects=10)
        self.assertEqual(len(redirects), 1)
        self.assertEqual(redirects[0]['from'], 'https://example.com/blog/old-post-2020')
        self.assertEqual(redirects[0]['to'], 'https://example.com/blog/new-post-2020')

if __name__ == '__main__':
    unittest.main()
