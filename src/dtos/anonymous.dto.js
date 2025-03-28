module.exports = class AnonymousDto {
  username;
  email;
  id;
  homepage;
  constructor(model) {
    this.id = model.id;
    this.username = model.username;
    this.email = model.email;
    this.homepage = model.homepage;
  }
};
