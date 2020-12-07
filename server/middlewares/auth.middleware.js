const status = require('http-status');

module.exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(status.FORBIDDEN).json({
      message: 'No token provided.',
    });
  }

  req.token = token;
  next();
};
