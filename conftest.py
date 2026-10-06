import sys
import os

# Add workspace root and backend directory to sys.path for pytest module resolution
root_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))
