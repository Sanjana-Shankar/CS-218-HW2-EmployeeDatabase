import json
import os
from decimal import Decimal 

import boto3
from botocore.exceptions import ClientError


# This line below runs when the Lambda environment starts. AWS may reuse the same environment 
# for multiple requests, which avoids reconnecting unnecessarily for every request
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"]) # Creating the DynamoDB table connetion
# Table name is provided by the Lambda environment variable 
'''
Environment: 
    Variables:
        TABLE_NAME: !Ref EmployeeTable
'''

# Lambda function that handles GET /employee/{id}
def lambda_handler(event, context):
    # API gateway sends the path parameter in the event GET /employee/1001, {} for missing pathParameters object
    path_parameters = event.get("pathParameters") or {}
    employee_id = (path_parameters.get("id") or "").strip() # Removes accidental white space


    if not employee_id: # Handling a missing ID, if URL does not contain a valid ID, Lambda returns HTTP 400
        return response(400, {"message": "Employee ID is required"})

    try:
        # Performs key-based DynamoDB lookup, for Employee ID 1001, DynamoDB searches for EmployeeId = "1001"
        result = table.get_item(
            Key={"EmployeeID": employee_id},
            ConsistentRead=True, # Requests most current value rather than possibly reading a slightly older eventually consistent value
        )
        # DynamoDB designed for key-based access, does not scan the entire table
    except ClientError:
        print("DynamoDB lookup failed", exc_info=True)
        return response(500, {"message": "Unable to retrieve employee record"})

    item = result.get("Item") # If DynamoDB cannot find requested key, Item is missing and Lambda returns 404 Not Found
    if not item:
        return response(404, {"message": "Employee not found"})

    return response(
        200,
        {
            "employeeId": item["EmployeeID"],
            "name": item.get("Name", ""),
            "salary": item.get("Salary"),
            "dateOfJoin": item.get("DateOfJoin", ""),
            "description": item.get("Description", ""),
        },
    )


# Returns the HTTP response, formats the Lambda result for API Gateway
def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(body, default=json_default),
    }

def json_default(value):
    """Convert DynamoDB Decimal values into JSON-compatible numbers."""
    if isinstance(value, Decimal):
        # Salary values such as Decimal("92000") become 92000
        return int(value) if value % 1 == 0 else float(value)

    raise TypeError(
        f"Object of type {type(value).__name__} is not JSON serializable"
    )
