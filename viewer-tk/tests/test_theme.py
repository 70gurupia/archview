"""
Testes de Consistência e Paleta de Cores do Tema ArchView
"""

import unittest
import re
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.theme import PALETTES, THEME

class TestTheme(unittest.TestCase):
    def test_palettes_structure(self):
        self.assertIn('dark', PALETTES)
        dark = PALETTES['dark']
        required_keys = [
            'bg_primary', 'bg_secondary', 'bg_tertiary',
            'text_primary', 'text_secondary', 'text_accent',
            'accent_primary', 'accent_success', 'accent_warning', 'accent_danger'
        ]
        for key in required_keys:
            self.assertIn(key, dark)

    def test_hex_color_validity(self):
        hex_pattern = re.compile(r'^#[0-9a-fA-F]{6}$')
        for theme_name, palette in PALETTES.items():
            for key, val in palette.items():
                self.assertTrue(
                    bool(hex_pattern.match(val)),
                    f"Cor inválida na chave {key} do tema {theme_name}: {val}"
                )

if __name__ == '__main__':
    unittest.main()
