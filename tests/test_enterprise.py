import tempfile
import unittest
from pathlib import Path

from seo.db import get_audit_history, get_latest_audit, init_db, save_audit
from seo.ratelimit import IPRateLimiter, get_client_ip


class TestEnterpriseFeatures(unittest.TestCase):
    def test_sqlite_persistence(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            test_db = Path(tmpdir) / "test_audits.db"
            init_db(test_db)

            # Initially empty
            self.assertIsNone(get_latest_audit(test_db))

            # Save an audit run
            run_data = {
                "site": "enterprise-example.com",
                "urls": 42,
                "health_score": 88,
                "status": "done",
                "summary": {"total_issues": 3, "by_severity": {"High": 0, "Medium": 2, "Low": 1}},
                "score_breakdown": {"score": 88, "deductions": []},
                "issues": [{"type": "title_too_long", "count": 2}],
                "fixes": {"titles": [{"url": "https://enterprise-example.com", "new": "Optimized Title"}]},
                "recommendations": ["Fix titles"]
            }
            audit_id = save_audit(run_data, test_db)
            self.assertGreater(audit_id, 0)

            # Verify latest audit retrieval
            latest = get_latest_audit(test_db)
            self.assertIsNotNone(latest)
            self.assertEqual(latest["site"], "enterprise-example.com")
            self.assertEqual(latest["health_score"], 88)
            self.assertEqual(latest["urls_crawled"], 42)

            # Verify history retrieval
            history = get_audit_history(limit=10, db_path=test_db)
            self.assertEqual(len(history), 1)
            self.assertEqual(history[0]["site"], "enterprise-example.com")

    def test_ip_rate_limiter(self):
        limiter = IPRateLimiter()
        # Custom rule for test: 3 requests per 2 seconds
        limiter.rules["test"] = (3, 2)

        ip = "192.0.2.1"
        self.assertTrue(limiter.check(ip, "test")[0])
        self.assertTrue(limiter.check(ip, "test")[0])
        self.assertTrue(limiter.check(ip, "test")[0])

        # 4th request must be blocked
        allowed, retry_after, _ = limiter.check(ip, "test")
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)

    def test_client_ip_extraction(self):
        # Cloudflare header
        headers_cf = {"CF-Connecting-IP": "203.0.113.19"}
        self.assertEqual(get_client_ip(headers_cf), "203.0.113.19")

        # X-Forwarded-For (reverse proxy)
        headers_xff = {"X-Forwarded-For": "198.51.100.25, 10.0.0.1"}
        self.assertEqual(get_client_ip(headers_xff), "198.51.100.25")


if __name__ == "__main__":
    unittest.main()
