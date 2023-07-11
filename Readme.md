# guExamServer

## Runtime Environment

Nodejs: 16.15.0

MySQL: 8

### Environment

Create a .env file at root location of your repo and update the following properties

```
# MySQL Environment
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=
MYSQL_PORT=
MYSQL_ROOT_HOST=

# Redis Environment
REDIS_PORT=

# Node
NODE_ENV=
PORT=

# JWT secret
JWT_SECRET=
```

### Running the Project

```bash
# Start the docker file if you want to install mysql and redis using docker
docker-compose up -d

# Installing required packages
npm install

# Starting the project in dev environment
npm run dev
```

### Project Structure

```bash
--> src
	 --> controllers # Define the controllers for every route
	 --> docs # Swagger
   --> middlewares # Define middlewares here
   --> mock_data # Define test mock data here
   --> models # Define database models here
   --> routes # Routing goes here
   --> types # Typesricpt goes here
   --> utils # Utils go here
   --> validator # Joi Validator
   --> app.ts # Main File
   --> data-source.ts # Database connection
```

Note: 

- Controllers should be define in Class based architecture
- Controllers are defined on the basis of route postfix
    - eg /auth so controller would be define for auth as Auth.ts
- Middlewares are the helper files for the routes which have access to the req, res, next and err object/function. Keep middleware files dedicated to the single logic for e.g for logger we are using winston keep it in single file
- In Models we define the table (entites) schema, keep the entities dumb which means don’t write in crud logic at entities
- Define routes on the basis of the business-logic
- Utils are the abstraction folder where the helper files goes
    - Define a util for every table(entities) in Class Based Format
    - Define a util for every package you install
    - Define a util on the basis of business logic
- Validators are the req validation file, write those file according the route
- Types file should be on the basis of entities or Controllers or Business Logic

### Naming Convention

- Variable Name, Function Name: camelCase
- ClassName: PascalCase
- filename: dash-case
- folder_name: snake_case
- route-name: dash-case and don’t use the method name in routes name, e.g get-users instead define the route as ‘users’ where http method defines the action
