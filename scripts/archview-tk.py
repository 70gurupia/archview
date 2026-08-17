#!/usr/bin/env python3
"""
ArchView Desktop GUI (Tkinter Native Viewer) - v7.1
Visualizador e Painel de Controle Desktop Leve e Nativo para o ArchView MCP.
"""

import sys
import os
import json
import subprocess
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_DIR = os.path.join(REPO_ROOT, 'output')

class ArchViewTkApp:
    def __init__(self, root):
        self.root = root
        self.root.title("ArchView v7.1 — Desktop Intelligence & Visual Studio")
        self.root.geometry("1100x750")
        self.root.minsize(900, 600)
        self.root.configure(bg="#0F172A")

        self.setup_styles()
        self.create_header()
        self.create_tabs()
        self.create_statusbar()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')

        style.configure("TNotebook", background="#0F172A", borderwidth=0)
        style.configure("TNotebook.Tab", background="#1E293B", foreground="#94A3B8", padding=[15, 8], font=('Helvetica', 10, 'bold'))
        style.map("TNotebook.Tab", background=[("selected", "#3B82F6")], foreground=[("selected", "#FFFFFF")])

        style.configure("TFrame", background="#0F172A")
        style.configure("Card.TFrame", background="#1E293B", relief="flat")
        style.configure("TLabel", background="#0F172A", foreground="#E2E8F0", font=('Helvetica', 10))
        style.configure("Card.TLabel", background="#1E293B", foreground="#E2E8F0", font=('Helvetica', 10))
        style.configure("Title.TLabel", background="#0F172A", foreground="#FFFFFF", font=('Helvetica', 14, 'bold'))
        style.configure("Header.TLabel", background="#1E293B", foreground="#38BDF8", font=('Helvetica', 11, 'bold'))

        style.configure("TButton", background="#3B82F6", foreground="#FFFFFF", font=('Helvetica', 10, 'bold'), borderwidth=0, padding=6)
        style.map("TButton", background=[("active", "#2563EB")])

        style.configure("Accent.TButton", background="#10B981", foreground="#FFFFFF", font=('Helvetica', 10, 'bold'), padding=6)
        style.map("Accent.TButton", background=[("active", "#059669")])

        style.configure("Danger.TButton", background="#EF4444", foreground="#FFFFFF", font=('Helvetica', 10, 'bold'), padding=6)
        style.map("Danger.TButton", background=[("active", "#DC2626")])

    def create_header(self):
        header_frame = tk.Frame(self.root, bg="#1E293B", height=60)
        header_frame.pack(fill="x", side="top", padx=0, pady=0)

        title_lbl = tk.Label(header_frame, text="⚡ ArchView v7.1", bg="#1E293B", fg="#38BDF8", font=("Helvetica", 16, "bold"))
        title_lbl.pack(side="left", padx=20, pady=15)

        subtitle_lbl = tk.Label(header_frame, text="Layout Molécula/Neurônio • Linter Arquitetural • Cache AST • Diff Drift", bg="#1E293B", fg="#94A3B8", font=("Helvetica", 10))
        subtitle_lbl.pack(side="left", padx=10, pady=18)

        btn_refresh = tk.Button(header_frame, text="🔄 Recarregar Dados", bg="#334155", fg="#F8FAFC", font=("Helvetica", 9, "bold"), relief="flat", padx=12, pady=4, command=self.refresh_all)
        btn_refresh.pack(side="right", padx=20, pady=12)

    def create_tabs(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=15)

        # Tab 1: Galeria de Diagramas & Moléculas
        self.tab_diagrams = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_diagrams, text="📊 Diagramas & Moléculas")
        self.build_diagrams_tab()

        # Tab 2: Linter de Arquitetura (Fase 2)
        self.tab_linter = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_linter, text="🛡️ Linter Arquitetural")
        self.build_linter_tab()

        # Tab 3: Diff de Arquitetura (Fase 2)
        self.tab_diff = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_diff, text="🔍 Architecture Diff")
        self.build_diff_tab()

        # Tab 4: Compressor LLM (>99% Economia)
        self.tab_compress = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_compress, text="🧠 Compressor LLM")
        self.build_compress_tab()

    def build_diagrams_tab(self):
        paned = tk.PanedWindow(self.tab_diagrams, orient=tk.HORIZONTAL, bg="#0F172A", bd=0, sashwidth=4)
        paned.pack(fill="both", expand=True)

        # Painel esquerdo: Lista de arquivos
        left_frame = tk.Frame(paned, bg="#1E293B", width=320)
        paned.add(left_frame)

        lbl_list = tk.Label(left_frame, text="📁 Diagramas Gerados (output/)", bg="#1E293B", fg="#38BDF8", font=("Helvetica", 11, "bold"))
        lbl_list.pack(anchor="w", padx=15, pady=12)

        self.diagram_listbox = tk.Listbox(left_frame, bg="#0F172A", fg="#E2E8F0", font=("Consolas", 10), selectbackground="#3B82F6", bd=0, highlightthickness=0)
        self.diagram_listbox.pack(fill="both", expand=True, padx=15, pady=(0, 10))
        self.diagram_listbox.bind('<<ListboxSelect>>', self.on_diagram_selected)

        btn_open_browser = tk.Button(left_frame, text="🌐 Abrir no Navegador (HTML)", bg="#10B981", fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", pady=6, command=self.open_current_in_browser)
        btn_open_browser.pack(fill="x", padx=15, pady=10)

        # Painel direito: Preview de Código & Metadados
        right_frame = tk.Frame(paned, bg="#1E293B")
        paned.add(right_frame)

        self.meta_label = tk.Label(right_frame, text="Selecione um diagrama à esquerda para inspecionar", bg="#1E293B", fg="#94A3B8", font=("Helvetica", 10))
        self.meta_label.pack(anchor="w", padx=15, pady=12)

        self.code_text = tk.Text(right_frame, bg="#0F172A", fg="#38BDF8", font=("Consolas", 10), bd=0, highlightthickness=0, wrap="none")
        self.code_text.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        self.populate_diagram_list()

    def build_linter_tab(self):
        frame = tk.Frame(self.tab_linter, bg="#1E293B")
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        top_controls = tk.Frame(frame, bg="#1E293B")
        top_controls.pack(fill="x", padx=15, pady=12)

        tk.Label(top_controls, text="Caminho do Projeto:", bg="#1E293B", fg="#E2E8F0", font=("Helvetica", 10, "bold")).pack(side="left")
        self.linter_path_entry = tk.Entry(top_controls, bg="#0F172A", fg="#FFFFFF", font=("Helvetica", 10), width=45, bd=1, relief="solid")
        self.linter_path_entry.insert(0, REPO_ROOT)
        self.linter_path_entry.pack(side="left", padx=10)

        btn_browse = tk.Button(top_controls, text="📁 Selecionar", bg="#334155", fg="#FFFFFF", font=("Helvetica", 9), relief="flat", command=self.browse_linter_path)
        btn_browse.pack(side="left", padx=5)

        btn_run_lint = tk.Button(top_controls, text="🛡️ Executar Linter", bg="#3B82F6", fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_linter)
        btn_run_lint.pack(side="left", padx=15)

        self.linter_output = tk.Text(frame, bg="#0F172A", fg="#A7F3D0", font=("Consolas", 10), bd=0, wrap="word")
        self.linter_output.pack(fill="both", expand=True, padx=15, pady=15)

    def build_diff_tab(self):
        frame = tk.Frame(self.tab_diff, bg="#1E293B")
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        ctrl_frame = tk.Frame(frame, bg="#1E293B")
        ctrl_frame.pack(fill="x", padx=15, pady=12)

        tk.Label(ctrl_frame, text="Diretório Base (Antes):", bg="#1E293B", fg="#E2E8F0", font=("Helvetica", 10)).grid(row=0, column=0, sticky="w", pady=4)
        self.diff_before_entry = tk.Entry(ctrl_frame, bg="#0F172A", fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.diff_before_entry.insert(0, REPO_ROOT)
        self.diff_before_entry.grid(row=0, column=1, padx=10, pady=4)

        tk.Label(ctrl_frame, text="Diretório Novo (Depois):", bg="#1E293B", fg="#E2E8F0", font=("Helvetica", 10)).grid(row=1, column=0, sticky="w", pady=4)
        self.diff_after_entry = tk.Entry(ctrl_frame, bg="#0F172A", fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.diff_after_entry.insert(0, REPO_ROOT)
        self.diff_after_entry.grid(row=1, column=1, padx=10, pady=4)

        btn_run_diff = tk.Button(ctrl_frame, text="🔍 Comparar Arquiteturas", bg="#3B82F6", fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_diff)
        btn_run_diff.grid(row=0, column=2, rowspan=2, padx=15)

        self.diff_output = tk.Text(frame, bg="#0F172A", fg="#FDE047", font=("Consolas", 10), bd=0, wrap="word")
        self.diff_output.pack(fill="both", expand=True, padx=15, pady=15)

    def build_compress_tab(self):
        frame = tk.Frame(self.tab_compress, bg="#1E293B")
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        ctrl_frame = tk.Frame(frame, bg="#1E293B")
        ctrl_frame.pack(fill="x", padx=15, pady=12)

        tk.Label(ctrl_frame, text="Diretório a Comprimir:", bg="#1E293B", fg="#E2E8F0", font=("Helvetica", 10, "bold")).pack(side="left")
        self.compress_path_entry = tk.Entry(ctrl_frame, bg="#0F172A", fg="#FFFFFF", font=("Helvetica", 10), width=45)
        self.compress_path_entry.insert(0, REPO_ROOT)
        self.compress_path_entry.pack(side="left", padx=10)

        btn_compress = tk.Button(ctrl_frame, text="🧠 Gerar Resumo LLM (~2KB)", bg="#10B981", fg="#FFFFFF", font=("Helvetica", 10, "bold"), relief="flat", command=self.run_compress)
        btn_compress.pack(side="left", padx=15)

        self.compress_output = tk.Text(frame, bg="#0F172A", fg="#E0E7FF", font=("Consolas", 10), bd=0, wrap="word")
        self.compress_output.pack(fill="both", expand=True, padx=15, pady=15)

    def create_statusbar(self):
        self.statusbar = tk.Label(self.root, text="Pronto • ArchView v7.1 • Knowledge Graph SQLite WAL Ativo", bg="#0F172A", fg="#64748B", font=("Helvetica", 9), anchor="w")
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

        node_script = f"""
        import {{ executeLintArchitecture }} from './src/tools/lint-architecture.js';
        const res = executeLintArchitecture({{ path: '{target}' }});
        console.log(JSON.stringify(res, null, 2));
        """
        try:
            out = subprocess.check_output(['npx', 'tsx', '-e', node_script], cwd=REPO_ROOT, stderr=subprocess.STDOUT, text=True)
            data = json.loads(out)
            self.linter_output.delete("1.0", tk.END)
            self.linter_output.insert(tk.END, data.get('markdown', out))
            self.statusbar.config(text=f"Linter concluído: {data['summary']['errors_count']} erros, {data['summary']['warnings_count']} avisos.")
        except Exception as err:
            self.linter_output.delete("1.0", tk.END)
            self.linter_output.insert(tk.END, f"Erro ao executar linter:\n{str(err)}")

    def run_diff(self):
        before = self.diff_before_entry.get().strip() or REPO_ROOT
        after = self.diff_after_entry.get().strip() or REPO_ROOT

        self.statusbar.config(text="Calculando diff visual de arquitetura...")
        self.root.update()

        node_script = f"""
        import {{ compareTopologies }} from './src/engine/architecture-diff.js';
        import {{ scanCodebase }} from './src/engine/universal-scanner.js';
        const b = scanCodebase('{before}');
        const a = scanCodebase('{after}');
        const diff = compareTopologies(b, a);
        console.log(JSON.stringify(diff, null, 2));
        """
        try:
            out = subprocess.check_output(['npx', 'tsx', '-e', node_script], cwd=REPO_ROOT, stderr=subprocess.STDOUT, text=True)
            data = json.loads(out)
            res_text = f"=== RESUMO DO DIFF ARQUITETURAL ===\n"
            res_text += f"Novos Arquivos: {len(data['added_files'])}\n"
            res_text += f"Arquivos Modificados: {len(data['modified_files'])}\n"
            res_text += f"Arquivos Removidos: {len(data['removed_files'])}\n"
            res_text += f"Score de Drift: {data['summary']['drift_score']}\n\n"
            res_text += f"=== SINTAXE MERMAID DIFF ===\n{data['mermaid_diff']}"
            self.diff_output.delete("1.0", tk.END)
            self.diff_output.insert(tk.END, res_text)
            self.statusbar.config(text=f"Diff concluído. Score de Drift: {data['summary']['drift_score']}")
        except Exception as err:
            self.diff_output.delete("1.0", tk.END)
            self.diff_output.insert(tk.END, f"Erro ao calcular diff:\n{str(err)}")

    def run_compress(self):
        target = self.compress_path_entry.get().strip() or REPO_ROOT
        self.statusbar.config(text="Gerando resumo comprimido para IA...")
        self.root.update()

        node_script = f"""
        import {{ executeCompressForLlm }} from './src/tools/compress-llm.js';
        const res = executeCompressForLlm({{ path: '{target}' }});
        console.log(JSON.stringify(res, null, 2));
        """
        try:
            out = subprocess.check_output(['npx', 'tsx', '-e', node_script], cwd=REPO_ROOT, stderr=subprocess.STDOUT, text=True)
            data = json.loads(out)
            res_text = f"=== RESUMO ESTRUTURADO PARA LLM (Tokens: {data['estimated_tokens']}) ===\n\n"
            res_text += data.get('markdown', '') + "\n\n"
            res_text += "=== JSON ESTRUTURADO COMPACTO ===\n"
            res_text += json.dumps(data['summary'], indent=2)
            self.compress_output.delete("1.0", tk.END)
            self.compress_output.insert(tk.END, res_text)
            self.statusbar.config(text=f"Resumo gerado com sucesso ({data['estimated_tokens']} tokens).")
        except Exception as err:
            self.compress_output.delete("1.0", tk.END)
            self.compress_output.insert(tk.END, f"Erro ao comprimir:\n{str(err)}")

    def refresh_all(self):
        self.populate_diagram_list()
        self.statusbar.config(text="Lista de diagramas atualizada.")

def main():
    root = tk.Tk()
    app = ArchViewTkApp(root)
    root.mainloop()

if __name__ == '__main__':
    main()
