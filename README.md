## Server for PinterestLikeApp

Server-side part is based on Nodejs framework, it connects to mongodb, uses mongoose library for this.
It includes two models: users and images information.

#### What this app can do:
CRUD operations with users;

servser-side validation when user wants to sign up;

user authentication (JSON Web Token);

protect routes that require authentication;

add and store information about images, check if image already exists in db;

for storing users' avatars s3 amazon features were used. 

