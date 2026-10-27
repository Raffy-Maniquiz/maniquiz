import hashlib
import hmac
import json
import os
import secrets
import threading
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "shop-data.json"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
PASSWORD_ROUNDS = 240_000
store_lock = threading.RLock()
sessions = {}


def password_digest(password, salt):
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ROUNDS
    ).hex()


def make_user(user_id, name, username, role, password):
    salt = secrets.token_bytes(16)
    return {
        "id": user_id,
        "name": name,
        "username": username,
        "role": role,
        "salt": salt.hex(),
        "password_hash": password_digest(password, salt),
    }


def save_store(store):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = DATA_FILE.with_suffix(".tmp")
    temporary_file.write_text(json.dumps(store, indent=2) + "\n", encoding="utf-8")
    temporary_file.replace(DATA_FILE)


def initial_store():
    return {
        "users": [
            make_user("u-admin", "Avery Admin", "admin", "admin", "admin123"),
            make_user("u-staff", "Sam Staff", "staff", "staff", "staff123"),
            make_user("u-customer", "Casey Customer", "customer", "customer", "customer123"),
        ],
        "products": [
            {"id": "p-1001", "sku": "IP16PM-256-NAT", "model": "iPhone 16 Pro Max", "storage": "256 GB", "color": "Natural Titanium", "price": 1199.00, "stock": 8},
            {"id": "p-1002", "sku": "IP16P-128-DES", "model": "iPhone 16 Pro", "storage": "128 GB", "color": "Desert Titanium", "price": 999.00, "stock": 14},
            {"id": "p-1003", "sku": "IP16-128-ULT", "model": "iPhone 16", "storage": "128 GB", "color": "Ultramarine", "price": 799.00, "stock": 3},
            {"id": "p-1004", "sku": "IP15-128-BLK", "model": "iPhone 15", "storage": "128 GB", "color": "Black", "price": 699.00, "stock": 0},
            {"id": "p-1005", "sku": "IPSE3-64-RED", "model": "iPhone SE (3rd gen)", "storage": "64 GB", "color": "Red", "price": 249.00, "stock": 6},
        ],
    }


def load_store():
    with store_lock:
        if not DATA_FILE.exists():
            store = initial_store()
            save_store(store)
            return store
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def public_user(user):
    return {key: user[key] for key in ("id", "name", "username", "role")}


def clean_product(payload):
    if not isinstance(payload, dict):
        raise ValueError("Product details must be an object.")

    fields = {}
    for key in ("sku", "model", "storage", "color"):
        value = str(payload.get(key, "")).strip()
        if not value or len(value) > 80:
            raise ValueError(f"Enter a valid {key} (1 to 80 characters).")
        fields[key] = value

    try:
        price = float(payload.get("price"))
        stock = int(payload.get("stock"))
    except (TypeError, ValueError):
        raise ValueError("Price and stock must be valid numbers.") from None

    if not (0 < price <= 100000):
        raise ValueError("Price must be greater than 0 and no more than 100,000.")
    if stock < 0 or stock > 1000000:
        raise ValueError("Stock must be between 0 and 1,000,000.")
    fields["price"] = round(price, 2)
    fields["stock"] = stock
    return fields


