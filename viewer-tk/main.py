#!/usr/bin/env python3
"""
ArchView Desktop Studio Launcher - v7.1
Detecta automaticamente suporte a Tkinter ou ativa o modo CLI/Terminal interativo.
"""

import sys
import os

# Adiciona o diretório viewer-tk ao sys.path para imports limpos
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

def main():
    if '--cli' in sys.argv or '--help' in sys.argv or '-h' in sys.argv:
        from app.cli_fallback import run_cli_mode
        run_cli_mode()
        return

    try:
        import tkinter as tk
        from app.ui import ArchViewTkWindow
        root = tk.Tk()
        app = ArchViewTkWindow(root)
        root.mainloop()
    except (ImportError, ModuleNotFoundError):
        print("\n⚠️  [Aviso] O módulo gráfico Tkinter não está instalado no Python do sistema.")
        print("💡 Para habilitar a interface gráfica completa (GUI Desktop), instale o pacote nativo:")
        print("   sudo apt update && sudo apt install python3-tk\n")
        print("⚡ Iniciando ArchView no modo Terminal Interativo (CLI)...\n")
        from app.cli_fallback import run_cli_mode
        run_cli_mode()

if __name__ == '__main__':
    main()
