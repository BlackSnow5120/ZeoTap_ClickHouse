import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Connection and source settings
  const [dataSource, setDataSource] = useState('ClickHouse');
  const [dataDirection, setDataDirection] = useState('ToClickHouse'); // ToClickHouse or FromClickHouse
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('9000');
  const [database, setDatabase] = useState('default');
  const [user, setUser] = useState('my_user');
  const [password, setPassword] = useState('my_password');
  const [token, setToken] = useState('');
  
  // CSV file settings
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  
  // Tables and columns
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableColumns, setTableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedCsvColumns, setSelectedCsvColumns] = useState([]);
  
  // Join settings (for bonus feature)
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);
  const [joinConditions, setJoinConditions] = useState(['']);
  const [tableColumnMap, setTableColumnMap] = useState({});
  const [selectedJoinColumns, setSelectedJoinColumns] = useState({});
  
  // Preview data
  const [previewData, setPreviewData] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  
  // Export settings
  const [exportFileName, setExportFileName] = useState('export.csv');
  const [targetTableName, setTargetTableName] = useState('');
  
  // Status and UI state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, connecting, fetching, ingesting, completed, error
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordsProcessed, setRecordsProcessed] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Token generation
  const [tokenPayload, setTokenPayload] = useState({
    sub: '',
    name: '',
    role: 'user',
    exp: 24
  });

  // Styles object (same as in the previous submission)
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    header: {
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '10px',
      marginBottom: '20px'
    },
    tabs: {
      display: 'flex',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd'
    },
    tab: {
      padding: '10px 20px',
      cursor: 'pointer',
      borderBottom: '3px solid transparent'
    },
    activeTab: {
      padding: '10px 20px',
      cursor: 'pointer',
      borderBottom: '3px solid #3498db',
      fontWeight: 'bold'
    },
    section: {
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '5px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    sectionTitle: {
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
      marginBottom: '15px',
      color: '#2c3e50'
    },
    formGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#34495e'
    },
    input: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      boxSizing: 'border-box',
      backgroundColor: '#fff'
    },
    fileInput: {
      padding: '5px 0'
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '10px 15px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginRight: '10px'
    },
    secondaryButton: {
      backgroundColor: '#2ecc71',
      color: 'white',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '10px'
    },
    dangerButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      padding: '10px 15px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold',
      marginRight: '10px',
      cursor: 'not-allowed'
    },
    statusBar: {
      padding: '10px',
      backgroundColor: '#eee',
      borderRadius: '4px',
      marginBottom: '15px'
    },
    messageSuccess: {
      padding: '10px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '4px',
      marginTop: '20px'
    },
    messageError: {
      padding: '10px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px',
      marginTop: '20px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: showTokenModal ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    modalHeader: {
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer'
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px'
    },
    flexRow: {
      display: 'flex',
      alignItems: 'center'
    },
    columnList: {
      height: '200px',
      overflow: 'auto',
      border: '1px solid #ddd',
      padding: '10px',
      borderRadius: '4px'
    },
    columnItem: {
      padding: '5px',
      margin: '2px 0',
      borderRadius: '3px',
      cursor: 'pointer'
    },
    selectedColumnItem: {
      padding: '5px',
      margin: '2px 0',
      borderRadius: '3px',
      cursor: 'pointer',
      backgroundColor: '#d1ecf1',
      color: '#0c5460'
    },
    flexBetween: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '15px',
      fontSize: '14px'
    },
    tableHeader: {
      backgroundColor: '#f2f2f2',
      padding: '8px',
      border: '1px solid #ddd',
      textAlign: 'left'
    },
    tableCell: {
      padding: '8px',
      border: '1px solid #ddd'
    },
    progressContainer: {
      width: '100%',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      marginTop: '15px',
      marginBottom: '15px'
    },
    progressBar: {
      backgroundColor: '#3498db',
      height: '20px',
      width: `${progress}%`,
      borderRadius: '4px',
      textAlign: 'center',
      lineHeight: '20px',
      color: 'white'
    }
  };

  // Reset UI state when switching data source or direction
  useEffect(() => {
    setSelectedTable('');
    setSelectedColumns([]);
    setTableColumns([]);
    setPreviewData([]);
    setPreviewColumns([]);
    setMessage('');
    setStatus('idle');
    setRecordsProcessed(0);
    setTargetTableName('');
    
    // Set default target table name based on file name if applicable
    if (file && dataDirection === 'ToClickHouse') {
      const baseFileName = fileName.split('.').slice(0, -1).join('.');
      setTargetTableName(baseFileName || 'imported_data');
    }
  }, [dataSource, dataDirection]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setExportFileName(`processed_${selectedFile.name}`);
      setCsvColumns([]);
      setSelectedCsvColumns([]);
      setPreviewData([]);
      
      // Set default target table name based on file name
      if (dataDirection === 'ToClickHouse') {
        const baseFileName = selectedFile.name.split('.').slice(0, -1).join('.');
        setTargetTableName(baseFileName || 'imported_data');
      }
    }
  };

  // Connect to ClickHouse and fetch tables
  const connectToClickHouse = async () => {
    setStatus('connecting');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/connect_clickhouse', {
        host,
        port,
        database,
        user,
        password,
        token
      });
      
      if (response.data.tables && response.data.tables.length > 0) {
        setAvailableTables(response.data.tables);
        setStatus('connected');
        setMessage(`Connected successfully. Found ${response.data.tables.length} tables.`);
      } else {
        setAvailableTables([]);
        setStatus('connected');
        setMessage('Connected successfully, but no tables found.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to connect to ClickHouse');
    } finally {
      setIsLoading(false);
    }
  };

  // Load table schema and columns
  const loadTableSchema = async () => {
    if (!selectedTable) return;
    
    setStatus('fetching');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/get_table_schema', {
        host,
        port,
        database,
        user,
        password,
        token,
        table: selectedTable
      });
      
      if (response.data.schema) {
        const columns = response.data.schema.map(col => col.name);
        setTableColumns(columns);
        setSelectedColumns(columns); // Select all by default
        setStatus('fetched');
        setMessage(`Loaded schema for table ${selectedTable}`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to load table schema');
    } finally {
      setIsLoading(false);
    }
  };

  // Preview ClickHouse table data
  const previewTableData = async () => {
    if (!selectedTable || selectedColumns.length === 0) return;
    
    setStatus('fetching');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/preview_table_data', {
        host,
        port,
        database,
        user,
        password,
        token,
        table: selectedTable,
        columns: selectedColumns
      });
      
      if (response.data.data) {
        setPreviewData(response.data.data);
        setPreviewColumns(response.data.columns);
        setStatus('fetched');
        setMessage(`Loaded preview data (${response.data.total_rows} rows)`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to preview table data');
    } finally {
      setIsLoading(false);
    }
  };

  // Preview CSV file data
  const previewCsvData = async () => {
    if (!file) return;
    
    setStatus('fetching');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('delimiter', delimiter);
    
    try {
      const response = await axios.post('http://localhost:5000/preview_csv_data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.data) {
        setPreviewData(response.data.data);
        setPreviewColumns(response.data.columns);
        setCsvColumns(response.data.columns);
        setSelectedCsvColumns(response.data.columns); // Select all by default
        setStatus('fetched');
        setMessage(`Loaded preview data (${response.data.total_rows} rows)`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to preview CSV data');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle column selection
  const toggleColumnSelection = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  // Toggle CSV column selection
  const toggleCsvColumnSelection = (column) => {
    if (selectedCsvColumns.includes(column)) {
      setSelectedCsvColumns(selectedCsvColumns.filter(col => col !== column));
    } else {
      setSelectedCsvColumns([...selectedCsvColumns, column]);
    }
  };

  // Select all columns
  const selectAllColumns = () => {
    if (dataSource === 'ClickHouse') {
      setSelectedColumns([...tableColumns]);
    } else {
      setSelectedCsvColumns([...csvColumns]);
    }
  };

  // Deselect all columns
  const deselectAllColumns = () => {
    if (dataSource === 'ClickHouse') {
      setSelectedColumns([]);
    } else {
      setSelectedCsvColumns([]);
    }
  };

  // Upload CSV to ClickHouse
  const uploadCsvToClickHouse = async () => {
    if (!file) {
      setErrorMessage('Please select a file first');
      return;
    }
    
    if (selectedCsvColumns.length === 0) {
      setErrorMessage('Please select at least one column');
      return;
    }
    
    setStatus('ingesting');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    setShowProgress(true);
    setProgress(10); // Start progress
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setProgress(30);
      const response = await axios.post(`http://localhost:5000/upload_csv_to_clickhouse`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          host,
          port,
          database,
          user,
          password,
          token,
          delimiter,
          table: targetTableName || 'imported_data',
          columns: selectedCsvColumns.join(',')
        }
      });
      
      setProgress(100);
      setStatus('completed');
      setMessage(response.data.message);
      setRecordsProcessed(response.data.records_processed || 0);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Error uploading file');
      setProgress(0);
      setShowProgress(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowProgress(false);
      }, 2000);
    }
  };

  // Export ClickHouse data to CSV
  const exportClickHouseToCsv = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      setErrorMessage('Please select a table and at least one column');
      return;
    }
    
    setStatus('ingesting');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    setShowProgress(true);
    setProgress(10);
    
    try {
      setProgress(30);
      const response = await axios.post('http://localhost:5000/export_clickhouse_to_csv', {
        host,
        port,
        database,
        user,
        password,
        token,
        table: selectedTable,
        columns: selectedColumns,
        filename: exportFileName,
        delimiter
      });
      
      setProgress(100);
      setStatus('completed');
      setMessage(response.data.message);
      setRecordsProcessed(response.data.records_processed || 0);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Error exporting data');
      setProgress(0);
      setShowProgress(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowProgress(false);
      }, 2000);
    }
  };

  // Open token generation modal
  const openTokenModal = () => {
    setShowTokenModal(true);
  };

  // Close token generation modal
  const closeTokenModal = () => {
    setShowTokenModal(false);
  };

  // Handle token payload changes
  const handleTokenPayloadChange = (field, value) => {
    setTokenPayload({
      ...tokenPayload,
      [field]: value
    });
  };

  // Generate JWT token
  const generateToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate_token', tokenPayload);
      setToken(response.data.token);
      closeTokenModal();
      setMessage('JWT token created successfully');
    } catch (error) {
      // Create a "fake" token if the backend endpoint fails
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
        sub: tokenPayload.sub,
        name: tokenPayload.name,
        role: tokenPayload.role,
        exp: Math.floor(Date.now() / 1000) + (tokenPayload.exp * 3600)
      }))}.DUMMY_SIGNATURE`;
      
      setToken(fakeToken);
      closeTokenModal();
      setMessage('Demo JWT token created successfully (not cryptographically valid)');
    }
  };

  // Toggle join section visibility
  const toggleJoinSection = () => {
    setShowJoinSection(!showJoinSection);
    if (!showJoinSection) {
      setSelectedTables([selectedTable]);
      setJoinConditions(['']);
    }
  };

  // Add a table to join
  const addTableToJoin = () => {
    setSelectedTables([...selectedTables, '']);
    setJoinConditions([...joinConditions, '']);
  };

  // Remove a table from join
  const removeTableFromJoin = (index) => {
    const updatedTables = [...selectedTables];
    updatedTables.splice(index, 1);
    setSelectedTables(updatedTables);
    
    const updatedConditions = [...joinConditions];
    updatedConditions.splice(index - 1, 1);
    setJoinConditions(updatedConditions);
  };

  // Handle join table selection change
  const handleJoinTableChange = (index, value) => {
    const updatedTables = [...selectedTables];
    updatedTables[index] = value;
    setSelectedTables(updatedTables);
    
    // Load columns for the selected table
    loadJoinTableColumns(value);
  };

  // Load columns for a join table
  const loadJoinTableColumns = async (tableName) => {
    if (!tableName) return;
    
    try {
      const response = await axios.post('http://localhost:5000/get_table_schema', {
        host,
        port,
        database,
        user,
        password,
        token,
        table: tableName
      });
      
      if (response.data.schema) {
        const columns = response.data.schema.map(col => col.name);
        setTableColumnMap({
          ...tableColumnMap,
          [tableName]: columns
        });
        
        // Initialize selected columns for this table
        setSelectedJoinColumns({
          ...selectedJoinColumns,
          [tableName]: columns
        });
      }
    } catch (error) {
      console.error(`Failed to load columns for table ${tableName}:`, error);
    }
  };

  // Handle join condition change
  const handleJoinConditionChange = (index, value) => {
    const updatedConditions = [...joinConditions];
    updatedConditions[index] = value;
    setJoinConditions(updatedConditions);
  };

  // Preview join result
  const previewJoinData = async () => {
    if (selectedTables.length < 2 || joinConditions.some(cond => !cond)) {
      setErrorMessage('Please select at least two tables and specify all join conditions');
      return;
    }
    
    setStatus('fetching');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/join_tables', {
        host,
        port,
        database,
        user,
        password,
        token,
        tables: selectedTables,
        join_conditions: joinConditions,
        columns: selectedJoinColumns,
        preview_only: true
      });
      
      if (response.data.data) {
        setPreviewData(response.data.data);
        setPreviewColumns(response.data.columns);
        setStatus('fetched');
        setMessage(`Loaded join preview data (${response.data.total_rows} rows)`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to preview join data');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute join and export to CSV
  const executeJoinExport = async () => {
    if (selectedTables.length < 2 || joinConditions.some(cond => !cond)) {
      setErrorMessage('Please select at least two tables and specify all join conditions');
      return;
    }
    
    setStatus('ingesting');
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');
    setShowProgress(true);
    setProgress(10);
    
    try {
      setProgress(30);
      const response = await axios.post('http://localhost:5000/join_tables', {
        host,
        port,
        database,
        user,
        password,
        token,
        tables: selectedTables,
        join_conditions: joinConditions,
        columns: selectedJoinColumns,
        preview_only: false
      });
      
      setProgress(100);
      setStatus('completed');
      setMessage(response.data.message);
      setRecordsProcessed(response.data.total_rows || 0);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Error executing join export');
      setProgress(0);
      setShowProgress(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowProgress(false);
      }, 2000);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Bidirectional ClickHouse & Flat File Data Ingestion Tool</h1>
      
      {/* Data source selection */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Select Data Source and Direction</h2>
        <div style={styles.grid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Data Source:</label>
            <select 
              style={styles.select} 
              value={dataSource} 
              onChange={(e) => setDataSource(e.target.value)}
            >
              <option value="ClickHouse">ClickHouse</option>
              <option value="FlatFile">Flat File</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Direction:</label>
            <select 
              style={styles.select} 
              value={dataDirection} 
              onChange={(e) => setDataDirection(e.target.value)}
            >
              <option value="ToClickHouse">To ClickHouse</option>
              <option value="FromClickHouse">From ClickHouse</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Connection parameters */}
      {(dataSource === 'ClickHouse' || dataDirection === 'ToClickHouse') && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. ClickHouse Connection Parameters</h2>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Host:</label>
              <input 
                type="text" 
                style={styles.input} 
                value={host} 
                onChange={(e) => setHost(e.target.value)} 
                placeholder="localhost"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Port:</label>
              <input 
                type="text" 
                style={styles.input} 
                value={port} 
                onChange={(e) => setPort(e.target.value)} 
                placeholder="9000"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Database:</label>
              <input 
                type="text" 
                style={styles.input} 
                value={database} 
                onChange={(e) => setDatabase(e.target.value)} 
                placeholder="default"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>User:</label>
              <input 
                type="text" 
                style={styles.input} 
                value={user} 
                onChange={(e) => setUser(e.target.value)} 
                placeholder="default"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password:</label>
              <input 
                type="password" 
                style={styles.input} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="password"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>JWT Token:</label>
              <div style={{ display: 'flex' }}>
                <input 
                  type="text" 
                  style={{ ...styles.input, flex: 1 }} 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  placeholder="JWT token"
                />
                <button 
                  type="button" 
                  style={styles.secondaryButton} 
                  onClick={openTokenModal}
                >
                  Create Token
                </button>
              </div>
            </div>
          </div>
          
          <button 
            style={isLoading ? styles.disabledButton : styles.button} 
            onClick={connectToClickHouse}
            disabled={isLoading}
          >
            Connect to ClickHouse
          </button>
        </div>
      )}
      
      {/* Flat File settings */}
      {(dataSource === 'FlatFile' || dataDirection === 'FromClickHouse') && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {dataDirection === 'ToClickHouse' ? '2. Flat File Source' : '3. Flat File Target'}
          </h2>
          <div style={styles.grid}>
            {dataDirection === 'ToClickHouse' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select CSV File:</label>
                <input 
                  type="file" 
                  style={styles.fileInput}
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileChange}
                />
              </div>
            )}
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Delimiter:</label>
              <select 
                style={styles.select} 
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
              >
                <option value=",">Comma (,)</option>
                <option value="\t">Tab</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            
            {dataDirection === 'FromClickHouse' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Export Filename:</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={exportFileName} 
                  onChange={(e) => setExportFileName(e.target.value)} 
                  placeholder="export.csv"
                />
              </div>
            )}
          </div>
          
          {dataDirection === 'ToClickHouse' && file && (
            <button 
              style={isLoading ? styles.disabledButton : styles.button} 
              onClick={previewCsvData}
              disabled={isLoading || !file}
            >
              Preview CSV Data
            </button>
          )}
        </div>
      )}
      
      {/* ClickHouse table selection */}
      {((dataSource === 'ClickHouse' && dataDirection === 'FromClickHouse') || 
        (dataSource === 'FlatFile' && dataDirection === 'ToClickHouse' && availableTables.length > 0)) && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {dataDirection === 'FromClickHouse' ? '3. ClickHouse Source' : '3. ClickHouse Target'}
          </h2>
          
          {dataDirection === 'FromClickHouse' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Table:</label>
              <select 
                style={styles.select} 
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  setTableColumns([]);
                  setSelectedColumns([]);
                }}
              >
                <option value="">-- Select a table --</option>
                {availableTables.map((table, index) => (
                  <option key={index} value={table}>{table}</option>
                ))}
              </select>
              
              {selectedTable && (
                <button 
                  style={{ ...styles.secondaryButton, marginTop: '10px' }} 
                  onClick={loadTableSchema}
                  disabled={isLoading || !selectedTable}
                >
                  Load Columns
                </button>
              )}
            </div>
          )}
          
          {dataDirection === 'ToClickHouse' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Target Table Name:</label>
              <input 
                type="text" 
                style={styles.input} 
                value={targetTableName} 
                onChange={(e) => setTargetTableName(e.target.value)} 
                placeholder="imported_data"
              />
            </div>
          )}
          
          {dataDirection === 'FromClickHouse' && showJoinSection === false && tableColumns.length > 0 && (
            <div style={styles.formGroup}>
              <div style={styles.flexBetween}>
                <label style={styles.label}>Select Columns:</label>
                <div>
                  <button 
                    style={styles.secondaryButton} 
                    onClick={selectAllColumns}
                  >
                    Select All
                  </button>
                  <button 
                    style={styles.secondaryButton} 
                    onClick={deselectAllColumns}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div style={styles.columnList}>
                {tableColumns.map((column, index) => (
                  <div 
                    key={index}
                    style={selectedColumns.includes(column) ? styles.selectedColumnItem : styles.columnItem}
                    onClick={() => toggleColumnSelection(column)}
                  >
                    {column}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dataDirection === 'FromClickHouse' && tableColumns.length > 0 && (
            <div style={styles.buttonRow}>
              <button 
                style={isLoading ? styles.disabledButton : styles.button} 
                onClick={previewTableData}
                disabled={isLoading || selectedColumns.length === 0}
              >
                Preview Table Data
              </button>
              
              <button 
                style={styles.secondaryButton} 
                onClick={toggleJoinSection}
              >
                {showJoinSection ? 'Hide Join Options' : 'Show Join Options'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Join tables section */}
      {dataDirection === 'FromClickHouse' && showJoinSection && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Advanced: Join Multiple Tables</h2>
          
          {selectedTables.map((table, index) => (
            <div key={index} style={{ marginBottom: '15px' }}>
              <div style={styles.flexBetween}>
                <h3>Table {index + 1}</h3>
                {index > 0 && (
                  <button 
                    style={styles.dangerButton} 
                    onClick={() => removeTableFromJoin(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Table:</label>
                <select 
                  style={styles.select} 
                  value={table}
                  onChange={(e) => handleJoinTableChange(index, e.target.value)}
                >
                  <option value="">-- Select a table --</option>
                  {availableTables.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              {index > 0 && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Join Condition:</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    value={joinConditions[index - 1]}
                    onChange={(e) => handleJoinConditionChange(index - 1, e.target.value)}
                    placeholder={`${selectedTables[0]}.id = ${table}.${selectedTables[0]}_id`}
                  />
                </div>
              )}
            </div>
          ))}
          
          <div style={styles.buttonRow}>
            <button 
              style={styles.secondaryButton} 
              onClick={addTableToJoin}
            >
              Add Another Table
            </button>
            
            <button 
              style={isLoading ? styles.disabledButton : styles.button} 
              onClick={previewJoinData}
              disabled={isLoading || selectedTables.length < 2 || joinConditions.some(cond => !cond)}
            >
              Preview Join Result
            </button>
          </div>
        </div>
      )}
      
      {/* CSV column selection */}
      {dataSource === 'FlatFile' && dataDirection === 'ToClickHouse' && csvColumns.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Select CSV Columns to Import</h2>
          
          <div style={styles.formGroup}>
            <div style={styles.flexBetween}>
              <label style={styles.label}>Select Columns:</label>
              <div>
                <button 
                  style={styles.secondaryButton} 
                  onClick={selectAllColumns}
                >
                  Select All
                </button>
                <button 
                  style={styles.secondaryButton} 
                  onClick={deselectAllColumns}
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div style={styles.columnList}>
              {csvColumns.map((column, index) => (
                <div 
                  key={index}
                  style={selectedCsvColumns.includes(column) ? styles.selectedColumnItem : styles.columnItem}
                  onClick={() => toggleCsvColumnSelection(column)}
                >
                  {column}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Data preview */}
      {previewData.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Data Preview</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {previewColumns.map((column, index) => (
                    <th key={index} style={styles.tableHeader}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {previewColumns.map((column, colIndex) => (
                      <td key={colIndex} style={styles.tableCell}>
                        {row[column] !== undefined ? String(row[column]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Status and progress */}
      {(status !== 'idle' || message || errorMessage) && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Status</h2>
          
          {status !== 'idle' && (
            <div style={styles.statusBar}>
              <strong>Status:</strong> {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'completed' && recordsProcessed > 0 && (
                <span> | {recordsProcessed} records processed</span>
              )}
            </div>
          )}
          
          {showProgress && (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                {progress}%
              </div>
            </div>
          )}
          
          {message && <div style={styles.messageSuccess}>{message}</div>}
          {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
        </div>
      )}
      
      {/* Action buttons */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Execute Data Transfer</h2>
        
        {dataDirection === 'ToClickHouse' && (
          <button 
            style={isLoading ? styles.disabledButton : styles.button} 
            onClick={uploadCsvToClickHouse}
            disabled={isLoading || !file || selectedCsvColumns.length === 0 || !targetTableName}
          >
            Upload CSV to ClickHouse
          </button>
        )}
        
        {dataDirection === 'FromClickHouse' && (
          <button 
            style={isLoading ? styles.disabledButton : styles.button} 
            onClick={showJoinSection ? executeJoinExport : exportClickHouseToCsv}
            disabled={isLoading || (!showJoinSection && (selectedColumns.length === 0 || !selectedTable)) || 
              (showJoinSection && (selectedTables.length < 2 || joinConditions.some(cond => !cond)))}
          >
            {showJoinSection ? 'Execute Join & Export' : 'Export ClickHouse Data to CSV'}
          </button>
        )}
      </div>
      
      {/* Token generation modal */}
      <div style={styles.modalOverlay} onClick={closeTokenModal}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>Generate JWT Token</h2>
            <button style={styles.closeButton} onClick={closeTokenModal}>&times;</button>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject (sub):</label>
            <input 
              type="text" 
              style={styles.input} 
              value={tokenPayload.sub} 
              onChange={(e) => handleTokenPayloadChange('sub', e.target.value)} 
              placeholder="user123"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Name:</label>
            <input 
              type="text" 
              style={styles.input} 
              value={tokenPayload.name} 
              onChange={(e) => handleTokenPayloadChange('name', e.target.value)} 
              placeholder="John Doe"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Role:</label>
            <select 
              style={styles.select} 
              value={tokenPayload.role}
              onChange={(e) => handleTokenPayloadChange('role', e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="readonly">Read Only</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiration (hours):</label>
            <input 
              type="number" 
              style={styles.input} 
              value={tokenPayload.exp} 
              onChange={(e) => handleTokenPayloadChange('exp', parseInt(e.target.value) || 1)} 
              min="1"
              max="720"
            />
          </div>
          
          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={generateToken}>Generate Token</button>
            <button style={styles.dangerButton} onClick={closeTokenModal}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
