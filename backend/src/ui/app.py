HTML_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atlas HR Lookup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 700px;
            margin: 50px auto;
            padding: 20px;
        }

        input {
            padding: 10px;
            width: 250px;
        }

        button {
            padding: 10px 18px;
            cursor: pointer;
        }

        #result {
            margin-top: 25px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }

        .error {
            color: #b00020;
        }
    </style>
</head>
<body>
    <h1>Atlas HR Lookup</h1>

    <label for="employeeId">Employee ID:</label>
    <input id="employeeId" placeholder="Example: 1001">
    <button onclick="searchEmployee()">Search</button>

    <div id="result"></div>

    <script>
        async function searchEmployee() {
            const employeeId = document
                .getElementById("employeeId")
                .value
                .trim();

            const result = document.getElementById("result");

            if (!employeeId) {
                result.innerHTML = '<p class="error">Enter an Employee ID.</p>';
                return;
            }

            result.innerHTML = "<p>Searching...</p>";

            const apiBaseUrl = "https://upphdsm538.execute-api.us-east-1.amazonaws.com/Prod";
            const idToken = sessionStorage.getItem("atlas_id_token");

            try {
                const response = await fetch(
                    `${apiBaseUrl}/employee/${encodeURIComponent(employeeId)}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Accept": "application/json"
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Employee not found");
                }

                result.innerHTML = `
                    <h2>Employee Record</h2>
                    <p><strong>Employee ID:</strong> ${data.employeeId}</p>
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Salary:</strong> $${Number(data.salary).toLocaleString()}</p>
                    <p><strong>Date of Join:</strong> ${data.dateOfJoin}</p>
                    <p><strong>Description:</strong> ${data.description}</p>
                `;
            } catch (error) {
                result.innerHTML = `
                    <p class="error">${error.message}</p>
                `;
            }
        }
    </script>
</body>
</html>
"""


def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
        },
        "body": HTML_PAGE
    }