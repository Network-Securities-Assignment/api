const express = require('express');
const app = express();
var cors = require('cors');
const mongoose = require('mongoose');
const History = require('./history');

// Kết nối với MongoDB
mongoose.connect('mongodb://localhost:27018/historydb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));
  
const LDAP = require('./ldapfunction');

// Khởi tạo một đối tượng LDAP
const ldapClient = new LDAP('ldap://localhost:389');

// Middleware để xử lý JSON
app.use(express.json());
app.use(cors())

// Route để tạo sự kiện mới
app.post('/createEvent', async (req, res) => {
  const { action, details } = req.body;
  try {
    const newEvent = await History.createEvent(action, details);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Error creating event' });
  }
});

// Route để xem tất cả sự kiện
app.get('/viewEvents', async (req, res) => {
  try {
    const events = await History.viewEvents();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Route để xóa sự kiện dựa trên ID
app.delete('/deleteEvent/:eventId', async (req, res) => {
  const { eventId } = req.params;
  try {
    const deletedEvent = await History.deleteEvent(eventId);
    if (deletedEvent) {
      res.status(200).json(deletedEvent);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting event' });
  }
});

//////////////////////////////////////////////////////////////////////
// Route để tạo role mới
app.post('/createRole', (req, res) => {
  const { rolename } = req.body;

  // Gọi phương thức createRole từ đối tượng ldapClient
  ldapClient.createRole(rolename, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error creating role' });
    } else {
      res.status(200).json({ message: 'Role created successfully' });
    }
  });
});

// Route để gán role cho user hoặc group
app.post('/assignRole', (req, res) => {
  const { role, objectname, objecttype } = req.body;

  // Gọi phương thức assignRole từ đối tượng ldapClient
  ldapClient.assignRole(role, objectname, objecttype, (err) => {
    if (err) {
      res.status(500).json({ error: `Error assigning role to ${objecttype}` });
    } else {
      res.status(200).json({ message: `${objecttype} assigned to role successfully` });
    }
  });
});

// Route để xóa role
app.delete('/deleteRole/:rolename', (req, res) => {
  const { rolename } = req.params;

  // Gọi phương thức deleteRole từ đối tượng ldapClient
  ldapClient.deleteRole(rolename, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting role' });
    } else {
      res.status(200).json({ message: 'Role deleted successfully' });
    }
  });
});

//////////////////////////////////////////////////////////////////////

// Route để xác thực người dùng với LDAP
app.post('/authenticate', (req, res) => {
  const { username, password } = req.body;

  // Gọi phương thức authenticateDN từ đối tượng ldapClient
  ldapClient.authenticateDN(username, password, (err) => {
    if (err) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(200).json({ message: 'Authentication successful' });
    }
  });
});

// Route để tìm kiếm tất cả người dùng trong LDAP
app.get('/searchAllUsers', (req, res) => {
  // Gọi phương thức searchUser từ đối tượng ldapClient
  ldapClient.searchAllUsers((err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error searching all users' });
    } else {
      res.status(200).json({ users: result });
    }
  });
});

// Route để tìm kiếm tất cả group trong LDAP
app.get('/searchAllGroups', (req, res) => {
  // Gọi phương thức searchUser từ đối tượng ldapClient
  ldapClient.searchAllGroups((err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error searching all groups' });
    } else {
      res.status(200).json({ groups: result });
    }
  });
});

// Route để tạo người dùng trong LDAP
app.post('/createUser', (req, res) => {
  const {uidNumber, sn, givenName, gidNumber, mail, username, password} = req.body;
  // Gọi phương thức createUser từ đối tượng ldapClient
  ldapClient.createUser(uidNumber, sn, givenName, gidNumber, mail, username, password, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error creating user:' + err });
    } else {
      res.status(200).json({ message: 'User created successfully' });
    }
  });
});

app.post('/createGroup', (req, res) => {
  const {groupname, gid} = req.body;
  ldapClient.createGroup(groupname, gid, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error creating group' });
    } else {
      res.status(200).json({ message: 'Group created successfully' });
    }
  });
});

// Route để xóa người dùng trong LDAP
app.delete('/deleteUser/:username', (req, res) => {
  const { username } = req.params;

  // Gọi phương thức deleteUser từ đối tượng ldapClient
  ldapClient.deleteUser(username, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting user' });
    } else {
      res.status(200).json({ message: 'User deleted successfully' });
    }
  });
});

