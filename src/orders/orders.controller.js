const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// checking if order exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const order = orders.find((order) => order.id === orderId);

    if (order === undefined) {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}`,
        });
    } else {
        res.locals.order = order;
        res.locals.orderId = orderId;
        next();
    }
}

// order contains all data properties
function validateBody(req, res, next) {
    const data = req.body.data;

    if (!data) {
        return next({ status: 400, message: `A 'data' property is required.` });
    }

    const properties = ["deliverTo", "mobileNumber", "dishes"];

    for (property of properties) {
        if (
            !data.hasOwnProperty(property) ||
            data[property] === "" ||
            data[property] === null
        ) {
            if (property === "dishes") {
                return next({ status: 400, message: `Order must include a dish` });
            } else {
                return next({
                    status: 400,
                    message: `Order must include a ${property}`,
                });
            }
        }
    }


    const dishes = data.dishes;
    if (!Array.isArray(dishes) || dishes.length === 0) {
        return next({
            status: 400,
            message: "Order must include at least one dish",
        });
    }


    for (dish of dishes) {
        const index = dishes.indexOf(dish);

        if (
            !Number.isInteger(dish.quantity) ||
            dish.quantity <= 0 ||
            dish.quantity === undefined
        ) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
        }
    }
    res.locals.orderData = data;
    return next();
}

// order status
function validateStatus(req, res, next) {
    const order = res.locals.order;
    if (req.method === "DELETE") {
        if (order.status !== "pending") {
            return next({
                status: 400,
                message: "An order cannot be deleted unless it is pending",
            });
        } else {
            return next();
        }
    }

    const status = req.body.data.status;
    const validStatuses = [
        "pending",
        "preparing",
        "out-for-delivery",
        "delivered",
    ];

    if (
        !status ||
        status === undefined ||
        status === "" ||
        !validStatuses.includes(status)
    ) {
        return next({
            status: 400,
            message:
                "Order must have a status of pending, preparing, out-for-delivery, delivered",
        });
    }

    if (status === "delivered") {
        return next({
            status: 400,
            message: "A delivered order cannot be changed",
        });
    }
    return next();
}

// find order by id
function findOrder(req, res, next) {
    const id = req.body.data.id;
    const orderId = res.locals.orderId;

    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
        });
    }
    return next();
}

// create
function create(req, res) {
    const order = res.locals.orderData;

    const newOrder = {
        id: nextId(),
        deliverTo: order.deliverTo,
        mobileNumber: order.mobileNumber,
        dishes: order.dishes,
    };

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

// read
function read(req, res) {
    const foundOrder = res.locals.order;
    res.status(200).json({ data: foundOrder });
}

// update
function update(req, res) {
    const orderData = res.locals.orderData;

    const updatedOrder = {
        ...res.locals.order,
        id: res.locals.orderId,
        deliverTo: orderData.deliverTo,
        mobileNumber: orderData.mobileNumber,
        dishes: orderData.dishes,
    };

    const originalOrder = res.locals.order;
    const index = orders.findIndex((order) => originalOrder.id === order.id);

    orders[index] = updatedOrder;
    console.log("orders[index]", orders[index]);
    res.status(200).json({ data: updatedOrder });
}

// delete
function destroy(req, res, next) {
    orders.splice(orders.indexOf(res.locals.order), 1);
    res.sendStatus(204);
}

// list
function list(req, res) {
    res.status(200).json({ data: orders });
}

module.exports = {
    list,
    create: [validateBody, create],
    read: [orderExists, read],
    update: [orderExists, findOrder, validateBody, validateStatus, update],
    delete: [orderExists, validateStatus, destroy],
};