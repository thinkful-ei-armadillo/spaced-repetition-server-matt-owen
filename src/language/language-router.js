const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonBodyParser = express.json();
const languageRouter = express.Router()
const llMaker = require('../helpers/LinkListMaker');
const llHelpers = require('../helpers/LinkListHelpers');

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )

      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .use(requireAuth)
  .get('/head', async (req, res, next) => {
    try{
      const head = await LanguageService.getHead(
        req.app.get('db'),
          req.user.id,
      )
      res.json({
        nextWord: head.original,
        wordCorrectCount: head.correct_count,
        wordIncorrectCount: head.incorrect_count,
        totalScore: head.total_score
      })
      next()
    } catch(error) {
      next(error);
    }
    
    
  })

languageRouter
  .use(requireAuth)
  .post('/guess', jsonBodyParser, async (req, res, next) => {
    try{
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )
      let wordLinkedList = llMaker(words);
      const { guess } = req.body;

      if(!guess) {
        res.status(400).json({error: `Missing 'guess' in request body`})
      }
      else {
        
      }

      next()

    } catch(error){
      next(error);
    }
  })

module.exports = languageRouter
