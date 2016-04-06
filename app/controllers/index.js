import config from 'writemood/config/environment';
import Ember from 'ember';

export default Ember.Controller.extend({
	appCtrl: Ember.inject.controller('application'),
	loggedIn: Ember.computed.alias('appCtrl.loggedIn'),
	services: [
		{
			srvc_name: 'twitter',
			title: 'Twitter',
			logo: 'fa fa-twitter'
		},
		{
			srvc_name: 'facebook',
			title: 'Facebook',
			logo: 'fa fa-facebook'
		}
	],
	srvc_name: '',
	name: '',
	count: 100,
	processing: false,
	sentCount: new Ember.Object({
		positiveWords: 0,
		happyWords: 0,
		lovelyWords: 0,
		negativeWords: 0,
		sadWords: 0,
		angryWords: 0,
		sickWords: 0,
		totalWords: 0
	}),
	sentTypes: Ember.computed('positiveWords', 'happyWords', 'lovelyWords', 'negativeWords', 'sadWords', 'angryWords', 'sickWords', 'totalWords', function() {
		return [
			{val: this.get('positiveWords'), title: 'Positive Words'},
			{val: this.get('happyWords'), title: 'Happy Words'},
			{val: this.get('lovelyWords'), title: 'Lovely Words'},
			{val: this.get('negativeWords'), title: 'Negative Words'},
			{val: this.get('sadWords'), title: 'Sad Words'},
			{val: this.get('angryWords'), title: 'Angry Words'},
			{val: this.get('sickWords'), title: 'Sick Words'},
			{val: this.get('totalWords'), title: 'Total Words'}
		];
	}),
	positiveWords: Ember.computed.alias('sentCount.positiveWords'),
	happyWords: Ember.computed.alias('sentCount.happyWords'),
	lovelyWords: Ember.computed.alias('sentCount.lovelyWords'),
	negativeWords: Ember.computed.alias('sentCount.negativeWords'),
	sadWords: Ember.computed.alias('sentCount.sadWords'),
	angryWords: Ember.computed.alias('sentCount.angryWords'),
	sickWords: Ember.computed.alias('sentCount.sickWords'),
	totalWords: Ember.computed.alias('sentCount.totalWords'),
	sentiments: { // word lists taken from https://github.com/pubnub/tweet-emotion/blob/gh-pages/js/app.js (MIT License)
		positiveWords: [
			'excellent', 'amazing', 'beautiful', 'nice', 'marvelous', 'magnificent', 'fabulous', 'astonishing', 'fantastic', 'peaceful', 'fortunate', 'brilliant', 'glorious', 'cheerful', 'gracious', 'grateful', 'splendid', 'superb', 'honorable', 'thankful', 'inspirational', 'ecstatic', 'victorious', 'virtuous', 'proud', 'wonderful', 'lovely', 'delightful'
		],
		happyWords: [
		'happy', 'lucky', 'awesome', 'excited', 'fun', 'amusing', 'amused', 'pleasant', 'pleasing', 'glad', 'enjoy', 'jolly', 'delightful', 'joyful', 'joyous', ':-)', ':)', ':-D', ':D', '=)','☺'
		],
		lovelyWords: [
			'love', 'adore', 'blissful', 'heartfelt', 'loving', 'lovable', 'sweetheart', 'darling', 'kawaii', 'married', 'engaged'
		],
		negativeWords: [
			'unhappy', 'bad', 'sorry', 'annoyed', 'dislike', 'anxious', 'ashamed', 'cranky', 'crap', 'crappy', 'envy', 'awful', 'bored', 'boring', 'bothersome', 'bummed', 'burned', 'chaotic', 'defeated', 'devastated', 'stressed', 'disconnected', 'discouraged', 'dishonest', 'doomed', 'dreadful', 'embarrassed', 'evicted', 'freaked out', 'frustrated', 'stupid', 'guilty', 'hopeless', 'horrible', 'horrified', 'humiliated', 'ignorant', 'inhumane', 'cruel', 'insane', 'insecure', 'nervous', 'offended', 'oppressed', 'overwhelmed', 'pathetic', 'powerless', 'poor', 'resentful', 'robbed', 'screwed'
		],
		sadWords: [
		'sad', 'alone', 'anxious', 'depressed', 'disappointed', 'disappointing', 'sigh', 'sobbing', 'crying', 'cried', 'dumped', 'heartbroken', 'helpless', 'hurt', 'miserable', 'misunderstood', 'suicidal', ':-(', ':(', '=(', ';('
		],
		angryWords: [
			'hate', 'damn', 'angry', 'betrayed', 'bitched','disgust', 'disturbed', 'furious', 'harassed', 'hateful', 'hostile', 'insulted', 'irritable', 'jealous', ' rage ', 'pissed'

		],
		sickWords: [
			'sick', ' ill ', 'under weather', 'throw up', 'threw up', 'throwing up', 'puke', 'puking', 'pain', 'hangover', 'intoxicated'
		]
	},
	get_tweets(srvc, user_id) {
		var params = `?user_id=${user_id}&count=${this.get('count')}&trim_user=true`;
		var sentiments = this.get('sentiments');
		var sentCount = this.get('sentCount');
		var ctrl = this;
		srvc.get('/1.1/statuses/user_timeline.json' + params,)
			.done(function(tweets) {
				ctrl.set('processing', true);
				let tweet_texts = tweets.map(function(tweet) {
					return tweet.text;
				});
				tweet_texts.forEach(function(text) {
					var words = Ember.String.w(text);
					sentCount.incrementProperty('totalWords', words.length);
					Object.keys(sentiments).forEach(function(snt) {
						words.forEach(function(word) {
							word = word.replace(/\.*,*/g, '');
							if (sentiments[snt].contains(word)) {
								sentCount.incrementProperty(snt);
							}
						});
					});
				});
				ctrl.set('sentCount', sentCount);
				ctrl.set('processing', false);
			})
			.fail(function(err) {
				console.log("get_tweets had an error:", err);
			});
	},
	actions: {
		loginWith(srvc_name) {
			let ctrl = this;
			OAuth.initialize(config.oauth);
			OAuth.popup(srvc_name, {cache: true})
				.done(function(srvc) {
					ctrl.set('srvc_name', srvc_name.capitalize());
					srvc.me()
						.done(function(me) {
							ctrl.set('name', me.name);
							ctrl.set('loggedIn', true);
							if (srvc_name === 'twitter') {
								ctrl.get_tweets(srvc, me.id);
							}
						})
						.fail(function(err) {
							console.log('Error getting "me":', err);
						});
				})
				.fail(function(err) {
					console.log('There was an error:', err);
				});
		},
		logout() {
			this.set('loggedIn', false);
		}
	}
});
