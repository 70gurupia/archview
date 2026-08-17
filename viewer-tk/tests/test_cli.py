"""
Testes Unitários do Modo Terminal Fallback do ArchView
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.cli_fallback import list_diagrams, OUTPUT_DIR

class TestCliFallback(unittest.TestCase):
    def test_output_dir_exists(self):
        self.assertTrue(os.path.exists(OUTPUT_DIR))

    def test_list_diagrams(self):
        diagrams = list_diagrams()
        self.assertIsInstance(diagrams, list)
        self.assertGreater(len(diagrams), 0)
        has_dashboard = any('archview-dashboard.html' in d for d in diagrams)
        self.assertTrue(has_dashboard, "archview-dashboard.html deve estar presente na lista")

if __name__ == '__main__':
    unittest.main()
