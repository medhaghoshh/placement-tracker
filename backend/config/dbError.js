// Converts low-level MySQL errors into messages a user can act on,
// instead of a generic "Something went wrong".
function dbErrorMessage(err) {
  switch (err && err.code) {
    case 'ECONNREFUSED':
      return 'Cannot reach MySQL. Make sure the MySQL service is running.';
    case 'ER_ACCESS_DENIED_ERROR':
      return 'MySQL rejected the username/password. Check DB_USER and DB_PASSWORD in backend/.env';
    case 'ER_BAD_DB_ERROR':
    case 'ER_NO_SUCH_TABLE':
      return 'Database not set up yet. Stop the server and run: npm run setup';
    default:
      return 'Something went wrong. Please try again.';
  }
}
module.exports = dbErrorMessage;
