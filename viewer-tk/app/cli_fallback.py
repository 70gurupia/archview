"""
ArchView Terminal Fallback (TUI / CLI) - Ativado quando Tkinter não está instalado.
"""

import os
import sys
import json
import webbrowser
from .bridge import REPO_ROOT, run_linter_bridge, run_diff_bridge, run_compress_bridge

OUTPUT_DIR = os.path.join(REPO_ROOT, 'output')

def print_banner():
    print("=" * 65)
    print("⚡ ArchView v7.1 — Terminal Intelligence Studio")
    print("=" * 65)
    print("ℹ️  Dica: Para abrir a interface gráfica Desktop (GUI):")
    print("   Instale o módulo nativo do Ubuntu: sudo apt install python3-tk")
    print("=" * 65)

def list_diagrams():
    print("\n📁 Diagramas disponíveis em output/:")
    if not os.path.exists(OUTPUT_DIR):
        print("  (Nenhum diretório output/ encontrado)")
        return []
    files = sorted([f for f in os.listdir(OUTPUT_DIR) if f.endswith('.html') or f.endswith('.mmd')])
    for idx, f in enumerate(files, 1):
        size_kb = os.path.getsize(os.path.join(OUTPUT_DIR, f)) / 1024
        print(f"  [{idx}] {f} ({size_kb:.1f} KB)")
    return files

def handle_open_diagram():
    files = list_diagrams()
    if not files:
        return
    try:
        sel = input("\nDigite o número do arquivo para abrir (ou Enter para voltar): ").strip()
        if sel.isdigit() and 1 <= int(sel) <= len(files):
            target = files[int(sel) - 1]
            full_path = os.path.join(OUTPUT_DIR, target)
            print(f"Abrindo {full_path} no navegador...")
            webbrowser.open(f"file://{full_path}")
    except Exception as e:
        print(f"Erro ao abrir arquivo: {e}")

def handle_linter():
    path_input = input(f"Caminho do projeto [{REPO_ROOT}]: ").strip() or REPO_ROOT
    print("\nExecutando Linter Arquitetural...")
    res = run_linter_bridge(path_input)
    print(res.get('markdown', json.dumps(res, indent=2)))

def handle_diff():
    b_path = input(f"Diretório Base (Antes) [{REPO_ROOT}]: ").strip() or REPO_ROOT
    a_path = input(f"Diretório Novo (Depois) [{REPO_ROOT}]: ").strip() or REPO_ROOT
    print("\nCalculando Diff...")
    res = run_diff_bridge(b_path, a_path)
    print(f"\nNovos Arquivos: {len(res.get('added_files', []))}")
    print(f"Modificados: {len(res.get('modified_files', []))}")
    print(f"Removidos: {len(res.get('removed_files', []))}")
    print(f"Drift Score: {res.get('summary', {}).get('drift_score', 0)}")
    print(f"\n--- Mermaid Diff ---\n{res.get('mermaid_diff', '')}")

def handle_compress():
    path_input = input(f"Caminho do projeto [{REPO_ROOT}]: ").strip() or REPO_ROOT
    print("\nComprimindo para LLM...")
    res = run_compress_bridge(path_input)
    print(f"\nTokens Estimados: {res.get('estimated_tokens', 0)}")
    print(res.get('markdown', ''))

def run_cli_mode():
    print_banner()
    actions = {
        '1': handle_open_diagram,
        '2': handle_linter,
        '3': handle_diff,
        '4': handle_compress
    }
    while True:
        print("\nEscolha uma opção:")
        print("  1. Listar e abrir diagramas HTML no navegador")
        print("  2. Executar Linter Arquitetural (lint_architecture)")
        print("  3. Executar Diff de Arquitetura (diff_architecture)")
        print("  4. Gerar Resumo Estruturado para LLM (compress_for_llm)")
        print("  0. Sair")

        try:
            choice = input("\nOpção [0-4]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nEncerrando...")
            break

        if choice == '0':
            print("Até logo!")
            break
        elif choice in actions:
            actions[choice]()
        else:
            print("Opção inválida.")
