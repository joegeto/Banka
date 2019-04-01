import mockData from '../models/mockData';
import Helper from '../helpers/helper';
import User from '../models/user.model';
/**
 *
 * @exports
 * @class UserService
 */
class UserService {
  /**
   *
   * Handles the logic for creating a new user account
   * @static
   * @param {Object} newUser user details present in the incoming request body
   * @returns {Object} API Response Object
   * @memberof UserService
   */
  static createUser(newUser) {
    const { email, firstName, lastName, password, type, isAdmin } = newUser;
    const hashedpassword = Helper.hashPassword(password);

    const usersLength = mockData.users.length;
    const lastUserId = mockData.users[usersLength - 1].id;
    const id = lastUserId + 1;

    const userInstance = new User(id, email, firstName, lastName, hashedpassword, type, isAdmin);
    mockData.users.push(userInstance);

    const payLoad = { id, firstName, lastName, email };
    const token = Helper.getToken(payLoad);
    return {
      status: 201,
      data: {
        token,
        id,
        firstName,
        lastName,
        email
      },
      success: true
    };
  }

  /**
   *
   * Handles the logic for logging a user into the system
   * @static
   * @param {Object} userCredentials present in th incoming request body
   * @returns {Object} API Response Object
   * @memberof UserService
   */
  static logUserIn(userCredentials) {
    const { email, password } = userCredentials;
    const foundUser = mockData.users.find(user => user.email === email);
    if (!foundUser)
      return {
        status: 401,
        error: 'Authentication Failed. Invalid Login credentials provided',
        success: false
      };

    const hash = foundUser.password;
    if (Helper.comparePassword(password, hash) === true) {
      const { id, firstName, lastName } = foundUser;
      const payLoad = { id, firstName, lastName, email };
      const token = Helper.getToken(payLoad);
      return {
        status: 200,
        data: {
          token,
          id,
          firstName,
          lastName,
          email
        },
        success: true
      };
    }

    return {
      status: 401,
      error: 'Authentication Failed. Invalid Login credentials provided',
      success: false
    };
  }
}

export default UserService;
