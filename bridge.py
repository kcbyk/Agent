import sys
import http.server
import urllib.request
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
TARGET_PORT = 8000

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.proxy()

    def do_POST(self):
        self.proxy()

    def do_OPTIONS(self):
        self.proxy()

    def do_HEAD(self):
        self.proxy()

    def do_PUT(self):
        self.proxy()

    def do_DELETE(self):
        self.proxy()

    def proxy(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else None
        target_url = f'http://127.0.0.1:{TARGET_PORT}{self.path}'
        
        req_headers = {k: v for k, v in self.headers.items() if k.lower() not in ['host', 'content-length']}
        req = urllib.request.Request(target_url, data=body, headers=req_headers, method=self.command)
        
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ['transfer-encoding', 'connection']:
                        self.send_header(k, v)
                data = resp.read()
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(k, v)
            data = e.read()
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Proxy bridge error: {e}".encode())

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), BridgeHandler)
    print(f"Bridge proxy listening on 0.0.0.0:{PORT} -> 127.0.0.1:{TARGET_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
