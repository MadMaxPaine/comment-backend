module.exports = class AnonymousDto {
  username;
  email;
  id;
  homepage;
  oldUserNames; // нове поле для старих імен
  oldHomePages; // нове поле для старих домашніх сторінок
  oldAnonymousPrints; // нове поле для старих prints

  constructor(model) {
    this.id = model.id;
    this.username = model.username;
    this.email = model.email;
    this.homepage = model.homepage;

    // Якщо ці поля існують в моделі, додаємо їх до DTO
    this.oldUserNames = model.oldUserNames ?? [];
    this.oldHomePages = model.oldHomePages ?? [];
    this.oldAnonymousPrints = model.oldAnonymousPrints ?? [];
  }
};
