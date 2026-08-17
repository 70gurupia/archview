"""
ArchView Tkinter - Main Window & UI Layout
"""

import os
import json
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from .theme import THEME
from .bridge import REPO_ROOT, run_linter_bridge, run_diff_bridge, run_compress_bridge

OUTPUT_DIR = os.path.join(REPO_ROOT, 'output')

class ArchViewTkWindow:
    def __init__(self, root):
        self.root = root
        self.root.title("ArchView v7.1 — Desktop Intelligence & Visual Studio")
        self.root.geometry("1150x780")
        self.root.minsize(900, 600)
        self.root.configure(bg=THEME['bg_primary'])

        self.setup_styles()
        self.create_header()
        self.create_tabs()
        self.create_statusbar()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')

        style.configure("TNotebook", background=THEME['bg_primary'], borderwidth=0)
        style.configure("TNotebook.Tab", background=THEME['bg_secondary'], foreground=THEME['text_secondary'], padding=[15, 8], font=('Helvetica', 10, 'bold'))
        style.map("TNotebook.Tab", background=[("selected", THEME['accent_primary'])], foreground=[("selected", "#FFFFFF")])

        style.configure("TFrame", background=THEME['bg_primary'])
        style.configure("TLabel", background=THEME['bg_primary'], foreground=THEME['text_primary'], font=('Helvetica', 10))

    def create_header(self):
        header_frame = tk.Frame(self.root, bg=THEME['bg_secondary'], height=60)
        header_frame.pack(fill="x", side="top")

        title_lbl = tk.Label(header_frame, text="⚡ ArchView v7.1", bg=THEME['bg_secondary'], fg=THEME['text_accent'], font=("Helvetica", 16, "bold"))
        title_lbl.pack(side="left", padx=20, pady=15)

        subtitle_lbl = tk.Label(header_frame, text="Desktop Studio • Layout Molécula • Linter Arquitetural • Cache AST • Diff Drift", bg=THEME['bg_secondary'], fg=THEME['text_secondary'], font=("Helvetica", 10))
        subtitle_lbl.pack(side="left", padx=10, pady=18)

        btn_refresh = tk.Button(header_frame, text="🔄 Recarregar", bg=THEME['bg_tertiary'], fg="#F8FAFC", font=("Helvetica", 9, "bold"), relief="flat", padx=12, pady=4, command=self.populate_diagram_list)
        btn_refresh.pack(side="right", padx=20, pady=12)

    def create_tabs(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=15)

        # Tab 1: Galeria de Diagramas
        self.tab_diagrams = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_diagrams, text="📊 Diagramas & Moléculas")
        self.build_diagrams_tab()

        # Tab 2: Linter de Arquitetura
        self.tab_linter = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_linter, text="🛡️ Linter Arquitetural")
        self.build_linter_tab()

        # Tab 3: Diff de Arquitetura
        self.tab_diff = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_diff, text="🔍 Architecture Diff")
        self.build_diff_tab()

        # Tab 4: Compressor LLM
        self.tab_compress = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_compress, text="🧠 Compressor LLM")
        self.build_compress_tab()

    def build_diagrams_tab(self):
        paned = tk.PanedWindow(self.tab_diagrams, orient=tk.HORIZONTAL, bg=THEME['bg_primary'], bd=0, sashwidth=4)
        paned.pack(fill="both", expand=True)

        left_frame = tk.Frame(paned, bg=THEME['bg_secondary'], width=320)
        paned.add(left_frame)

        tk.Label(left_frame, text="📁 Diagramas Gerados (output/)", bg=THEME['bg_secondary'], fg=THEME['text_accent'], font=("Helvetica", 11, "bold")).pack(anchor="w", padx=15, pady=12)

        self.diagram_listbox = tk.Listbox(left_frame, bg=THEME['bg_primary'], fg=THEME['text_primary'], font=("Consolas", 10), selectbackground=THEME['accent_primary'], bd=0, highlightthickness=0)
        self.diagram_listbox.pack(fill="both", expand=True, padx=15, pady=(0, 10))
        self.diagram_listbox.bind('<<ListboxSelect>>', self.on_diagram_selected)

        btn_open_browser = tk.Button(left_frame, text="🌐 Abrir no Navegador (HTML)", bg=THEME['accent_success'], fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", pady=6, command=self.open_current_in_browser)
        btn_open_browser.pack(fill="x", padx=15, pady=10)

        right_frame = tk.Frame(paned, bg=THEME['bg_secondary'])
        paned.add(right_frame)

        self.meta_label = tk.Label(right_frame, text="Selecione um diagrama à esquerda para inspecionar", bg=THEME['bg_secondary'], fg=THEME['text_secondary'], font=("Helvetica", 10))
        self.meta_label.pack(anchor="w", padx=15, pady=12)

        self.code_text = tk.Text(right_frame, bg=THEME['bg_primary'], fg=THEME['text_accent'], font=("Consolas", 10), bd=0, highlightthickness=0, wrap="none")
        self.code_text.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        self.populate_diagram_list()

    def build_linter_tab(self):
        frame = tk.Frame(self.tab_linter, bg=THEME['bg_secondary'])
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        top = tk.Frame(frame, bg=THEME['bg_secondary'])
        top.pack(fill="x", padx=15, pady=12)

        tk.Label(top, text="Caminho do Projeto:", bg=THEME['bg_secondary'], fg=THEME['text_primary'], font=("Helvetica", 10, "bold")).pack(side="left")
        self.linter_path_entry = tk.Entry(top, bg=THEME['bg_primary'], fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.linter_path_entry.insert(0, REPO_ROOT)
        self.linter_path_entry.pack(side="left", padx=10)

        btn_browse = tk.Button(top, text="📁 Selecionar", bg=THEME['bg_tertiary'], fg="#FFFFFF", font=("Helvetica", 9), relief="flat", command=self.browse_linter_path)
        btn_browse.pack(side="left", padx=5)

        btn_run = tk.Button(top, text="🛡️ Executar Linter", bg=THEME['accent_primary'], fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_linter)
        btn_run.pack(side="left", padx=15)

        self.linter_output = tk.Text(frame, bg=THEME['bg_primary'], fg="#A7F3D0", font=("Consolas", 10), bd=0, wrap="word")
        self.linter_output.pack(fill="both", expand=True, padx=15, pady=15)

    def build_diff_tab(self):
        frame = tk.Frame(self.tab_diff, bg=THEME['bg_secondary'])
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        ctrl = tk.Frame(frame, bg=THEME['bg_secondary'])
        ctrl.pack(fill="x", padx=15, pady=12)

        tk.Label(ctrl, text="Diretório Base (Antes):", bg=THEME['bg_secondary'], fg=THEME['text_primary'], font=("Helvetica", 10)).grid(row=0, column=0, sticky="w", pady=4)
        self.diff_before_entry = tk.Entry(ctrl, bg=THEME['bg_primary'], fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.diff_before_entry.insert(0, REPO_ROOT)
        self.diff_before_entry.grid(row=0, column=1, padx=10, pady=4)

        tk.Label(ctrl, text="Diretório Novo (Depois):", bg=THEME['bg_secondary'], fg=THEME['text_primary'], font=("Helvetica", 10)).grid(row=1, column=0, sticky="w", pady=4)
        self.diff_after_entry = tk.Entry(ctrl, bg=THEME['bg_primary'], fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.diff_after_entry.insert(0, REPO_ROOT)
        self.diff_after_entry.grid(row=1, column=1, padx=10, pady=4)

        btn_diff = tk.Button(ctrl, text="🔍 Comparar Arquiteturas", bg=THEME['accent_primary'], fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_diff)
        btn_diff.grid(row=0, column=2, rowspan=2, padx=15)

        self.diff_output = tk.Text(frame, bg=THEME['bg_primary'], fg="#FDE047", font=("Consolas", 10), bd=0, wrap="word")
        self.diff_output.pack(fill="both", expand=True, padx=15, pady=15)

    def build_compress_tab(self):
        frame = tk.Frame(self.tab_compress, bg=THEME['bg_secondary'])
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        ctrl = tk.Frame(frame, bg=THEME['bg_secondary'])
        ctrl.pack(fill="x", padx=15, pady=12)

        tk.Label(ctrl, text="Diretório a Comprimir:", bg=THEME['bg_secondary'], fg=THEME['text_primary'], font=("Helvetica", 10, "bold")).pack(side="left")
        self.compress_path_entry = tk.Entry(ctrl, bg=THEME['bg_primary'], fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.compress_path_entry.insert(0, REPO_ROOT)
        self.compress_path_entry.pack(side="left", padx=10)

        btn_comp = tk.Button(ctrl, text="🧠 Gerar Resumo LLM (~2KB)", bg=THEME['accent_success'], fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_compress)
        btn_comp.pack(side="left", padx=15)

        self.compress_output = tk.Text(frame, bg=THEME['bg_primary'], fg="#E0E7FF", font=("Consolas", 10), bd=0, wrap="word")
        self.compress_output.pack(fill="both", expand=True, padx=15, pady=15)

    def create_statusbar(self):
        self.statusbar = tk.Label(self.root, text="Pronto • ArchView v7.1 • Knowledge Graph SQLite WAL Ativo", bg=THEME['bg_primary'], fg=THEME['text_secondary'], font=("Helvetica", 9), anchor="w")
        self.statusbar.pack(side="bottom", fill="x", padx=15, pady=4)

    def populate_diagram_list(self):
        self.diagram_listbox.delete(0, tk.END)
        if not os.path.exists(OUTPUT_DIR):
            return

        files = sorted(os.listdir(OUTPUT_DIR))
        for f in files:
            if f.endswith('.mmd') or f.endswith('.html'):
                self.diagram_listbox.insert(tk.END, f)

    def on_diagram_selected(self, event):
        sel = self.diagram_listbox.curselection()
        if not sel:
            return

        filename = self.diagram_listbox.get(sel[0])
        filepath = os.path.join(OUTPUT_DIR, filename)

        if not os.path.exists(filepath):
            return

        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        size_kb = len(content) / 1024
        self.meta_label.config(text=f"📄 {filename} ({size_kb:.1f} KB) • Caminho: {filepath}")

        self.code_text.delete("1.0", tk.END)
        self.code_text.insert(tk.END, content[:50000])

    def open_current_in_browser(self):
        sel = self.diagram_listbox.curselection()
        if not sel:
            messagebox.showinfo("Aviso", "Selecione um arquivo da lista primeiro.")
            return

        filename = self.diagram_listbox.get(sel[0])
        html_file = filename.replace('.mmd', '.html')
        html_path = os.path.join(OUTPUT_DIR, html_file)

        if not os.path.exists(html_path):
            html_path = os.path.join(OUTPUT_DIR, "archview-dashboard.html")

        if os.path.exists(html_path):
            webbrowser.open(f"file://{html_path}")
        else:
            messagebox.showerror("Erro", f"Arquivo HTML não encontrado: {html_path}")

    def browse_linter_path(self):
        path = filedialog.askdirectory(initialdir=REPO_ROOT)
        if path:
            self.linter_path_entry.delete(0, tk.END)
            self.linter_path_entry.insert(0, path)

    def run_linter(self):
        target = self.linter_path_entry.get().strip() or REPO_ROOT
        self.statusbar.config(text="Executando linter arquitetural...")
        self.root.update()

        data = run_linter_bridge(target)
        if 'error' in data and not data.get('success', False):
            self.linter_output.delete("1.0", tk.END)
            self.linter_output.insert(tk.END, f"Erro ao executar linter:\n{data['error']}")
            return

        self.linter_output.delete("1.0", tk.END)
        self.linter_output.insert(tk.END, data.get('markdown', json.dumps(data, indent=2)))
        summary = data.get('summary', {})
        self.statusbar.config(text=f"Linter concluído: {summary.get('errors_count', 0)} erros, {summary.get('warnings_count', 0)} avisos.")

    def run_diff(self):
        before = self.diff_before_entry.get().strip() or REPO_ROOT
        after = self.diff_after_entry.get().strip() or REPO_ROOT

        self.statusbar.config(text="Calculando diff visual de arquitetura...")
        self.root.update()

        data = run_diff_bridge(before, after)
        if 'error' in data and not data.get('added_files'):
            self.diff_output.delete("1.0", tk.END)
            self.diff_output.insert(tk.END, f"Erro ao calcular diff:\n{data['error']}")
            return

        res_text = f"=== RESUMO DO DIFF ARQUITETURAL ===\n"
        res_text += f"Novos Arquivos: {len(data.get('added_files', []))}\n"
        res_text += f"Arquivos Modificados: {len(data.get('modified_files', []))}\n"
        res_text += f"Arquivos Removidos: {len(data.get('removed_files', []))}\n"
        summary = data.get('summary', {})
        res_text += f"Score de Drift: {summary.get('drift_score', 0)}\n\n"
        res_text += f"=== SINTAXE MERMAID DIFF ===\n{data.get('mermaid_diff', '')}"

        self.diff_output.delete("1.0", tk.END)
        self.diff_output.insert(tk.END, res_text)
        self.statusbar.config(text=f"Diff concluído. Score de Drift: {summary.get('drift_score', 0)}")

    def run_compress(self):
        target = self.compress_path_entry.get().strip() or REPO_ROOT
        self.statusbar.config(text="Gerando resumo comprimido para IA...")
        self.root.update()

        data = run_compress_bridge(target)
        if 'error' in data and not data.get('summary'):
            self.compress_output.delete("1.0", tk.END)
            self.compress_output.insert(tk.END, f"Erro ao comprimir:\n{data['error']}")
            return

        res_text = f"=== RESUMO ESTRUTURADO PARA LLM (Tokens: {data.get('estimated_tokens', 0)}) ===\n\n"
        res_text += data.get('markdown', '') + "\n\n"
        res_text += "=== JSON ESTRUTURADO COMPACTO ===\n"
        res_text += json.dumps(data.get('summary', {}), indent=2)

        self.compress_output.delete("1.0", tk.END)
        self.compress_output.insert(tk.END, res_text)
        self.statusbar.config(text=f"Resumo gerado com sucesso ({data.get('estimated_tokens', 0)} tokens).")
