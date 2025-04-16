Here's a `README.md` for setting up a Python backend and React frontend project that connects to ClickHouse with options for data source, direction, and data transfer configurations.

```markdown
# ClickHouse Data Transfer App

This project enables users to transfer data between ClickHouse and a CSV file. It offers the ability to either export data from ClickHouse to CSV or upload CSV data into ClickHouse.

The frontend is built using **React** and the backend is implemented using **Python** with **Flask**. The app allows the user to configure ClickHouse connection parameters, select a data direction (either to or from ClickHouse), and manage CSV exports.

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (version 14 or above)
- **npm** (Node Package Manager)
- **Python** (version 3.6 or above)
- **ClickHouse Database** (for the backend API to connect to)
- **pip** (Python package installer)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/clickhouse-data-transfer.git
cd clickhouse-data-transfer
```

### 2. Install Frontend Dependencies

Navigate to the `frontend` directory and install the required dependencies:

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

Navigate to the `backend` directory and install the required dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## Running the Project

### 1. Start the Backend (Python Flask)

Navigate to the `backend` directory and run the Flask app:

```bash
cd backend
python app.py
```

By default, the backend will run on `http://localhost:5000`.

### 2. Start the Frontend (React)

Navigate to the `frontend` directory and run the React app:

```bash
cd frontend
npm start
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Set Up ClickHouse

Ensure your ClickHouse instance is running and accessible from both the frontend and backend. You will need the following details:

- **Host**: `localhost` (or the address of your ClickHouse instance)
- **Port**: `9000` (default port)
- **Database**: `default` (or your custom database)
- **User**: `my_user`
- **Password**: `your_password`
- **JWT Token**: Used for secure authentication.

### 4. Using the App

#### Step 1: Select Data Source and Direction

- **Data Source**: Choose `ClickHouse` (to connect to ClickHouse for data transfer).
- **Direction**: Choose one of the following options:
  - **To ClickHouse**: Upload data from CSV to ClickHouse.
  - **From ClickHouse**: Export data from ClickHouse to CSV.

#### Step 2: ClickHouse Connection Parameters

Provide the ClickHouse connection details:
- **Host**: `localhost` (or your ClickHouse server host).
- **Port**: `9000` (default).
- **Database**: `default` (or your database name).
- **User**: `my_user` (your ClickHouse username).
- **Password**: `your_password`.
- **JWT Token**: Provide the JWT token for authentication.
  - You can create a JWT token using the frontend.

#### Step 3: Execute Data Transfer

- **For Uploading CSV to ClickHouse**: Select a CSV file and execute the data transfer.
- **For Exporting Data from ClickHouse to CSV**: 
  - Choose the **Flat File Target** options:
    - **Delimiter**: Choose the delimiter for the CSV file (e.g., `Comma (,)`).
    - **Export Filename**: Provide a filename for the CSV export (e.g., `export.csv`).
  - Select the **ClickHouse Source** and choose the table you want to export.

### 5. Data Transfer Process

Once the required configurations are selected, click the "Execute Data Transfer" button to either:
- Upload data from a CSV file to ClickHouse.
- Export data from ClickHouse to a CSV file.

#### CSV Upload to ClickHouse
The data in the CSV file will be parsed and uploaded to the selected ClickHouse table.

#### Export from ClickHouse to CSV
The data from the selected table will be fetched from ClickHouse and saved to the provided CSV file.

## Troubleshooting

### Common Issues:
- **Connection Errors**: Ensure the backend can access the ClickHouse instance and the credentials are correct.
- **Slow Data Transfer**: If exporting large datasets, the process might take longer. Consider optimizing your ClickHouse queries or the server resources.
- **JWT Token Issues**: If JWT authentication fails, regenerate the token using the frontend's "Create Token" button.

## Running Tests

#### Frontend Tests

To run tests for the frontend:

```bash
cd frontend
npm test
```

#### Backend Tests

To run tests for the backend:

```bash
cd backend
python -m unittest discover
```

## Contributing

If you'd like to contribute, feel free to fork the repository, make your changes, and submit a pull request. You can also report issues or suggest features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

This `README.md` includes detailed instructions on how to run the project, set up ClickHouse, and use the frontend and backend to transfer data between ClickHouse and CSV files.
