const { expect } = require('chai');
const sinon = require('sinon');
const { favoriteToggler } = require('./favorites');
const { Article, Tag, User } = require('../models');
const { UnauthorizedError, NotFoundError } = require('../helper/customErrors');

describe('Favorites Controller', () => {
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

  describe('favoriteToggler', () => {
    it('should favorite an article with valid input', async () => {
      req.params.slug = 'test-slug';
      req.method = 'POST';
      const article = { id: 1, addUser: sinon.stub(), tagList: [], setAuthor: sinon.stub(), addTagList: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await favoriteToggler(req, res, next);

      expect(res.json.calledWith({ article })).to.be.true;
    });

    it('should unfavorite an article with valid input', async () => {
      req.params.slug = 'test-slug';
      req.method = 'DELETE';
      const article = { id: 1, removeUser: sinon.stub(), tagList: [], setAuthor: sinon.stub(), addTagList: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await favoriteToggler(req, res, next);

      expect(res.json.calledWith({ article })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await favoriteToggler(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await favoriteToggler(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findOne').throws(error);

      await favoriteToggler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
