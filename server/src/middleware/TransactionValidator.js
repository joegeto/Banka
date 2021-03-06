import helper from '../helpers/helper';
import Transaction from '../models/TransactionModel';

class TransactionValidation {
  /**
   * Handles user input validation on making debit or credit transactions
   *
   * @static
   * @param {Object} req
   * @param {Object} res
   * @returns {(function|Object)} function next() or an error response object
   * @memberof TransactionValidation
   */
  static transactionCheck(req, res, next) {
    let { amount } = req.body;

    const errors = TransactionValidation.inputCheck(amount);
    if (errors.length > 0) return res.status(errors[0].status).json(errors[0]);

    if (amount && typeof amount === 'string') {
      amount = amount.trim();
    }

    if (!Number(amount)) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: `Request Forbidden`,
        message: `Transaction amount must be a number`
      });
    }

    if (Number(amount) < 500) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: `Request Forbidden`,
        message: `You can only make debit/credit transactions above 500 Naira`
      });
    }

    let urltype;
    if (req.url.endsWith('/credit')) {
      urltype = 'credit';
    }
    if (req.url.endsWith('/debit')) {
      urltype = 'debit';
    }

    req.body.amount = amount;
    req.body.type = urltype;

    return next();
  }

  /**
   * Restricts access of transaction route to owners and staff
   *
   * @static
   * @param {Object} req
   * @param {Object} res
   * @returns {(function|Object)} function next() or an error response object
   * @memberof TransactionValidation
   */
  static async transactionPermission(req, res, next) {
    if (!Number(req.params.id)) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: `Request Forbidden`,
        message: `Transaction ID must be a number`
      });
    }

    const transaction = await Transaction.findOneTransaction(req.params.id);

    if (transaction) {
      const notAllowed = await helper.checkPermission(
        transaction.accountnumber,
        req.userId,
        req.userType,
        'transaction'
      );
      if (notAllowed) return res.status(notAllowed.status).json(notAllowed);

      return next();
    }

    return res.status(404).json({
      status: 404,
      error: `Not found`,
      message: `Transaction does not exist`,
      success: false
    });
  }

  /**
   *
   * Runs a check on the fields provided and returns appropriate errors if any
   * @static
   * @param {number} amount
   * @param {string} type
   * @returns {Array} an array of error(s)
   * @memberof TransactionValidation
   */
  static inputCheck(amount) {
    const errors = [];

    const isEmpty = helper.checkFieldEmpty(amount, 'transaction amount');
    if (isEmpty) errors.push(isEmpty);

    const hasWhiteSpace = helper.checkFieldWhiteSpace(amount, 'transaction amount');
    if (hasWhiteSpace) errors.push(hasWhiteSpace);

    return errors;
  }
}

export default TransactionValidation;
