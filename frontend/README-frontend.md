# Atlas HR Lookup Frontend

A polished React/Vite frontend for the serverless HR lookup assignment. It is intentionally backend-ready: it runs immediately in demo mode and switches to Cognito + API Gateway by changing environment variables.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. Demo mode includes sample records `1001`, `1002`, `1003`, and `1005`; the Sign in button simulates an authenticated session so the complete UI can be reviewed before AWS is connected.

## Connect AWS later

Set these values in `.env`:

```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
VITE_COGNITO_DOMAIN=https://<domain>.auth.<region>.amazoncognito.com
VITE_COGNITO_CLIENT_ID=<public-client-id>
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

The frontend expects:

```text
GET /employee/{id}
Authorization: Bearer <Cognito ID token>
```

The API response should contain `employeeId`, `name`, `salary`, `dateOfJoin`, and `description`.

For the deployed API Gateway UI, set the Cognito callback and logout URLs to the full deployed URL, including the stage and trailing slash.

## Structure

```text
src/App.jsx       Main interface and interaction state
src/api.js        Demo records, PKCE login, token storage, API lookup
src/styles.css    Responsive visual design
.env.example      AWS configuration template
```

## Security notes

- No AWS credentials are used in the browser.
- The browser sends a Cognito ID token to API Gateway.
- DynamoDB remains behind the backend Lambda.
- Tokens are stored in `sessionStorage` for this assignment frontend.
- Do not commit `.env` files or tokens to GitHub.
