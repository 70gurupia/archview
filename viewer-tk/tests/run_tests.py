#!/usr/bin/env python3
"""
Bateria Oficial de Testes do Módulo Desktop ArchView (viewer-tk)
"""

import unittest
import sys
import os

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(TEST_DIR, '..')))

def run_all_tk_tests():
    print("\n🧪 === [ArchView viewer-tk] Executando Bateria de Testes do Módulo Desktop ===")
    loader = unittest.TestLoader()
    suite = loader.discover(TEST_DIR, pattern='test_*.py')

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        print(f"\n🎉 [viewer-tk] Todos os {result.testsRun} testes passaram com 100% de sucesso!\n")
        return 0
    else:
        print(f"\n❌ [viewer-tk] Falhas detectadas: {len(result.failures)} falhas, {len(result.errors)} erros.\n")
        return 1

if __name__ == '__main__':
    exit_code = run_all_tk_tests()
    sys.exit(exit_code)
