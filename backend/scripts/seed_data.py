import os
import sys

import boto3


TABLE_NAME = os.environ.get("TABLE_NAME", "hr-employees")
AWS_REGION = os.environ.get("AWS_REGION")
STUDENT_ID = os.environ.get("STUDENT_EMPLOYEE_ID", "1005")
STUDENT_NAME = os.environ.get("STUDENT_NAME", "Sanjana Shankar")
STUDENT_ARN = os.environ.get("AWS_USER_ARN", "arn:aws:iam::934747883187:user/hr-assignment-admin")


def main():
    if STUDENT_ARN == "REPLACE_WITH_YOUR_AWS_USER_ARN":
        sys.exit("Set AWS_USER_ARN before seeding the student record.")

    table = boto3.resource("dynamodb", region_name=AWS_REGION).Table(TABLE_NAME)
    records = [
        {
            "EmployeeID": "1001",
            "Name": "Alice Chen",
            "Salary": 92000,
            "DateOfJoin": "2024-01-15",
            "Description": "Cloud Engineering employee",
        },
        {
            "EmployeeID": "1002",
            "Name": "Marcus Williams",
            "Salary": 108500,
            "DateOfJoin": "2023-08-21",
            "Description": "Platform Reliability employee",
        },
        {
            "EmployeeID": "1003",
            "Name": "Priya Raman",
            "Salary": 101250,
            "DateOfJoin": "2022-11-07",
            "Description": "Data Products employee",
        },
        {
            "EmployeeID": STUDENT_ID,
            "Name": STUDENT_NAME,
            "Salary": 95000,
            "DateOfJoin": "2026-01-15",
            "Description": STUDENT_ARN,
        },
    ]

    with table.batch_writer() as batch:
        for record in records:
            batch.put_item(Item=record)

    print(f"Seeded {len(records)} employee records into {TABLE_NAME}.")


if __name__ == "__main__":
    main()
