// Returns true if using MongoDB, false if MySQL
module.exports.isMongo = () => !!process.env.MONGO_URI;
