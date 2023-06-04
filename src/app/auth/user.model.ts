export class User {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  email: string;
  _id: string;

  constructor(
    email: string,
    _id: string,
    firstName: string,
    lastName: string,
    profilePhotoUrl: string
  ) {
    this.email = email;
    this._id = _id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePhotoUrl = profilePhotoUrl;
  }
}
