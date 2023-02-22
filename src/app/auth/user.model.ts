export class User {
  name: string;
  photoUrl: string;
  email: string;
  id: string;
  token: string;

  constructor(
    email: string,
    id: string,
    token: string,
    name: string,
    photoUrl: string
  ) {
    this.email = email;
    this.id = id;
    this.token = token;
    this.name = name;
    this.photoUrl = photoUrl;
  }
}
