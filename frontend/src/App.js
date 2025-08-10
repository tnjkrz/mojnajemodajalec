import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8210/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('Error fetching users:', err));
  }, []);


  return (
    <div className="App">
      <h1>Users</h1>
      {users.length > 0 ? (
        <ul>
          {users.map((user, index) => (
            <li key={index}>
              {Object.entries(user).map(([key, value]) => (
                <span key={key}>
                  <strong>{key}</strong>: {value}{" | "}
                </span>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}

export default App;
