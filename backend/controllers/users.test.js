const { expect } = require('chai');
const sinon = require('sinon');
const { signUp, signIn } = require('./users');
const { User } = require('../models');
const { FieldRequiredError, AlreadyTakenError, NotFoundError, ValidationError } = require('../helper/customErrors');
const { bcryptHash, bcryptCompare } = require('../helper/bcrypt');
const { jwtSign } = require('../helper/jwt');

describe('Users Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('signUp', () => {
    it('should create a new user with valid input', async () => {
      req.body.user = { username: 'testuser', email: 'test@example.com', password: 'password' };
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').resolves({ id: 1, dataValues: {} });
      sinon.stub(bcryptHash, 'bcryptHash').resolves('hashedpassword');
      sinon.stub(jwtSign, 'jwtSign').resolves('token');

      await signUp(req, res, next);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(sinon.match.object)).to.be.true;
    });

    it('should throw FieldRequiredError if username is missing', async () => {
      req.body.user = { email: 'test@example.com', password: 'password' };

      await signUp(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(FieldRequiredError))).to.be.true;
    });

    it('should throw FieldRequiredError if email is missing', async () => {
      req.body.user = { username: 'testuser', password: 'password' };

      await signUp(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(FieldRequiredError))).to.be.true;
    });

    it('should throw FieldRequiredError if password is missing', async () => {
      req.body.user = { username: 'testuser', email: 'test@example.com' };

      await signUp(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(FieldRequiredError))).to.be.true;
    });

    it('should throw AlreadyTakenError if email is already taken', async () => {
      req.body.user = { username: 'testuser', email: 'test@example.com', password: 'password' };
      sinon.stub(User, 'findOne').resolves({});

      await signUp(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(AlreadyTakenError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(User, 'create').throws(error);

      await signUp(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('signIn', () => {
    it('should sign in a user with valid input', async () => {
      req.body.user = { email: 'test@example.com', password: 'password' };
      const existentUser = { id: 1, dataValues: {}, password: 'hashedpassword' };
      sinon.stub(User, 'findOne').resolves(existentUser);
      sinon.stub(bcryptCompare, 'bcryptCompare').resolves(true);
      sinon.stub(jwtSign, 'jwtSign').resolves('token');

      await signIn(req, res, next);

      expect(res.json.calledWith(sinon.match.object)).to.be.true;
    });

    it('should throw NotFoundError if email is not found', async () => {
      req.body.user = { email: 'test@example.com', password: 'password' };
      sinon.stub(User, 'findOne').resolves(null);

      await signIn(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ValidationError if password is incorrect', async () => {
      req.body.user = { email: 'test@example.com', password: 'password' };
      const existentUser = { id: 1, dataValues: {}, password: 'hashedpassword' };
      sinon.stub(User, 'findOne').resolves(existentUser);
      sinon.stub(bcryptCompare, 'bcryptCompare').resolves(false);

      await signIn(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ValidationError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(User, 'findOne').throws(error);

      await signIn(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