app.post('/removeAllUserFromGroups', (req, res) => {
  const userDN = `cn=tuanba,ou=users,dc=netsecurityass,dc=com`
  ldapClient.removeAllUserFromGroups(userDN, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting user' });
    } else {
      res.status(200).json({ message: 'User deleted successfully' });
    }
  })
})

// Route để xóa người dùng trong LDAP
app.delete('/deleteGroup/:groupname', (req, res) => {
  const { groupname } = req.params;

  // Gọi phương thức deleteUser từ đối tượng ldapClient
  ldapClient.deleteGroup(groupname, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting group' });
    } else {
      res.status(200).json({ message: 'Group deleted successfully' });
    }
  });
});


// Route để thêm người dùng vào nhóm trong LDAP
app.post('/addUserToGroup', (req, res) => {
  const { username, groupname } = req.body;

  // Gọi phương thức addUserToGroup từ đối tượng ldapClient
  ldapClient.addUserToGroup(username, groupname, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error adding user to group' });
    } else {
      res.status(200).json({ message: 'User added to group successfully' });
    }
  });
});


app.get('/searchUser/:username', (req, res) => {
  const { username } = req.params;
  
  ldapClient.searchUser(username, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error getting user' });
    } else {
      res.status(200).json({user: result});
    }
  });
});

app.get('/searchGroup/:groupName', (req, res) => {
  const { groupName } = req.params;
  
  ldapClient.searchGroup(groupName, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error getting user' });
    } else {
      res.status(200).json({group: result});
    }
  });
});

// Route để thêm nhieu` người dùng vào nhóm trong LDAP
app.post('/addManyUserToGroup', (req, res) => {
  const { userList, groupName } = req.body;
  console.log(userList, groupName)

  // Gọi phương thức addUserToGroup từ đối tượng ldapClient
  ldapClient.addManyUserToGroup(userList, groupName, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error adding user to group' });
    } else {
      res.status(200).json({ message: 'User added to group successfully' });
    }
  });
});

// Route để xóa người dùng khỏi nhóm trong LDAP
app.delete('/removeUserFromGroup', (req, res) => {
  const { userCN, groupName } = req.body;
  console.log(userCN, groupName)
  // Gọi phương thức deleteUserFromGroup từ đối tượng ldapClient
  ldapClient.removeUserFromGroup(userCN, groupName, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting user from group' });
    } else {
      res.status(200).json({ message: 'User deleted from group successfully' });
    }
  });
});


app.put('/updateUser/:username', (req,res) => {
  const {username} = req.params
  const {userData} = req.body
  console.log(userData)
  
  ldapClient.updateUser(username, userData, (err) => {
    if (err) res.status(500).json({ error: 'Error updating user' });
    else 
      res.status(200).json({ message: 'User updated successfully' });
  })
})

app.put('/updateGroup/:groupname', (req,res) => {
  const {groupname} = req.params
  const {groupData} = req.body
  console.log(groupData)
  
  ldapClient.updateGroup(groupname, groupData, (err) => {
    if (err) res.status(500).json({ error: 'Error updating group' });
    else 
      res.status(200).json({ message: 'Group updated successfully' });
  })
})


// // Route để cập nhật thuộc tính của người dùng trong LDAP
// app.put('/updateUser/:username', (req, res) => {
//   const { username } = req.params;
//   const { newname, newpassword} = req.body;
//   // Gọi phương thức updateUser từ đối tượng ldapClient
//   ldapClient.updateUser(username, newname, newpassword,(err) => {
//     if (err) {
//       res.status(500).json({ error: 'Error updating user' });
//     } else {
//       res.status(200).json({ message: 'User updated successfully' });
//     }
//   });
// });

// Route để so sánh người dùng trong LDAP
app.get('/compareUser/:username', (req, res) => {
  const { dn } = req.params;

  // Gọi phương thức compare từ đối tượng ldapClient
  ldapClient.compare(username, (err, matched) => {
    if (err) {
      res.status(500).json({ error: 'Error comparing user' });
    } else {
      res.status(200).json({ matched });
    }
  });
});

// Route để thay đổi DN của người dùng trong LDAP
app.put('/modifyDN/:username', (req, res) => {
  const { username } = req.params;

  // Gọi phương thức modifyDN từ đối tượng ldapClient
  ldapClient.modifyDN(username, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error modifying user DN' });
    } else {
      res.status(200).json({ message: 'User DN modified successfully' });
    }
  });
});

///History API






// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
