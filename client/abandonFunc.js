const ldap = require('ldapjs');

class LDAP {

  constructor(url) {
    this.client = ldap.createClient({ url });
  }

  modifyDN(username, callback) {
    const dn = `cn=${username},ou=users,dc=netsecurityass,dc=com`;
    this.client.modifyDN(dn, 'cn=ba4r', (err) => {
      if (err) {
        console.error('Error modifying user DN:', err);
        callback(err);
      } else {
        console.log('User DN modified successfully');
        callback(null);
      }
    });
  }

  // Thêm các phương thức khác tương tác với LDAP ở đây
  createObject(objectname, objecttype, callback) {
    // objecttype = role, group
    const dn = `cn=${objectname},ou=${objecttype},dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    const entry = {
      cn: objectname,
      structuralObjectClass: 'posixGroup',
    };
    // if (objecttype === 'group') {
    //   entry.objectClass = 'posixGroup';
    // }
    // else if (objecttype === 'role') {
    //   entry.objectClass = 'organizationalRole';
    // }
    this.client.add(dn, entry, (err) => {
      if (err) {
        console.error(`Error creating ${objecttype}:`, err);
        return callback(err);
      } else {
        console.log(`${objecttype} created successfully`);
        return callback(null);
      }
    });
  }

  deleteObject(objectname, objecttype, callback) {
    // objecttype = role, group
    const dn = `cn=${objectname},ou=${objecttype},dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    this.client.del(dn, (err) => {
      if (err) {
        console.error(`Error deleting ${objecttype}:`, err);
        return callback(err);
      } else {
        console.log(`${objecttype} deleting successfully`);
        return callback(null);
      }
    });
  }

  createRole(rolename, callback) {
    this.createObject(rolename, 'role', callback);
  }

  createGroup(groupname, gid, callback) {
    const dn = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    const entry = {
      cn: groupname,
      gidNumber: gid,
      objectClass: 'posixGroup',
    };
    this.client.add(dn, entry, (err) => {
      if (err) {
        console.error('Error creating group:', err);
        return callback(err);
      } else {
        console.log('Group created successfully');
        return callback(null);
      }
    });
  }

  deleteRole(rolename, callback) {
    this.deleteObject(rolename, 'role', callback);
  }

  deleteGroup(groupname, callback) {
    const groupDN = `cn=${groupname},ou=groups,dc=netsecurityass,dc=com`;
    this.client.del(groupDN, (err) => {
      if (err) {
          console.error('Failed to delete group:', err);
          callback(err);
      } else {
          console.log(`Group ${groupname} deleted successfully.`);
          callback(null);
      }
    });
  }

  // Thêm các phương thức khác tương tác với LDAP ở đây
  createObject(objectname, objecttype, callback) {
    // objecttype = role, group
    const dn = `cn=${objectname},ou=${objecttype},dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    const entry = {
      cn: objectname,
      // objectClass: 'organizationalRole',
    };
    if (objecttype === 'group') {
      entry.objectClass = 'posixGroup';
    }
    else if (objecttype === 'role') {
      entry.objectClass = 'organizationalRole';
    }
    this.client.add(dn, entry, (err) => {
      if (err) {
        console.error(`Error creating ${objecttype}:`, err);
        return callback(err);
      } else {
        console.log(`${objecttype} created successfully`);
        return callback(null);
      }
    });
  }
  deleteObject(objectname, objecttype, callback) {
    // objecttype = role, group
    const dn = `cn=${objectname},ou=${objecttype},dc=netsecurityass,dc=com`; // Định danh cho người dùng mới
    this.client.del(dn, (err) => {
      if (err) {
        console.error(`Error deleting ${objecttype}:`, err);
        return callback(err);
      } else {
        console.log(`${objecttype} deleting successfully`);
        return callback(null);
      }
    });
  }

  // Role
  createRole(rolename, callback) {
    this.createObject(rolename, 'role', callback);
  }
  // asign role to user or group
  assignRole(role ,objectname, objecttype, callback) {
    const dn = `cn=${role},ou=role,dc=netsecurityass,dc=com`;
    let objectdn;
    if(objecttype === 'user') {
      objectdn = `cn=${objectname},ou=users,dc=netsecurityass,dc=com`;
    }
    else if(objecttype === 'group') {
      objectdn = `cn=${objectname},ou=groups,dc=netsecurityass,dc=com`;
    }
    const addRole = new ldap.Attribute({
      type: 'roleOccupant',
      values: objectdn
    });
    const change = new ldap.Change({
      operation: 'add',
      modification: addRole
    });
    

    this.client.modify(dn, change, (err) => {
      if (err) {
        console.error(`Error adding ${objecttype} to group:`, err);
        callback(err);
      } else {
        console.log(`${objecttype} added to group successfully`);
        callback(null);
      }
    });
  }

  deleteRole(rolename, callback) {
    this.deleteObject(rolename, 'role', callback);
  }

}

module.exports = LDAP;

////// Test

// const ldapClients = new LDAP('ldap://localhost:389');
// ldapClients.authenticateDN('cn=admin,dc=netsecurityass,dc=com', '1234', (err) => {
//   if (err) {
//     console.log('Authentication failed');
//   } else {
//     console.log('Authentication successful');
//   }
// });

// ldapClients.createGroup('Test_1', 800, (err) => {
//   if (err) {
//     console.log('Error creating group');
//   } else {
//     console.log('Group created successfully');
//   }
// });

// console.log(ldapClients.searchUsers());


// ldapClients.addUserToGroup('hr', (err) => {
//   if (err) {
//     console.log('Error adding user to group');
//   } else {
//     console.log('User added to group successfully');
//   }
// });

// ldapClients.createRole('Test 1', (err) => {
//   if (err) {
//     console.log('Error creating role');
//   } else {
//     console.log('Role created successfully');
//   }
// });

// ldapClients.deleteRole('Test Power', (err) => {
//   if (err) {
//     console.log('Error dl role');
//   } else {
//     console.log('Role dl successfully');
//   }
// });

