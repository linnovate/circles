'use strict';

module.exports = {
	settings: {
		displayAllSources: true,
		displayAllC19nGroups: true,
		displayAllGroups: true,
		circleTypes: {
			c19n: {initFrom: 'initData'},
			c19nGroups1: {initFrom: 'initData'},
			c19nGroups2: {initFrom: 'initData'},
			personal: {},
			corporate: {}
		},
		maxUsers: 20,
		defaultClearances: ['0', '1', '2', '3', '4'],
		modify: { //minutes
			"initData": 5
		}
	}
};