export class User {
  email: string;
  id: string;
  token: string;

  constructor(email: string, id: string, token: string) {
    this.email = email;
    this.id = id;
    this.token = token;
  }
}
