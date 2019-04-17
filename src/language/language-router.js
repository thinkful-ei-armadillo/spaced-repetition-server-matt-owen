const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const jsonBodyParser = express.json();
const languageRouter = express.Router();
const llMaker = require('../helpers/LinkListMaker');
const llHelpers = require('../helpers/LinkListHelpers');

// function updateNexts(ll, llprevHeadValue) {}

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
		let languageHead = await LanguageService.getLanguageHead(
			req.app.get('db'),
			req.user.id
		);
		languageHead = languageHead[0].head;
		let head = await LanguageService.getHead(req.app.get('db'), languageHead);
		head = head[0];
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
			const { guess } = req.body;
			const words = await LanguageService.getLanguageWords(
				req.app.get('db'),
				req.language.id
			);
			let languageHead = await LanguageService.getLanguageHead(
				req.app.get('db'),
				req.user.id
			);
			// language head is language.head, an integer
			languageHead = languageHead[0].head;
			let head = await LanguageService.getHead(req.app.get('db'), languageHead);
			// head is the node, which will be ll.head
			head = head[0];

			let ll = llMaker(words, head);
			// llHelpers.displayList(ll);

			if (!guess) {
				res.status(400).json({ error: `Missing 'guess' in request body` });
			} else {
				// need to check head value
				// console.log(head);
				let total_score = head.total_score;
				let correct_count = head.correct_count;
				let incorrect_count = head.incorrect_count;
				let translation = head.translation;
				let memory_value = head.memory_value;

				if (guess === translation) {
					correct_count++;
					total_score++;
					memory_value *= 2;
				} else {
					incorrect_count++;
					memory_value = 1;
				}
				// write changes into head
				Object.assign(ll.head.value, {
					correct_count,
					incorrect_count,
					memory_value
				});
				// mutate head location
				let llLength = llHelpers.size(ll);
				let llprevHeadValue = ll.head.value;
				ll.remove(ll.head);
				// simulate decreased length of ll after removing head
				llLength--;

				// find the (memory_value - 1)th element, and places this one after it
				// this should update nexts
				// console.log(llprevHeadValue);
				// let counter = 0;
				// while (counter < llHelpers.size(ll)) {}
				// console.log('here');
				if (llprevHeadValue.memory_value < llLength) {
					// console.log('before insert');
					// updating node.next value, but not node.value.next
					// console.log(`mvalue is ${memory_value}`);
					ll.insertAt(llprevHeadValue.memory_value, llprevHeadValue);
					// console.log('before update next');
					// can we do object ===?
					let prevNode = llHelpers.findPrevious(ll, llprevHeadValue);
					let updatedPrevNode = prevNode;

					updatedPrevNode.value.next = llprevHeadValue.id;
					// console.log(llprevHeadValue.id);
					console.log('updatedprevnodevalue');
					console.log(updatedPrevNode.value);
					console.log('----------------------');
					ll.remove(prevNode);
					ll.insertLast(updatedPrevNode);

					let currNode = ll.find(llprevHeadValue);
					let updatedCurrNode = currNode;
					console.log(updatedCurrNode);
					updatedCurrNode.value.next = currNode.next.value.id;
					ll.remove(currNode);
					ll.insertLast(updatedCurrNode);
					// console.log('after updatenext');
					// findPrevious node, update next to llprevHead.id
					// ll.remove(ll.prevNode) ... remove prevnode from ll, re-add on end with new values (insertLast(updatedPrevNode))
					// ll.find ... find llprevHeadNode, to check its ll.next.id, updatedllprevHeadNodeValue = {...llprevHeadNode.value, next: ll.next.id}
					// remove newly inserted llprevHeadNode, insert updated llprevHead (with new next) at end of ll

					// ll is read, order of ll doesnt matter because actual word question "nexts"
					// are different from node nexts, aka ll.value.next !== ll.next

					// database words are updated with ll.value.nexts
				} else if (llprevHeadValue.memory_value >= llLength) {
					ll.insertLast(llprevHeadValue);
					// console.log('here');
					let prevNode = llHelpers.findPrevious(ll, llprevHeadValue);
					let updatedPrevNode = prevNode;

					updatedPrevNode.value.next = llprevHeadValue.id;
					// console.log(llprevHeadValue.id);
					console.log('updatedprevnodevalue');
					console.log(updatedPrevNode.value);
					console.log('----------------------');
					ll.remove(prevNode);
					ll.insertLast(updatedPrevNode);

					let currNode = ll.find(ll, llprevHeadValue);
					let updatedCurrNode = currNode;
					console.log(updatedCurrNode);
					updatedCurrNode.value.next = currNode.next.value.id;
					ll.remove(currNode);
					ll.insertLast(updatedCurrNode);
				}
				// llHelpers.displayList(ll);
				// Persist the linked list => db(words)
				let currNode = ll.head;

				while (currNode !== null) {
					// console.log(currNode);
					await LanguageService.updateLanguageWords(
						req.app.get('db'),
						currNode.value.original,
						currNode.value
					);
					currNode = currNode.next;
					if (currNode === null) {
						break;
					}
				}
				// Persist new head and score => db(language)
				let updatedLanguage = {
					total_score: total_score,
					head: ll.head.value.id
				};
				//
				await LanguageService.updateLanguage(
					req.app.get('db'),
					req.user.id,
					updatedLanguage
				);
				// send correct/incorrect response
				if (guess === translation) {
					res.status(200).json({
						nextWord: ll.head.value.original,
						totalScore: total_score,
						wordCorrectCount: correct_count,
						wordIncorrectCount: incorrect_count,
						answer: translation,
						isCorrect: true
					});
				} else {
					res.status(200).json({
						nextWord: ll.head.value.original,
						totalScore: total_score,
						wordCorrectCount: correct_count,
						wordIncorrectCount: incorrect_count,
						answer: translation,
						isCorrect: false
					});
				}
				next();
			}
		} catch (error) {
			next(error);
		}
	});

module.exports = languageRouter;
