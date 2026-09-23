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

    def do_GET(self):
        if self.path == '/favicon.ico':
            self.path = '/src/image/appicon.png'
        return super().do_GET()

if __name__ == '__main__':
    http.server.test(HandlerClass=CleanURLHandler, port=PORT, bind=None)
