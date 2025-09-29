# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)




PS C:\CapstoneProject\LITEREXIA\backend> npm start
> backend@1.0.0 start
> node server.js

AWS credentials detected in environment variables
AWS Region: ap-southeast-2
Attempting to connect to MongoDB...
node:internal/tls/secure-context:70
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
    at configSecureContext (node:internal/tls/secure-context:191:5)
    at Object.createSecureContext (node:_tls_common:113:3)
    at Server.setSecureContext (node:_tls_wrap:1490:27)
    at Server (node:_tls_wrap:1354:8)
    at new Server (node:https:80:3)
    at Object.createServer (node:https:135:10)
    at Object.<anonymous> (C:\CapstoneProject\LITEREXIA\backend\server.js:1307:27) {
  library: 'PEM routines',
  reason: 'bad base64 decode',
  code: 'ERR_OSSL_PEM_BAD_BASE64_DECODE'
}

Node.js v22.14.0
PS C:\CapstoneProject\LITEREXIA\backend> node test-mongodb.js
Testing MongoDB connection...
MONGO_URI from .env: Found
✅ MongoDB Connected Successfully!
Host: ac-qlfl5i6-shard-00-00.0f8ylb8.mongodb.net
Database: test
PS C:\CapstoneProject\LITEREXIA\backend> npm start

> backend@1.0.0 start
> node server.js

AWS credentials detected in environment variables
AWS Region: ap-southeast-2
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...
node:internal/tls/secure-context:70
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
> backend@1.0.0 start
> node server.js

AWS credentials detected in environment variables
AWS Region: ap-southeast-2
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...
node:internal/tls/secure-context:70
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)

AWS credentials detected in environment variables
AWS Region: ap-southeast-2
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...
node:internal/tls/secure-context:70
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...
node:internal/tls/secure-context:70
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
    context.setCert(cert);
            ^

Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
Error: error:04800064:PEM routines::bad base64 decode
    at node:internal/tls/secure-context:70:13
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
    at configSecureContext (node:internal/tls/secure-context:191:5)
    at Array.forEach (<anonymous>)
    at setCerts (node:internal/tls/secure-context:68:3)
    at configSecureContext (node:internal/tls/secure-context:191:5)
    at configSecureContext (node:internal/tls/secure-context:191:5)
    at Object.createSecureContext (node:_tls_common:113:3)
    at Object.createSecureContext (node:_tls_common:113:3)
    at Server (node:_tls_wrap:1354:8)
    at new Server (node:https:80:3)
    at Object.createServer (node:https:135:10)
    at Object.<anonymous> (C:\CapstoneProject\LITEREXIA\backend\server.js:1307:27) {
  library: 'PEM routines',
  reason: 'bad base64 decode',
  code: 'ERR_OSSL_PEM_BAD_BASE64_DECODE'
}

Node.js v22.14.0