const {    
    getOne,
    create,
    getOneEmail
  } = require("../services/anonymous.service");
  class AnonymousController {
    constructor() {
      this.create = create;
      this.getOne = getOne;
      this.getOneEmail = getOneEmail;
    }
  }
  module.exports = new AnonymousController();
  