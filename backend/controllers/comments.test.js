const { expect } = require('chai');
const sinon = require('sinon');
const { allComments, createComment, deleteComment } = require('./comments');
const { Article, Comment, User } = require('../models');
const { UnauthorizedError, FieldRequiredError, NotFoundError, ForbiddenError } = require('../helper/customErrors');

describe('Comments Controller', () => {
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

  describe('allComments', () => {
    it('should return all comments for a given article slug', async () => {
      req.params.slug = 'test-slug';
      const article = { id: 1, getComments: sinon.stub().resolves([]) };
      sinon.stub(Article, 'findOne').resolves(article);

      await allComments(req, res, next);

      expect(res.json.calledWith({ comments: [] })).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await allComments(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findOne').throws(error);

      await allComments(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('createComment', () => {
    it('should create a new comment with valid input', async () => {
      req.body.comment = { body: 'Test Comment' };
      req.params.slug = 'test-slug';
      const article = { id: 1 };
      sinon.stub(Article, 'findOne').resolves(article);
      sinon.stub(Comment, 'create').resolves({ id: 1, dataValues: {} });

      await createComment(req, res, next);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(sinon.match.object)).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await createComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw FieldRequiredError if comment body is missing', async () => {
      req.body.comment = {};

      await createComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(FieldRequiredError))).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.body.comment = { body: 'Test Comment' };
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await createComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Comment, 'create').throws(error);

      await createComment(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment with valid input', async () => {
      req.params.slug = 'test-slug';
      req.params.commentId = 1;
      const comment = { id: 1, userId: 1, destroy: sinon.stub() };
      sinon.stub(Comment, 'findByPk').resolves(comment);

      await deleteComment(req, res, next);

      expect(res.json.calledWith({ message: { body: ['Comment deleted successfully'] } })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await deleteComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw NotFoundError if comment is not found', async () => {
      req.params.commentId = 1;
      sinon.stub(Comment, 'findByPk').resolves(null);

      await deleteComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ForbiddenError if user is not the author', async () => {
      req.params.commentId = 1;
      req.loggedUser.id = 2;
      const comment = { id: 1, userId: 1, destroy: sinon.stub() };
      sinon.stub(Comment, 'findByPk').resolves(comment);

      await deleteComment(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Comment, 'findByPk').throws(error);

      await deleteComment(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
