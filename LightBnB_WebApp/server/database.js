const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

/// Users

const getUserWithEmail = function (email) {
  const queryString = `
  SELECT * FROM users
  WHERE email = $1
  `;
  return pool
    .query(queryString, [email])
    .then((res) => res.rows[0])
    .catch((err) => console.error(err.message));
};
exports.getUserWithEmail = getUserWithEmail;

const getUserWithId = function (id) {
  const queryString = `
  SELECT * FROM users
  WHERE id = $1
  `;
  return pool
    .query(queryString, [id])
    .then((res) => res.rows[0])
    .catch((err) => console.error(err.message));
};
exports.getUserWithId = getUserWithId;

const addUser = function (user) {
  const queryString = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  `;
  return pool
    .query(queryString, [user.name, user.email, user.password])
    .then((res) => res.rows[0])
    .catch((err) => console.error(err.message));
};
exports.addUser = addUser;

/// Reservations

const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.end_date
    LIMIT $2;
  `;

  return pool
    .query(queryString, [guest_id, limit])
    .then((res) => res.rows)
    .catch((err) => console.error(err.message));
};
exports.getAllReservations = getAllReservations;

/// Properties

const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  const len = queryParams.length;

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE properties.owner_id = $${len} `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city ILIKE $${len} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `AND properties.cost_per_night BETWEEN $${len} `;
    queryParams.push(options.maximum_price_per_night);
    queryString += `AND $${len} `;
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `AND properties.cost_per_night >= $${len} `;
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    queryString += `AND properties.cost_per_night <= $${len} `;
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${len} `;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${len};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;

const addProperty = function (property) {
  const queryString = `
  INSERT INTO properties (
    owner_id,
    title,
    description, 
    number_of_bedrooms,
    number_of_bathrooms,
    parking_spaces,
    cost_per_night,
    thumbnail_photo_url,
    cover_photo_url,
    street,
    country,
    city, 
    province,
    post_code
    ) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
  RETURNING *;
  `;

  return db
    .query(queryString, Object.values(property))
    .then((res) => res.rows[0])
    .catch((err) => console.error(err.message));
};
exports.addProperty = addProperty;
