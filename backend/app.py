from flask import Flask, request, jsonify
from flask_cors import CORS
from clickhouse_driver import Client
import pandas as pd
import jwt
import os
import datetime
import csv
import json

app = Flask(__name__)
CORS(app)

@app.route('/generate_token', methods=['POST'])
def generate_token():
    """Generate a JWT token for ClickHouse authentication"""
    try:
        # Get payload from request
        payload = request.json
        
        # Add issuance time
        payload['iat'] = datetime.datetime.utcnow()
        
        # Calculate expiration time from hours
        hours = payload.get('exp', 24)
        if isinstance(hours, int):
            expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=hours)
            payload['exp'] = expiry
        
        # In production, this would use a secure secret key stored in environment variables
        secret = "your_secret_key_here"  # For demo purposes only
        
        # Generate token
        token = jwt.encode(payload, secret, algorithm="HS256")
        
        return jsonify({"token": token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/connect_clickhouse', methods=['POST'])
def connect_clickhouse():
    """Test connection to ClickHouse and return available tables"""
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 9000))
        database = data.get('database', 'default')
        user = data.get('user', 'default')
        password = data.get('password', '')
        token = data.get('token', '')
        
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )
        
        # Test connection by fetching tables
        tables = client.execute("SHOW TABLES")
        
        # Return list of table names
        return jsonify({
            "status": "connected",
            "tables": [table[0] for table in tables]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_table_schema', methods=['POST'])
def get_table_schema():
    """Get schema (column names and types) for a ClickHouse table"""
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 9000))
        database = data.get('database', 'default')
        user = data.get('user', 'default')
        password = data.get('password', '')
        token = data.get('token', '')
        table_name = data.get('table', '')
        
        if not table_name:
            return jsonify({"error": "No table specified"}), 400
            
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )
        
        # Get column information
        columns = client.execute(f"DESCRIBE TABLE {table_name}")
        
        # Return column names and types
        schema = [{"name": col[0], "type": col[1]} for col in columns]
        return jsonify({
            "schema": schema
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/preview_table_data', methods=['POST'])
def preview_table_data():
    """Preview data from a ClickHouse table (first 100 rows)"""
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 9000))
        database = data.get('database', 'default')
        user = data.get('user', 'default')
        password = data.get('password', '')
        token = data.get('token', '')
        table_name = data.get('table', '')
        columns = data.get('columns', [])
        
        if not table_name:
            return jsonify({"error": "No table specified"}), 400
            
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )
        
        # Prepare columns for SELECT statement
        column_str = "*"
        if columns and len(columns) > 0:
            column_str = ", ".join(columns)
        
        # Fetch first 100 rows
        query = f"SELECT {column_str} FROM {table_name} LIMIT 100"
        rows = client.execute(query, with_column_types=True)
        
        # Format results for JSON response
        column_names = [col[0] for col in rows[1]]
        data_rows = rows[0]
        
        # Format data as list of dictionaries
        result = []
        for row in data_rows:
            row_dict = {col: str(val) if val is not None else None for col, val in zip(column_names, row)}
            result.append(row_dict)
        
        return jsonify({
            "columns": column_names,
            "data": result,
            "total_rows": len(result)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/preview_csv_data', methods=['POST'])
def preview_csv_data():
    """Preview data from a CSV file (first 100 rows)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    delimiter = request.form.get('delimiter', ',')

    try:
        # Read CSV into DataFrame with limited rows
        df = pd.read_csv(file, delimiter=delimiter, nrows=100)
        
        # Convert DataFrame to dictionary for JSON response
        result = df.to_dict(orient='records')
        
        return jsonify({
            "columns": df.columns.tolist(),
            "data": result,
            "total_rows": len(result)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload_csv_to_clickhouse', methods=['POST'])
def upload_csv_to_clickhouse():
    """Upload CSV file to ClickHouse"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    # Get ClickHouse connection parameters
    host = request.args.get('host', 'localhost')
    port = int(request.args.get('port', 9000))
    database = request.args.get('database', 'default')
    user = request.args.get('user', 'default')
    password = request.args.get('password', '')
    token = request.args.get('token', '')
    table_name = request.args.get('table', 'dynamic_table')
    delimiter = request.args.get('delimiter', ',')
    selected_columns = request.args.get('columns', '')
    
    # Parse selected columns if provided
    columns_to_use = None
    if selected_columns:
        columns_to_use = selected_columns.split(',')

    try:
        # Read CSV into DataFrame
        df = pd.read_csv(file, delimiter=delimiter, usecols=columns_to_use)
        
        # Check if we have data
        if df.empty:
            return jsonify({'error': 'No data found in CSV file'}), 400
        
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )

        # Get column names from DataFrame
        column_names = df.columns.tolist()

        # Dynamically generate the table schema
        create_columns = []
        for col in column_names:
            # Determine data type based on DataFrame column types
            if pd.api.types.is_numeric_dtype(df[col]):
                if pd.api.types.is_integer_dtype(df[col]):
                    create_columns.append(f"`{col}` Int64")
                else:
                    create_columns.append(f"`{col}` Float64")
            else:
                create_columns.append(f"`{col}` String")
                
        create_columns_query = ", ".join(create_columns)

        # Create the table in ClickHouse
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {create_columns_query}
        ) ENGINE = MergeTree()
        ORDER BY {column_names[0]}
        """

        client.execute(create_table_query)

        # Convert DataFrame to list of tuples for insertion
        # Handle different data types appropriately
        data = df.replace({pd.NA: None}).values.tolist()

        # Insert data into the table
        escaped_columns = [f"`{col}`" for col in column_names]
        insert_query = f"INSERT INTO {table_name} ({', '.join(escaped_columns)}) VALUES"
        client.execute(insert_query, data)

        return jsonify({
            'message': f'CSV uploaded and ingested successfully with {len(data)} records.',
            'records_processed': len(data)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export_clickhouse_to_csv', methods=['POST'])
def export_clickhouse_to_csv():
    """Export data from ClickHouse to CSV"""
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 9000))
        database = data.get('database', 'default')
        user = data.get('user', 'default')
        password = data.get('password', '')
        token = data.get('token', '')
        table_name = data.get('table', '')
        columns = data.get('columns', [])
        filename = data.get('filename', 'export.csv')
        delimiter = data.get('delimiter', ',')
        
        if not table_name:
            return jsonify({"error": "No table specified"}), 400
            
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )
        
        # Prepare columns for SELECT statement
        column_str = "*"
        if columns and len(columns) > 0:
            column_str = ", ".join([f"`{col}`" for col in columns])
        
        # Fetch data
        query = f"SELECT {column_str} FROM {table_name}"
        result = client.execute(query, with_column_types=True)
        
        column_names = [col[0] for col in result[1]]
        data_rows = result[0]
        
        # Ensure output directory exists
        os.makedirs("exports", exist_ok=True)
        
        # Write data to CSV file
        output_path = os.path.join("exports", filename)
        with open(output_path, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile, delimiter=delimiter)
            writer.writerow(column_names)
            writer.writerows(data_rows)
        
        return jsonify({
            'message': f'Data exported successfully with {len(data_rows)} records.',
            'records_processed': len(data_rows),
            'file_path': output_path
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/join_tables', methods=['POST'])
def join_tables():
    """Join multiple ClickHouse tables and preview/export data"""
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 9000))
        database = data.get('database', 'default')
        user = data.get('user', 'default')
        password = data.get('password', '')
        token = data.get('token', '')
        tables = data.get('tables', [])
        join_conditions = data.get('join_conditions', [])
        columns = data.get('columns', {})
        preview_only = data.get('preview_only', True)
        
        if not tables or len(tables) < 2:
            return jsonify({"error": "At least two tables are required for a join"}), 400
            
        if len(join_conditions) < len(tables) - 1:
            return jsonify({"error": "Insufficient join conditions"}), 400
            
        # Create client with JWT token if provided
        settings = {}
        if token:
            settings = {'jwt_token': token}
            
        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            settings=settings
        )
        
        # Construct column list for SELECT
        selected_columns = []
        for table, cols in columns.items():
            for col in cols:
                selected_columns.append(f"{table}.{col} as {table}_{col}")
                
        if not selected_columns:
            selected_columns = ["*"]
            
        column_str = ", ".join(selected_columns)
        
        # Construct JOIN query
        query = f"SELECT {column_str} FROM {tables[0]}"
        
        for i, table in enumerate(tables[1:], 1):
            join_condition = join_conditions[i-1]
            query += f" JOIN {table} ON {join_condition}"
            
        # Add LIMIT for preview
        if preview_only:
            query += " LIMIT 100"
            
        # Execute query
        result = client.execute(query, with_column_types=True)
        
        column_names = [col[0] for col in result[1]]
        data_rows = result[0]
        
        # Format data as list of dictionaries
        formatted_data = []
        for row in data_rows:
            row_dict = {col: str(val) if val is not None else None for col, val in zip(column_names, row)}
            formatted_data.append(row_dict)
            
        response_data = {
            "columns": column_names,
            "data": formatted_data,
            "total_rows": len(formatted_data)
        }
        
        # If not preview, export to CSV
        if not preview_only:
            filename = f"join_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            os.makedirs("exports", exist_ok=True)
            output_path = os.path.join("exports", filename)
            
            with open(output_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(column_names)
                writer.writerows(data_rows)
                
            response_data["file_path"] = output_path
            response_data["message"] = f"Join exported successfully with {len(data_rows)} records."
            
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)