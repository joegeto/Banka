/* eslint-disable default-case */
import sgMail from '@sendgrid/mail';
import Transaction from '../models/TransactionModel';
import Account from '../models/AccountModel';
/**
 * @exports TransactionService
 *
 * @class TransactionService
 */
class TransactionService {
  /**
   * Handles the logic for making a debit or credit transaction
   *
   * @static
   * @param {number} accountNumber
   * @param {number} amount
   * @param {number} cashier
   * @param {string} type
   * @param {string} urltype
   * @returns {object} API response object
   * @memberof TransactionService
   */
  static async makeTransaction(accountNumber, amount, cashier, transactionType) {
    const foundAccount = await Account.findAccount(accountNumber, 'accountnumber');

    if (foundAccount) {
      const oldBalance = parseFloat(foundAccount.balance);

      if (
        (transactionType === 'debit' && oldBalance <= 0) ||
        (transactionType === 'debit' && oldBalance < Number(amount))
      ) {
        return {
          status: 403,
          success: false,
          error: `Request Forbidden`,
          message: `Insufficient Funds. You have ${oldBalance} Naira left`
        };
      }

      if (foundAccount.status !== 'active') {
        return {
          status: 403,
          success: false,
          error: `Request forbidden`,
          message: `Account status:${
            foundAccount.status
          }. You can only perform transactions on an active account.`
        };
      }

      let newBalance;
      switch (transactionType) {
        case 'credit':
          newBalance = (oldBalance + parseFloat(amount)).toFixed(2);
          break;
        case 'debit':
          newBalance = (oldBalance - parseFloat(amount)).toFixed(2);
          break;
      }

      const txObj = { transactionType, accountNumber, cashier, amount, oldBalance, newBalance };

      // save new transaction
      const newTransaction = await Transaction.create(txObj);
      const { id } = newTransaction;

      // update account with new balance
      await Account.update(accountNumber, newBalance, 'balance');

      // send transaction notification
      await TransactionService.sendEmailNotification(
        transactionType,
        amount,
        newBalance,
        accountNumber
      );

      return {
        status: 201,
        success: true,
        data: {
          transactionId: id,
          accountNumber: parseInt(accountNumber, 10),
          amount: parseFloat(amount).toFixed(2),
          cashier,
          transactionType,
          accountBalance: newBalance
        },
        message: `Account ${transactionType}ed successfully`
      };
    }
    return { status: 404, success: false, error: `Not found`, message: `Account does not exist` };
  }

  /**
   *
   * Handles the logic for fetching a single transaction
   * @static
   * @param {number} id transaction ID
   * @param {number} user ID if the currently logged in user
   * @param {string} userType staff or client user
   * @returns
   * @memberof TransactionService
   */
  static async fetchSingleTransaction(id) {
    const transaction = await Transaction.findOneTransaction(id);

    return {
      status: 200,
      success: true,
      data: {
        transactionId: transaction.id,
        accountNumber: parseInt(transaction.accountnumber, 10),
        amount: transaction.amount,
        cashier: transaction.cashier,
        transactionType: transaction.type,
        oldBalance: transaction.oldbalance,
        newBalance: transaction.newbalance,
        createdOn: transaction.createdon
      }
    };
  }

  /**
   *
   * Sends e-mail notification on transactions made on an account
   * @static
   * @param {string} type
   * @param {number} amount
   * @param {number} balance
   * @param {number} acctNumber
   * @memberof TransactionService
   */
  static async sendEmailNotification(type, amount, balance, acctNumber) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const ownerEmail = await Account.findAccountOwner(acctNumber);
    const msg = {
      to: ownerEmail,
      from: 'Banka@operations.com',
      subject: `${type.toUpperCase()} ALERT FROM BANKA`,
      text: `Account Number:${acctNumber}
             Amount:${amount}
             Description: This is a ${type} transaction of ${amount} Naira.
             Available Balance:${balance}`,
      html: `<strong>
                Account Number:</strong>${acctNumber}
                <br/>
              <strong>
                Amount:</strong>${amount}
                <br/>
                <strong>
                Description:</strong> This is a ${type} transaction of ${amount} Naira.
                <br/>
                <strong>
                Available Balance:</strong>${balance}
            `
    };
    sgMail.send(msg);
  }
}

export default TransactionService;
