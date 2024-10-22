const { expect } = require('chai');
const sinon = require('sinon');
const { currentUser, updateUser } = require('./user');
const { UnauthorizedError } = require('../helper/customErrors');
const { bcryptHash } = require('../helper/bcrypt');

describe('User Controller', () => {
  let req, res, next, loggedUser;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      headers: {},
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };
    next = sinon.spy();
    loggedUser = { id: 1, username: 'testuser' };
    req.loggedUser = loggedUser;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('currentUser', () => {
    it('should return the current logged-in user', async () => {
      req.headers.email = 'testuser@example.com';

      await currentUser(req, res, next);

      expect(res.json.calledWith({ user: loggedUser })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await currentUser(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(res, 'json').throws(error);

      await currentUser(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateUser', () => {
    it('should update the user with valid input', async () => {
      req.body.user = { username: 'updateduser', bio: 'Updated bio', image: 'updatedimage.jpg' };

      await updateUser(req, res, next);

      expect(res.json.calledWith({ user: loggedUser })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await updateUser(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should update the user password if provided', async () => {
      req.body.user = { password: 'newpassword' };
      const hashedPassword = 'hashedpassword';
      sinon.stub(bcryptHash, 'bcryptHash').resolves(hashedPassword);

      await updateUser(req, res, next);

      expect(loggedUser.password).to.equal(hashedPassword);
      expect(res.json.calledWith({ user: loggedUser })).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(loggedUser, 'save').throws(error);

      await updateUser(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
