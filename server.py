import http.server
import os

PORT = 3000

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean_path = super().translate_path(path)
        if not os.path.exists(clean_path):
            if os.path.exists(clean_path + '.html'):
                return clean_path + '.html'
        return clean_path

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            custom_404 = os.path.join(base_dir, '404.html')
            if os.path.exists(custom_404):
                try:
                    with open(custom_404, 'rb') as f:
                        body = f.read()
                    self.send_response(404, "Not Found")
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
                except Exception as e:
                    print(f"Error serving custom 404: {e}", flush=True)
        super().send_error(code, message, explain)

    def do_GET(self):
        # Prevent mailto: link clicks from causing 404 errors on desktop
        if 'mailto:' in self.path:
            self.send_response(204)
            self.end_headers()
            return

        if self.path == '/favicon.ico':
            self.path = '/src/image/appicon.png'
        return super().do_GET()

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('', PORT), CleanURLHandler) as httpd:
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (http://localhost:{PORT}/) ...", flush=True)
        httpd.serve_forever()
