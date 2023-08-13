class UserSettings {
  hashIterations: number;
  appLockoutMinutes: number;
}

export class User {
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  email: string;
  _id: string;
  userSettings: UserSettings;

  constructor(
    email: string,
    _id: string,
    firstName: string,
    lastName: string,
    profilePhotoUrl: string,
    userSettings: UserSettings
  ) {
    this.email = email;
    this._id = _id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePhotoUrl = profilePhotoUrl;
    this.userSettings = userSettings;
  }
}
