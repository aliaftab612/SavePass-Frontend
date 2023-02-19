export class User {
  email: string;
  id: string;
  token: string;
  tokenExpireMillisecondsDate: number;

  constructor(
    email: string,
    id: string,
    token: string,
    tokenExpireMillisecondsDate: number
  ) {
    this.email = email;
    this.id = id;
    this.token = token;
    this.tokenExpireMillisecondsDate = tokenExpireMillisecondsDate;
  }
}
