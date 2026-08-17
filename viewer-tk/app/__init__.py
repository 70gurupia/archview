"""
ArchView Tkinter App Package
"""

def get_window_class():
    from .ui import ArchViewTkWindow
    return ArchViewTkWindow

__all__ = ['get_window_class']
