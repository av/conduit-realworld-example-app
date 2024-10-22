const { expect } = require('chai');
const sinon = require('sinon');
const { allArticles, createArticle, singleArticle, updateArticle, deleteArticle } = require('./articles');
const { Article, Tag, User } = require('../models');
const { UnauthorizedError, FieldRequiredError, AlreadyTakenError, NotFoundError, ForbiddenError } = require('../helper/customErrors');

describe('Articles Controller', () => {
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

  describe('allArticles', () => {
    it('should return all articles with default query parameters', async () => {
      const articles = { rows: [], count: 0 };
      sinon.stub(Article, 'findAndCountAll').resolves(articles);

      await allArticles(req, res, next);

      expect(res.json.calledWith({ articles: articles.rows, articlesCount: articles.count })).to.be.true;
    });

    it('should return articles filtered by author', async () => {
      req.query.author = 'testauthor';
      const articles = { rows: [], count: 0 };
      sinon.stub(Article, 'findAndCountAll').resolves(articles);

      await allArticles(req, res, next);

      expect(res.json.calledWith({ articles: articles.rows, articlesCount: articles.count })).to.be.true;
    });

    it('should return articles filtered by tag', async () => {
      req.query.tag = 'testtag';
      const articles = { rows: [], count: 0 };
      sinon.stub(Article, 'findAndCountAll').resolves(articles);

      await allArticles(req, res, next);

      expect(res.json.calledWith({ articles: articles.rows, articlesCount: articles.count })).to.be.true;
    });

    it('should return articles favorited by user', async () => {
      req.query.favorited = 'testuser';
      const user = { getFavorites: sinon.stub().resolves([]), countFavorites: sinon.stub().resolves(0) };
      sinon.stub(User, 'findOne').resolves(user);

      await allArticles(req, res, next);

      expect(res.json.calledWith({ articles: [], articlesCount: 0 })).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findAndCountAll').throws(error);

      await allArticles(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('createArticle', () => {
    it('should create a new article with valid input', async () => {
      req.body.article = { title: 'Test Title', description: 'Test Description', body: 'Test Body', tagList: ['tag1', 'tag2'] };
      sinon.stub(Article, 'create').resolves({ id: 1, setAuthor: sinon.stub(), addTagList: sinon.stub() });
      sinon.stub(Tag, 'findByPk').resolves(null);
      sinon.stub(Tag, 'create').resolves({ id: 1 });

      await createArticle(req, res, next);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(sinon.match.object)).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await createArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw FieldRequiredError if title is missing', async () => {
      req.body.article = { description: 'Test Description', body: 'Test Body', tagList: ['tag1', 'tag2'] };

      await createArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(FieldRequiredError))).to.be.true;
    });

    it('should throw AlreadyTakenError if title is already taken', async () => {
      req.body.article = { title: 'Test Title', description: 'Test Description', body: 'Test Body', tagList: ['tag1', 'tag2'] };
      sinon.stub(Article, 'findOne').resolves({});

      await createArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(AlreadyTakenError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'create').throws(error);

      await createArticle(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('singleArticle', () => {
    it('should return a single article by slug', async () => {
      req.params.slug = 'test-slug';
      const article = { id: 1, tagList: [], setAuthor: sinon.stub(), addTagList: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await singleArticle(req, res, next);

      expect(res.json.calledWith({ article })).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await singleArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findOne').throws(error);

      await singleArticle(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateArticle', () => {
    it('should update an article with valid input', async () => {
      req.params.slug = 'test-slug';
      req.body.article = { title: 'Updated Title', description: 'Updated Description', body: 'Updated Body' };
      const article = { id: 1, author: { id: 1 }, save: sinon.stub(), tagList: [], setAuthor: sinon.stub(), addTagList: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await updateArticle(req, res, next);

      expect(res.json.calledWith({ article })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await updateArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await updateArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ForbiddenError if user is not the author', async () => {
      req.params.slug = 'test-slug';
      req.loggedUser.id = 2;
      const article = { id: 1, author: { id: 1 }, save: sinon.stub(), tagList: [], setAuthor: sinon.stub(), addTagList: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await updateArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findOne').throws(error);

      await updateArticle(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteArticle', () => {
    it('should delete an article with valid input', async () => {
      req.params.slug = 'test-slug';
      const article = { id: 1, author: { id: 1 }, destroy: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await deleteArticle(req, res, next);

      expect(res.json.calledWith({ message: { body: ['Article deleted successfully'] } })).to.be.true;
    });

    it('should throw UnauthorizedError if user is not logged in', async () => {
      req.loggedUser = null;

      await deleteArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should throw NotFoundError if article is not found', async () => {
      req.params.slug = 'test-slug';
      sinon.stub(Article, 'findOne').resolves(null);

      await deleteArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ForbiddenError if user is not the author', async () => {
      req.params.slug = 'test-slug';
      req.loggedUser.id = 2;
      const article = { id: 1, author: { id: 1 }, destroy: sinon.stub() };
      sinon.stub(Article, 'findOne').resolves(article);

      await deleteArticle(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      sinon.stub(Article, 'findOne').throws(error);

      await deleteArticle(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
