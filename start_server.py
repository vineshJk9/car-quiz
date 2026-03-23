#!/usr/bin/env python3
"""
Simple HTTP Server for Car Quiz Website
Run this script to serve the website locally and avoid CORS issues
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Configuration
PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}/website/"
        
        print("=" * 60)
        print("🚗 Car Quiz Website Server")
        print("=" * 60)
        print(f"\n✓ Server running at: http://localhost:{PORT}")
        print(f"✓ Website URL: {url}")
        print(f"✓ Press Ctrl+C to stop the server\n")
        print("=" * 60)
        
        # Auto-open browser
        try:
            webbrowser.open(url)
            print("✓ Opening browser automatically...\n")
        except:
            print("⚠ Please open your browser manually to the URL above\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Server stopped. Goodbye!")
