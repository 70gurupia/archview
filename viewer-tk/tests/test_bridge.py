"""
Testes Unitários da Bridge Node.js/MCP do ArchView Tk
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.bridge import REPO_ROOT, run_node_eval, run_linter_bridge, run_diff_bridge, run_compress_bridge

class TestBridge(unittest.TestCase):
    def test_repo_root_exists(self):
        self.assertTrue(os.path.exists(REPO_ROOT))
        self.assertTrue(os.path.exists(os.path.join(REPO_ROOT, 'package.json')))

    def test_run_node_eval_simple(self):
        res = run_node_eval("console.log(JSON.stringify({ test: 'ok', value: 42 }));")
        self.assertEqual(res.get('test'), 'ok')
        self.assertEqual(res.get('value'), 42)

    def test_run_linter_bridge(self):
        res = run_linter_bridge(REPO_ROOT)
        self.assertIn('summary', res)
        self.assertIn('errors_count', res['summary'])
        self.assertIn('warnings_count', res['summary'])
        self.assertIn('markdown', res)

    def test_run_diff_bridge(self):
        res = run_diff_bridge(REPO_ROOT, REPO_ROOT)
        self.assertIn('added_files', res)
        self.assertIn('modified_files', res)
        self.assertIn('removed_files', res)
        self.assertIn('summary', res)
        self.assertIn('drift_score', res['summary'])
        self.assertEqual(res['summary']['drift_score'], 0)

    def test_run_compress_bridge(self):
        res = run_compress_bridge(REPO_ROOT)
        self.assertIn('summary', res)
        self.assertIn('estimated_tokens', res)
        self.assertGreater(res['estimated_tokens'], 0)
        self.assertIn('markdown', res)

if __name__ == '__main__':
    unittest.main()
