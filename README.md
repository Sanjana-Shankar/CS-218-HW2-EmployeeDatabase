# Atlas HR Lookup

Atlas HR Lookup is a serverless employee-directory application for the AWS HR lookup assignment.

An authenticated user enters an Employee ID, and the application retrieves the matching employee record from DynamoDB through a Cognito-protected API Gateway REST API.

The browser never connects directly to DynamoDB, and AWS credentials are never stored in the frontend.

## Features

- React/Vite employee lookup interface
- Amazon Cognito Managed Login
- OAuth 2.0 Authorization Code Grant
- PKCE authentication
- Cognito ID token sent as a Bearer token
- API Gateway REST API
- Cognito authorizer protecting `GET /employee/{id}`
- Python 3.12 Lambda function
- DynamoDB key-based lookup using `GetItem`
- Least-privilege IAM permissions
- Student employee record containing the student's AWS user ARN
- Invalid Employee ID handling
- CORS configuration
- GitHub-safe secret handling

## Repository Structure

```text
.
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── src/
│   ├── App.jsx
│   ├── api.js
│   ├── main.jsx
│   └── styles.css
├── backend/
│   ├── template.yaml
│   ├── requirements.txt
│   ├── scripts/
│   │   └── seed_data.py
│   └── src/
│       └── employee/
│           └── app.py
└── docs/
    └── architecture-diagram.svg
```

## Application Architecture

```text
React Browser
     |
     | HTTPS
     | Authorization: Bearer <Cognito ID Token>
     v
API Gateway REST API
GET /employee/{id}
     |
     v
Cognito Authorizer
     |
     | Valid token
     v
Employee Lambda
     |
     | IAM execution role
     | dynamodb:GetItem only
     v
DynamoDB
Table: hr-employees
Partition Key: EmployeeID
```

The browser does not have permission to access DynamoDB directly.

## Important Architecture Note

The current repository uses React/Vite for the frontend and API Gateway for the backend API.

The SAM template currently creates:

```text
GET /employee/{id}
```

The current SAM template does not create a separate UI Lambda or a `GET /` API Gateway route. If the instructor strictly requires a UI Lambda for `GET /`, that component must be added separately before submission.

Do not claim that a UI Lambda is deployed unless it exists in `backend/template.yaml` and in the deployed CloudFormation stack.

# Prerequisites

Install the following software:

- Node.js and npm
- Python 3.12
- AWS CLI v2
- AWS SAM CLI
- boto3
- An AWS account
- An AWS CLI profile with deployment permissions

Official installation guides:

- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/en/download

## macOS Installation

If Homebrew is installed:

```bash
brew update
brew install python@3.12 node awscli aws-sam-cli
```

If the SAM CLI formula is unavailable, install it using the official AWS SAM CLI installer.

Verify the installations:

```bash
node --version
npm --version
python3 --version
aws --version
sam --version
```

## Ubuntu or Debian Linux Installation

Install Python, Node.js, npm, and required utilities:

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip nodejs npm unzip curl
```

Install AWS CLI v2:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
  -o "/tmp/awscliv2.zip"

unzip -q /tmp/awscliv2.zip -d /tmp

sudo /tmp/aws/install
```

Install AWS SAM CLI using the Linux instructions from:

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

Verify the installations:

```bash
node --version
npm --version
python3 --version
pip3 --version
aws --version
sam --version
```

## Windows Installation

Install the following using the official installers:

- AWS CLI v2
- AWS SAM CLI
- Python 3.12
- Node.js LTS

After installation, open a new PowerShell window:

```powershell
node --version
npm --version
python --version
pip --version
aws --version
sam --version
```

# AWS CLI Configuration

Do not use the AWS root account for everyday deployment.

Configure an AWS CLI profile:

```bash
aws configure --profile hr-assignment-admin
```

Enter:

```text
AWS Access Key ID
AWS Secret Access Key
Default region name: us-east-1
Default output format: json
```

Never commit these values to GitHub.

Verify the configured AWS identity:

```bash
aws sts get-caller-identity \
  --profile hr-assignment-admin \
  --region us-east-1
```

Expected output contains your AWS account ID and ARN.

# Install Python Dependencies

From the repository root, create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Upgrade pip:

```bash
python -m pip install --upgrade pip
```

Install the backend dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

The requirements file installs `boto3`, which is used by:

```text
backend/scripts/seed_data.py
```

The deployed Lambda runtime already includes AWS SDK support, but installing boto3 locally allows the seed script to run.

# Install Frontend Dependencies

From the repository root:

```bash
npm install
```

# Deploy the AWS Backend

Move into the backend directory:

```bash
cd backend
```

Set the AWS profile and Region:

```bash
export AWS_PROFILE=hr-assignment-admin
export AWS_DEFAULT_REGION=us-east-1
```

On Windows PowerShell:

```powershell
$env:AWS_PROFILE="hr-assignment-admin"
$env:AWS_DEFAULT_REGION="us-east-1"
```

Build the SAM application:

