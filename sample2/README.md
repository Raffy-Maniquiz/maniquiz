# Pocket Shop

A local iPhone inventory app with role-based access and JSON text-file storage.

## Run

```sh
python3 server.py
```

Open http://127.0.0.1:8000. The app creates `data/shop-data.json` on first start and saves inventory changes there. Stop the server with Ctrl+C.

## Demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Staff | `staff` | `staff123` |
| Customer | `customer` | `customer123` |

Admins can view, create, update, and delete products. Staff can view, create, and update products. Customers can view products. Demo passwords are for local evaluation only; change them before using this outside a local project.
