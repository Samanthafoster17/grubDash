const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// create
function create(req, res) {
    const newDish = {
        id: nextId(),
        name: res.locals.name,
        description: res.locals.description,
        price: res.locals.price,
        image_url: res.locals.image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

// dish contains all data properties
function validateBody(req, res, next) {
    const { data } = req.body;
    const { data: { name, description, price, image_url }, } = req.body;

    const properties = ["name", "description", "price", "image_url"];

    if (!data) {
        return next({ status: 400, message: `A "data" property is required` });
    }

    for (property of properties) {
        if (
            !data.hasOwnProperty(property) ||
            data[property] === "" ||
            data[property] === null
        ) {
            return next({ status: 400, message: `Dish must include ${property}` });
        }
    }

    if (!Number.isInteger(price) || price <= 0) {
        return next({ status: 400, message: "Dish must have a price that is an integer greater than 0" })
    }

    res.locals.name = name;
    res.locals.description = description;
    res.locals.price = price;
    res.locals.image_url = image_url;

    return next();


}

// checking dish exists
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish === undefined) {
        return next({
            status: 404,
            message: `Dish does not exist: ${req.params.dishId}`,
        });;
    } else {
        res.locals.dish = foundDish;
        res.locals.dishId = dishId;
        next();
    }

}

// finding dish by id
function findDish(req, res, next) {
    const id = req.body.data.id;
    const dishId = res.locals.dish.id;

    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
        });
    }
    return next();
}

// read
function read(req, res) {
    const dish = res.locals.dish;

    res.status(200).json({ data: dish });
}


// update
function update(req, res) {
    const dish = res.locals.dish;
    const updatedDish = {
        ...dish,
        id: res.locals.dishId,
        name: res.locals.name,
        description: res.locals.description,
        price: res.locals.price,
        image_url: res.locals.image_url
    }

    const originalDish = res.locals.dish;
    const index = dishes.findIndex((dish) => originalDish.id === dish.id);

    dishes[index] = updatedDish;
    res.status(200).json({ data: dishes[index] })

}

// list
function list(req, res) {
    res.status(200).json({ data: dishes });
}

module.exports = {
    create: [validateBody, create],
    list,
    read: [dishExists, read],
    update: [dishExists, findDish, validateBody, update],
};