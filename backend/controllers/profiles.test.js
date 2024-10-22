const { expect } = require('chai');
const sinon = require('sinon');
const { getProfile, followToggler } = require('./profiles');
const { User } = require('../models');
const { UnauthorizedError, NotFoundError } = require('../helper/customErrors');

describe('Profiles Controller', () => {
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

  describe('getProfile', () => {
    it('should return a user profile by username', async () => {
      req.params.username = 'testuser';
      const profile = { id: 1, username: 'testuser' };
      sinon.stub(User, 'findOne').resolves(profile);

      await getProfile(req, res, next);

      expect(res.json.calledWith({ profile })).to.be.true;
    });

    it('should throw NotFoundError if user profile is not found', async () => {
      req.params.username = 'testuser';
      sinon.stub(User, 'findOne').resolves(null);

      await getProfile(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(User, 'findOne').throws(error);

      await getProfile(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('followToggler', () => {
    it('should follow a user profile with valid input', async () => {
      req.params.username = 'testuser';
      req.method = 'POST';
      const profile = { id: 1, username: 'testuser', addFollower: sinon.stub() };
      sinon.stub(User, 'findOne').resolves(profile);

      await followToggler(req, res, next);

      expect(res.json.calledWith({ profile })).to.be.true;
    });

    it('should unfollow a user profile with valid input', async () => {
      req.params.username = 'testuser';
      req.method = 'DELETE';
      const profile = { id: 1, username: 'testuser', removeFollower: sinon.stub() };
      sinon.stub(User, 'findOne').resolves(profile);

      await followToggler(req, res, next);

      expect(res.json.calledWith({ profile })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await followToggler(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw NotFoundError if user profile is not found', async () => {
      req.params.username = 'testuser';
      sinon.stub(User, 'findOne').resolves(null);

      await followToggler(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(User, 'findOne').throws(error);

      await followToggler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
