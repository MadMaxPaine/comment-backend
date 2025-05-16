module.exports = class UserDto {
  username;
  email;
  id;
  homepage;
  avatar;
  constructor(model) {
    this.id = model.id;
    this.username = model.username;
    this.email = model.email;
    this.homepage=model.homepage;
    this.avatar = model.avatar;
  }
};
//DTO - для зареєстрованих користувачів