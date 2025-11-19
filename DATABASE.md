# 🧰 Shoe Store Inventory System – Database Design

This document explains the database structure for a **Lite ERP Inventory System** built for a shoe store.
The design focuses on simplicity, accuracy, and scalability while supporting variant-based inventory (size, color, gender) and QR-based operations.

---

# 📦 Overview

The system manages:

* Products (shoe models)
* Product Variants (size, color, gender)
* Suppliers
* Users (staff/owner)
* Stock Movements (IN, OUT, ADJ)
* QR Code identification

Stock is tracked **per variant**, not per model.

---

# 🗂 Database Structure

## 1. **products**

Represents a **shoe model** (without size or color).

| Field              | Type          | Description                         |
| ------------------ | ------------- | ----------------------------------- |
| id                 | INT           | Primary key                         |
| code               | VARCHAR(50)   | Unique model code (e.g. `SHO-0001`) |
| name               | VARCHAR(150)  | Shoe model name                     |
| brand              | VARCHAR(100)  | Brand (Adidas, Nike, etc.)          |
| category           | VARCHAR(100)  | Running, Casual, Formal, etc.       |
| description        | TEXT          | Optional                            |
| default_cost_price | DECIMAL(12,2) | Default buying price                |
| default_sell_price | DECIMAL(12,2) | Default selling price               |
| is_active          | TINYINT(1)    | Active/inactive flag                |
| created_at         | DATETIME      | Timestamp                           |
| updated_at         | DATETIME      | Timestamp                           |

### Example

Nike Air Max is a *product*, not a variant.

---

## 2. **product_variants**

Represents the **actual sellable unit**: model + size + color + gender.
Stock management happens here.

| Field       | Type                                | Description                             |
| ----------- | ----------------------------------- | --------------------------------------- |
| id          | INT                                 | Primary key                             |
| product_id  | INT                                 | FK → products.id                        |
| sku         | VARCHAR(100)                        | Unique variant code (used in labels/QR) |
| gender      | ENUM('MEN','WOMEN','UNISEX','KIDS') | Variant gender                          |
| color       | VARCHAR(50)                         | Variant color/style                     |
| size_system | ENUM('EU','UK','US','CM')           | Size system                             |
| size        | DECIMAL(4,1)                        | Shoe size (e.g. 42.0, 42.5, 8.0)        |
| current_qty | INT                                 | Real-time stock on hand                 |
| min_qty     | INT                                 | Low stock threshold                     |
| cost_price  | DECIMAL(12,2)                       | Buying price for this variant           |
| sell_price  | DECIMAL(12,2)                       | Selling price                           |
| qr_token    | VARCHAR(100)                        | Optional unique token for QR codes      |
| is_active   | TINYINT(1)                          | Active/inactive flag                    |
| created_at  | DATETIME                            | Timestamp                               |
| updated_at  | DATETIME                            | Timestamp                               |

### Unique Constraint

```sql
UNIQUE (product_id, gender, color, size_system, size)
```

This ensures no duplicate variants exist.

---

## 3. **suppliers**

Stores supplier information for stock procurement.

| Field      | Type         | Description     |
| ---------- | ------------ | --------------- |
| id         | INT          | Primary key     |
| name       | VARCHAR(150) | Supplier name   |
| contact    | VARCHAR(100) | Phone/email     |
| address    | TEXT         | Optional        |
| notes      | TEXT         | Additional info |
| created_at | DATETIME     | Timestamp       |
| updated_at | DATETIME     | Timestamp       |

---

## 4. **users**

System authentication and audit logging.

| Field      | Type                  | Description          |
| ---------- | --------------------- | -------------------- |
| id         | INT                   | Primary key          |
| name       | VARCHAR(100)          | Staff/owner name     |
| email      | VARCHAR(100)          | Login email (unique) |
| password   | VARCHAR(255)          | Hashed password      |
| role       | ENUM('admin','staff') | Permissions level    |
| created_at | DATETIME              | Timestamp            |
| updated_at | DATETIME              | Timestamp            |

---

## 5. **stock_movements**

Logs every change in stock → IN, OUT, or ADJ.
This table is the **audit trail** of the entire inventory.

| Field         | Type                   | Description                                |
| ------------- | ---------------------- | ------------------------------------------ |
| id            | INT                    | Primary key                                |
| variant_id    | INT                    | FK → product_variants.id                   |
| movement_type | ENUM('IN','OUT','ADJ') | IN = restock, OUT = sold, ADJ = correction |
| qty_change    | INT                    | Positive or negative                       |
| reason        | VARCHAR(100)           | Purchase, Sale, Damaged, etc.              |
| reference     | VARCHAR(100)           | Invoice no / unique note                   |
| supplier_id   | INT NULL               | FK → suppliers.id                          |
| user_id       | INT NULL               | FK → users.id                              |
| created_at    | DATETIME               | Timestamp                                  |