```bash
sam build
```

Deploy the application:

```bash
sam deploy --guided
```

Use the following suggested values:

```text
Stack name: hr-lookup-dev
AWS Region: us-east-1
CognitoDomainPrefix: a unique lowercase domain prefix
CallbackUrl: http://localhost:5173/
LogoutUrl: http://localhost:5173/
Confirm changes before deploy: Y
Allow SAM CLI IAM role creation: Y
Disable rollback: N
Save arguments to samconfig.toml: Y
```

The Cognito domain prefix must be globally unique within the AWS Region.

Example:

```text
sanjana-hr-lookup-2026
```

After deployment, view the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name hr-lookup-dev \
  --region us-east-1 \
  --profile hr-assignment-admin \
  --query 'Stacks[0].Outputs' \
  --output table
```

Record these values:

- API Gateway URL
- Employee API endpoint
- DynamoDB table name
- Cognito User Pool ID
- Cognito Client ID
- Cognito Managed Login domain

# DynamoDB Configuration

The SAM template creates the following table:

```text
Table name: hr-employees
Partition key: EmployeeID
Key type: String
```

Each item contains:

```json
{
  "EmployeeID": "1001",
  "Name": "Alice Chen",
  "Salary": 92000,
  "DateOfJoin": "2024-01-15",
  "Description": "Cloud Engineering employee"
}
```

# Retrieve the AWS User ARN

For an IAM user:

```bash
aws iam get-user \
  --profile hr-assignment-admin \
  --query 'User.Arn' \
  --output text
```

You may also check your current AWS identity:

```bash
aws sts get-caller-identity \
  --profile hr-assignment-admin
```

If the result is an assumed-role ARN instead of an IAM user ARN, confirm with your instructor which ARN format is required.

# Seed DynamoDB Records

Set the required environment variables.

macOS/Linux:

```bash
export AWS_PROFILE=hr-assignment-admin
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export TABLE_NAME=hr-employees
export STUDENT_EMPLOYEE_ID=1005
export STUDENT_NAME="Sanjana Shankar"
export AWS_USER_ARN="arn:aws:iam::<account-id>:user/<your-user-name>"
```

Windows PowerShell:

```powershell
$env:AWS_PROFILE="hr-assignment-admin"
$env:AWS_DEFAULT_REGION="us-east-1"
$env:AWS_REGION="us-east-1"
$env:TABLE_NAME="hr-employees"
$env:STUDENT_EMPLOYEE_ID="1005"
$env:STUDENT_NAME="Sanjana Shankar"
$env:AWS_USER_ARN="arn:aws:iam::<account-id>:user/<your-user-name>"
```

Run the seed script from the `backend` directory:

```bash
python3 scripts/seed_data.py
```

On Windows:

```powershell
python scripts\seed_data.py
```

The script creates these records:

```text
1001 - Alice Chen
1002 - Marcus Williams
1003 - Priya Raman
1005 - Student record
```

The student record contains:

- The student's name
- The student's Employee ID
- The student's AWS user ARN in `Description`

Verify the student record:

```bash
aws dynamodb get-item \
  --table-name hr-employees \
  --key '{"EmployeeID":{"S":"1005"}}' \
  --region us-east-1 \
  --profile hr-assignment-admin
```

# Create a Cognito User

The SAM deployment creates:

- Cognito User Pool
- Public Cognito app client
- Cognito Managed Login domain
- OAuth authorization code configuration
- PKCE-compatible public client

Create a test user:

1. Open the AWS Cognito console.
2. Select Region `us-east-1`.
3. Open the `hr-lookup-users` User Pool.
4. Select **Users**.
5. Choose **Create user**.
6. Enter an email address.
7. Create a password.
8. Verify the email if required.

The Cognito client must use:

```text
Client type: Public client
Client secret: None
OAuth flow: Authorization code grant
Scopes: openid, email, profile
Callback URL: http://localhost:5173/
Logout URL: http://localhost:5173/
```

# Configure the React Frontend

From the repository root:

```bash
cp .env.example .env
```

Open `.env` and configure it with the CloudFormation outputs:

```env
VITE_DEMO_MODE=false

VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/Prod

VITE_COGNITO_DOMAIN=https://<domain-prefix>.auth.us-east-1.amazoncognito.com

VITE_COGNITO_CLIENT_ID=<public-cognito-client-id>

VITE_COGNITO_REDIRECT_URI=http://localhost:5173/

VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Example:

