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
            managers: {
                type: 'string',
                description: 'Array of managers'

            },
            creator: {
                type: 'string',
                description: 'Creator id'
            }
        }
    }
}
