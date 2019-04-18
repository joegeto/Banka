import AccountService from '../services/account.service';

/**
 * @exports AccountController
 *
 * @class AccountController
 */
class AccountController {
  /**
   *
   * Handles the logic for creating a new bank account
   * @static
   * @param {Object} req
   * @param {Object} res
   * @returns {Object} JSON API Response
   * @memberof AccountController
   */
  static async createBankAccount(req, res, next) {
    try {
      const response = await AccountService.createBankAccount(req.body, req.userEmail, req.userId);
      return res.status(response.status).json(response);
    } catch (e) {
      return next(e);
    }
  }

  /**
   *
   * Handles the logic for activating or deactivating a bank account
   * @static
   * @param {Object} req
   * @param {Object} res
   * @returns {Object} JSON API Response
   * @memberof AccountController
   */
  static async updateAccountStatus(req, res, next) {
    try {
      const response = await AccountService.updateAccountStatus(
        req.body.status,
        req.params.acctNumber
      );
      return res.status(response.status).json(response);
    } catch (e) {
      return next(e);
    }
  }

  /**
   *
   * Handles the logic for deleting a specific bank account
   * @static
   * @param {Object} req
   * @param {Object} res
   * @returns {Object} JSON API Response
   * @memberof AccountController
   */
  static async deleteBankAccount(req, res, next) {
    try {
      const response = await AccountService.deleteBankAccount(req.params.acctNumber);
      return res.status(response.status).json(response);
    } catch (e) {
      return next(e);
    }
  }
}

export default AccountController;
