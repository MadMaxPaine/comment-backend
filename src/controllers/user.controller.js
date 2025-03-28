const {
  registration,
  login,
  logout,
  getOne,
  refresh,
} = require("../services/user.service");
class UserController {
  constructor() {
    this.registration = registration;
    this.login = login;
    this.logout = logout;
    this.refresh = refresh;
    this.getOne = getOne;
  }
}
module.exports = new UserController();
