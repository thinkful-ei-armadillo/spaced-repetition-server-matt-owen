const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const jsonBodyParser = express.json();
const languageRouter = express.Router();
const llMaker = require('../helpers/LinkListMaker');
const llHelpers = require('../helpers/LinkListHelpers');

languageRouter.use(requireAuth).use(async (req, res, next) => {
	try {
		const language = await LanguageService.getUsersLanguage(
			req.app.get('db'),
			req.user.id
		);

		if (!language)
			return res.status(404).json({
				error: `You don't have any languages`
			});

		req.language = language;
		next();
	} catch (error) {
		next(error);
	}
});

languageRouter.get('/', async (req, res, next) => {
	try {
		const words = await LanguageService.getLanguageWords(
			req.app.get('db'),
			req.language.id
		);

		res.json({
			language: req.language,
			words
		});
		next();
	} catch (error) {
		next(error);
	}
});

languageRouter.use(requireAuth).get('/head', async (req, res, next) => {
	try {
		const head = await LanguageService.getHead(req.app.get('db'));
		res.json({
			nextWord: head.original,
			wordCorrectCount: head.correct_count,
			wordIncorrectCount: head.incorrect_count,
			totalScore: head.total_score
		});
		next();
	} catch (error) {
		next(error);
	}
});

languageRouter
	.use(requireAuth)
	.post('/guess', jsonBodyParser, async (req, res, next) => {
		try {
			const words = await LanguageService.getLanguageWords(
				req.app.get('db'),
				req.language.id
			);
			let languageHead = await LanguageService.getLanguageHead(
				req.app.get('db'),
				req.user.id
			);

			languageHead = languageHead[0].head;

			let head = await LanguageService.getHead(req.app.get('db'), languageHead);
			head = head[0];

			let wordLinkedList = llMaker(words, head);
			//
			const { guess } = req.body;

			if (!guess) {
				res.status(400).json({ error: `Missing 'guess' in request body` });
			} else {
				let answer = wordLinkedList.head;
				let { correct_count, incorrect_count, translation } = answer.value;

				let updatedWord = {
					...answer.value
				};

				if (answer.value.translation === guess) {
					updatedWord.correct_count += 1;
					correct_count++;
					// const updated = await LanguageService.updateLanguageWords(
					// 	req.app.get('db'),
					// 	translation,
					// 	updatedWord
					// );
					res.status(200).json({
						nextWord: answer.next.value.original,
						totalScore: correct_count,
						wordCorrectCount: correct_count,
						wordIncorrectCount: incorrect_count,
						answer: answer.value.translation,
						isCorrect: true
					});
				} else {
					updatedWord.incorrect_count += 1;
					const updated = await LanguageService.updateLanguageWords(
						req.app.get('db'),
						translation,
						updatedWord
					);
					incorrect_count++;
					res.status(200).json({
						nextWord: answer.next.value.original,
						totalScore: correct_count,
						wordCorrectCount: correct_count,
						wordIncorrectCount: incorrect_count,
						answer: answer.value.translation,
						isCorrect: false
					});
				}
			}

			next();
		} catch (error) {
			next(error);
		}
	});

module.exports = languageRouter;
