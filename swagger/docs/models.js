exports.models = {
	Circle: {
		id: 'Circle',
		properties: {
			name: {
				type: 'string',
				description: 'Name of the circle'
			},
			users: {
				type: 'string',
				description: 'Array of users'
			},
			manager: {
				type: 'string',
				description: 'Manager id'
			}
		}
	}
}