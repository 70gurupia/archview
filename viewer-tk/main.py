#!/usr/bin/env python3
"""
ArchView Desktop GUI Launcher - v7.1
"""

import sys
import tkinter as tk
from app.ui import ArchViewTkWindow

def main():
    root = tk.Tk()
    app = ArchViewTkWindow(root)
    root.mainloop()

if __name__ == '__main__':
    main()
