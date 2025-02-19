CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'CANCELED'
);

CREATE TABLE payments (
    payment_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,        -- references an Order (in the Orders microservice)
    status payment_status NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