```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://upphdsm538.execute-api.us-east-1.amazonaws.com/Prod
VITE_COGNITO_DOMAIN=https://sanjana-hr-lookup-2026.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=exampleclientid123
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

The Cognito client ID and domain are not secrets. Never add the following to `.env` or GitHub:

- AWS access keys
- AWS secret keys
- Cognito client secrets
- Passwords
- ID tokens
- Access tokens
- Refresh tokens

Restart the frontend after modifying `.env`:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

# Authentication Flow

The authentication flow is:

1. The user clicks **Sign in**.
2. React generates a PKCE code verifier.
3. React generates a SHA-256 code challenge.
4. The browser redirects to Cognito Managed Login.
5. The user authenticates.
6. Cognito redirects back with an authorization code.
7. React exchanges the code and PKCE verifier for tokens.
8. React stores the ID token in `sessionStorage`.
9. React sends the ID token to API Gateway.
10. API Gateway's Cognito authorizer validates the token.
11. API Gateway invokes the Lambda only if authentication succeeds.
12. Lambda uses its IAM execution role to call DynamoDB.
13. DynamoDB returns the employee record.
14. Lambda returns the employee data to the browser.

The browser never receives DynamoDB permissions.

# API Endpoint

The application uses:

```text
GET /employee/{id}
```

Example:

```text
GET https://<api-id>.execute-api.us-east-1.amazonaws.com/Prod/employee/1001
```

The request must include:

```http
Authorization: Bearer <Cognito ID token>
```

Successful response:

```json
{
  "employeeId": "1001",
  "name": "Alice Chen",
  "salary": 92000,
  "dateOfJoin": "2024-01-15",
  "description": "Cloud Engineering employee"
}
```

Unknown Employee ID:

```json
{
  "message": "Employee not found"
}
```

# Testing

## Test 1: Application Access

Run the frontend:

```bash
npm run dev
```

Open the displayed Vite URL.

Expected result:

```text
The React HR lookup interface loads successfully.
```

## Test 2: Cognito Authentication

1. Click **Sign in**.
2. Authenticate through Cognito Managed Login.
3. Confirm that Cognito redirects to the frontend.
4. Confirm that the UI displays `Authenticated`.

## Test 3: Valid Employee Lookup

Search for:

```text
1001
```

Expected result:

- Employee ID is displayed
- Name is displayed
- Salary is displayed
- Date of Join is displayed
- Description is displayed

## Test 4: Student Employee Record

Search for:

```text
1005
```

Expected result:

- Student name is displayed
- Student AWS user ARN is displayed in the Description field

## Test 5: Invalid Employee ID

Search for:

```text
9999
```

Expected result:

```text
Employee not found
```

The API should return HTTP `404`.

## Test 6: Unauthorized API Request

Call the API without a token:

```bash
curl -i \
  https://<api-id>.execute-api.us-east-1.amazonaws.com/Prod/employee/1001
```

Expected result:

```text
401 Unauthorized
```

No employee data should be returned.

## Test 7: CORS Preflight

```bash
curl -i -X OPTIONS \
  https://<api-id>.execute-api.us-east-1.amazonaws.com/Prod/employee/1001 \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

The response should contain an `Access-Control-Allow-Origin` header.

# Lambda Logs

View Lambda logs:

```bash
cd backend

sam logs \
  -n EmployeeFunction \
  --stack-name hr-lookup-dev \
  --tail
```

If you see:

```text
TypeError: Object of type Decimal is not JSON serializable
```

confirm that `backend/src/employee/app.py` contains:

```python
from decimal import Decimal
```

and:

```python
"body": json.dumps(body, default=json_default),
```

along with:

```python
def json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)

    raise TypeError(
        f"Object of type {type(value).__name__} is not JSON serializable"
    )
```

Then rebuild and redeploy:

```bash
cd backend
sam build
sam deploy
```

# Common Problems

## Failed to fetch

Check:

- The API URL in `.env`
- CORS configuration
- Whether the API was redeployed after template changes
- Whether the Lambda is returning a `502`
- Whether the browser is sending a valid ID token

## Employee not found

Check:

- The DynamoDB table name
- Whether `seed_data.py` was executed
- Whether the ID exists
- Whether `EmployeeID` is stored as a String
- Whether the correct AWS Region is being used

## Invalid grant

Clear old login state:

1. Open browser Developer Tools.
2. Open the **Application** tab.
3. Select **Session Storage**.
4. Select `http://localhost:5173`.
5. Clear the stored values.
6. Reload the page.
7. Start a new Cognito login.

You can also run this in the browser Console:

```javascript
sessionStorage.clear();
location.reload();
```

# Cleanup

After screenshots and testing are complete, delete the deployed AWS resources:

```bash
sam delete \
  --stack-name hr-lookup-dev \
  --region us-east-1 \
  --profile hr-assignment-admin
```

Verify that the following resources have been removed:

- API Gateway REST API
- Lambda function
- DynamoDB table
- Cognito User Pool
- Cognito app client
- Cognito domain
- IAM execution role
- CloudFormation stack

Keep your source code, documentation, screenshots, and GitHub repository.

# AI Assistance Disclosure

AI assistance was used for:

- React frontend scaffolding
- AWS SAM configuration
- Cognito PKCE authentication guidance
- Lambda and DynamoDB debugging
- CORS troubleshooting
- README and architecture documentation

All generated code was reviewed, tested, and adapted by the student. The student remains responsible for the AWS account, credentials, Cognito users, employee data, screenshots, testing, and final submission.