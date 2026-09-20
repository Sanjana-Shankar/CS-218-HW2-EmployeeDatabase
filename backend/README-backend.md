# HR Lookup Backend

This folder contains the AWS SAM backend for the HR lookup assignment.

It creates:

- DynamoDB table `hr-employees`
- Python employee lookup Lambda
- API Gateway REST API
- Cognito User Pool, public app client, and Managed Login domain
- Cognito authorizer protecting `GET /employee/{id}`
- Least-privilege Lambda permission for `dynamodb:GetItem`

## Prerequisites

Install and configure:

- AWS CLI
- AWS SAM CLI
- Python 3.12

Verify credentials:

```bash
aws sts get-caller-identity
sam --version
```

Do not put access keys in this repository. Use an AWS CLI profile, IAM Identity Center, or another approved credential method.

## Deploy

From this `backend` directory:

```bash
sam build
sam deploy --guided
```

Suggested guided-deployment values:

```text
Stack name: hr-lookup-dev
AWS Region: your selected region
CognitoDomainPrefix: a globally unique lowercase value, such as sanjana-hr-lookup-2026
CallbackUrl: http://localhost:5173/
LogoutUrl: http://localhost:5173/
Confirm changes before deploy: Y
Allow SAM CLI IAM role creation: Y
Disable rollback: N
Save arguments to samconfig.toml: Y
```

The domain prefix must be unique within the selected AWS Region. If the deployment fails because it is already taken, choose another prefix.

## Seed DynamoDB

After deployment, get the table name from the CloudFormation outputs or use the default name. Set your own information before running the script:

```bash
export AWS_USER_ARN="arn:aws:iam::<account-id>:user/<your-user-name>"
export STUDENT_NAME="Your Name"
export STUDENT_EMPLOYEE_ID="1005"
export TABLE_NAME="hr-employees"
python scripts/seed_data.py
```

If your AWS identity is an IAM user, retrieve the ARN with:

```bash
aws iam get-user --query 'User.Arn' --output text
```

## Create a Cognito test user

The stack creates the User Pool and public client, but the first user is easiest to create through the Cognito console. Open the User Pool shown in the stack outputs, choose Users, and create a user with an email and temporary password.

The Managed Login URL is:

```text
https://<domain-prefix>.auth.<region>.amazoncognito.com/login?client_id=<client-id>&response_type=code&scope=openid+email+profile&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2F
```

The React frontend already generates this URL and performs the PKCE token exchange when `VITE_DEMO_MODE=false`.

## Connect the React frontend

In the frontend `.env` file, set the API and Cognito outputs:

```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/Prod
VITE_COGNITO_DOMAIN=https://<domain-prefix>.auth.<region>.amazoncognito.com
VITE_COGNITO_CLIENT_ID=<user-pool-client-id>
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Restart Vite after changing `.env`.

## Test the API

Without a token, this should return `401 Unauthorized`:

```bash
curl -i https://<api-id>.execute-api.<region>.amazonaws.com/Prod/employee/1001
```

After logging in through the React application, the browser sends:

```text
Authorization: Bearer <Cognito ID token>
```

The expected successful response contains `employeeId`, `name`, `salary`, `dateOfJoin`, and `description`.

## Cleanup

After screenshots and testing:

```bash
sam delete --stack-name hr-lookup-dev --region <region>
```

Verify in the AWS console that the stack, DynamoDB table, Lambda, API Gateway API, Cognito User Pool, and generated IAM resources are gone.