class ShopHandler(BaseHTTPRequestHandler):
    server_version = "PocketShop/1.0"

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")

    def send_json(self, status, data, headers=None):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if headers:
            for name, value in headers.items():
                self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 1_000_000:
                raise ValueError("Request body is empty or too large.")
            return json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("Request body must be valid JSON.") from None

    def current_user(self):
        cookie = SimpleCookie()
        cookie.load(self.headers.get("Cookie", ""))
        morsel = cookie.get("session")
        token = morsel.value if morsel else ""
        return sessions.get(token)

    def require_user(self):
        user = self.current_user()
        if not user:
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Please log in to continue."})
            return None
        return user

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/":
            html = (ROOT / "index.html").read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(html)
            return

        if path == "/api/session":
            user = self.current_user()
            self.send_json(HTTPStatus.OK, {"user": public_user(user) if user else None})
            return

        if path == "/api/products":
            if not self.require_user():
                return
            with store_lock:
                products = load_store()["products"]
            self.send_json(HTTPStatus.OK, {"products": products})
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def do_POST(self):
        path = urlsplit(self.path).path
        try:
            payload = self.read_json()
        except ValueError as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return

        if path == "/api/login":
            username = str(payload.get("username", "")).strip().lower()
            password = str(payload.get("password", ""))
            with store_lock:
                store = load_store()
                user = next((item for item in store["users"] if item["username"] == username), None)
            valid = False
            if user:
                expected = password_digest(password, bytes.fromhex(user["salt"]))
                valid = hmac.compare_digest(expected, user["password_hash"])
            if not valid:
                self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Username or password is incorrect."})
                return
            token = secrets.token_urlsafe(32)
            sessions[token] = public_user(user)
            self.send_json(
                HTTPStatus.OK,
                {"user": public_user(user)},
                {"Set-Cookie": f"session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200"},
            )
            return

        if path == "/api/logout":
            cookie = SimpleCookie()
            cookie.load(self.headers.get("Cookie", ""))
            morsel = cookie.get("session")
            if morsel:
                sessions.pop(morsel.value, None)
            self.send_json(
                HTTPStatus.OK,
                {"ok": True},
                {"Set-Cookie": "session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"},
            )
            return

        if path == "/api/products":
            user = self.require_user()
            if not user:
                return
            if user["role"] not in ("admin", "staff"):
                self.send_json(HTTPStatus.FORBIDDEN, {"error": "Customers have view-only access."})
                return
            try:
                product = clean_product(payload)
                with store_lock:
                    store = load_store()
                    if any(item["sku"].lower() == product["sku"].lower() for item in store["products"]):
                        raise ValueError("That SKU is already in use.")
                    product["id"] = f"p-{secrets.token_hex(5)}"
                    store["products"].append(product)
                    save_store(store)
            except ValueError as error:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
                return
            self.send_json(HTTPStatus.CREATED, {"product": product})
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def do_PUT(self):
        path = urlsplit(self.path).path
        if not path.startswith("/api/products/"):
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        user = self.require_user()
        if not user:
            return
        if user["role"] not in ("admin", "staff"):
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "Customers have view-only access."})
            return
        try:
            payload = self.read_json()
            product = clean_product(payload)
        except ValueError as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return

        product_id = path.removeprefix("/api/products/")
        with store_lock:
            store = load_store()
            existing = next((item for item in store["products"] if item["id"] == product_id), None)
            if not existing:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Product not found."})
                return
            if any(item["id"] != product_id and item["sku"].lower() == product["sku"].lower() for item in store["products"]):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "That SKU is already in use."})
                return
            product["id"] = product_id
            store["products"] = [product if item["id"] == product_id else item for item in store["products"]]
            save_store(store)
        self.send_json(HTTPStatus.OK, {"product": product})

    def do_DELETE(self):
        path = urlsplit(self.path).path
        if not path.startswith("/api/products/"):
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        user = self.require_user()
        if not user:
            return
        if user["role"] != "admin":
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "Only admins can delete products."})
            return

        product_id = path.removeprefix("/api/products/")
        with store_lock:
            store = load_store()
            products = store["products"]
            if not any(item["id"] == product_id for item in products):
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Product not found."})
                return
            store["products"] = [item for item in products if item["id"] != product_id]
            save_store(store)
        self.send_json(HTTPStatus.OK, {"ok": True})


def main():
    load_store()
    server = ThreadingHTTPServer((HOST, PORT), ShopHandler)
    print(f"Pocket Shop running at http://{HOST}:{PORT}")
    print(f"Text-file database: {DATA_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
